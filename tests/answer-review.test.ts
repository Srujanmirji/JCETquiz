import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { PGlite } from "@electric-sql/pglite"
import type { AnswerReview } from "../src/types/database.ts"

const sql = (name: string) => readFileSync(new URL(`../supabase/${name}`, import.meta.url), "utf8")

test("answer review uses real PostgreSQL session, ownership and column-access gates", async (t) => {
  const db = new PGlite()
  t.after(() => db.close())

  // Minimal Supabase host scaffolding. Quiz schema, lifecycle, RLS and seed are
  // the real migrations; no network, credentials or live session changes.
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    create function public.is_admin() returns boolean language sql stable as $$ select false $$;
    create table public.profiles (id uuid primary key references auth.users(id), name text, email text);
    create table public.workshop_settings (id boolean primary key, certificate_prefix text);
    insert into public.workshop_settings values (true, 'TEST');
    create sequence public.certificate_number_seq;
    alter default privileges in schema public grant all on tables to service_role;
    alter default privileges in schema public grant select on tables to authenticated;
  `)
  for (const migration of [
    "0008_four_quiz_architecture.sql",
    "0009_quiz_functions.sql",
    "0010_rls_four_quiz.sql",
    "20260830160253_answer_review.sql",
  ]) await db.exec(sql(`migrations/${migration}`))
  await db.exec(sql("seed.sql"))
  await db.exec("grant select on public.profiles, public.workshop_settings to service_role")

  const student = randomUUID()
  const other = randomUUID()
  const newcomer = randomUUID()
  for (const id of [student, other, newcomer]) {
    await db.query("insert into auth.users values ($1)", [id])
    await db.query("insert into public.profiles values ($1, 'Test Student', 'test@example.test')", [id])
  }

  async function review(id = student, slug = "html") {
    const { rows } = await db.query<{ review: AnswerReview }>(
      "select public.quiz_answer_review($1, $2) as review", [id, slug],
    )
    return rows[0]!.review
  }
  async function open(slug = "html") { await db.query("select public.open_quiz_session($1)", [slug]) }
  async function close(slug = "html") { await db.query("select public.close_quiz_session($1)", [slug]) }
  async function start(id: string, slug = "html") { await db.query("select public.start_quiz_attempt($1, $2)", [id, slug]) }
  async function submit(id: string, answers: unknown[] = [], slug = "html") {
    await db.query("select public.submit_quiz($1, $2, $3::jsonb)", [id, slug, JSON.stringify(answers)])
  }

  await t.test("anonymous and authenticated roles cannot invoke review or select answer keys", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`)
      await assert.rejects(() => review(student), /permission denied for function quiz_answer_review/)
      await assert.rejects(() => db.query("select correct_option, explanation from public.questions"), /permission denied/)
      await db.exec("reset role")
    }
    const { rows } = await db.query<{ prosecdef: boolean; provolatile: string }>(
      "select prosecdef, provolatile from pg_proc where oid = 'public.quiz_answer_review(uuid,text)'::regprocedure",
    )
    assert.equal(rows[0]!.prosecdef, false, "review must not elevate its caller's privileges")
    assert.equal(rows[0]!.provolatile, "s", "all gate queries use one statement snapshot")
  })

  await db.exec("set role service_role; set request.jwt.claim.role = 'service_role'")
  await t.test("a missing or unfinished attempt returns no answers", async () => {
    assert.deepEqual(await review(), { state: "not_completed", questions: [] })
    await open()
    await start(student)
    await start(other)
    assert.deepEqual(await review(), { state: "not_completed", questions: [] })
  })

  const { rows: questions } = await db.query<{ id: string; correct_option: number }>(
    "select q.id, q.correct_option from public.questions q join public.quizzes z on z.id=q.quiz_id where z.slug='html' order by q.position",
  )
  await t.test("submission alone never releases answers during an open session", async () => {
    await submit(student, [
      { question_id: questions[0]!.id, selected_option: questions[0]!.correct_option },
      { question_id: questions[1]!.id, selected_option: (questions[1]!.correct_option + 1) % 4 },
    ])
    assert.deepEqual(await review(), { state: "session_open", questions: [] })
  })

  await t.test("closing waits for students who are still allowed to submit", async () => {
    await close()
    assert.deepEqual(await review(), { state: "awaiting_submissions", questions: [] })
    assert.deepEqual(await review(other), { state: "not_completed", questions: [] })
    await submit(other)
  })

  await t.test("closed and finished releases only this student's graded questions and explanations", async () => {
    const result = await review()
    assert.equal(result.state, "available")
    assert.equal(result.questions.length, 10)
    assert.equal(result.questions[0]!.is_correct, true)
    assert.equal(result.questions[1]!.is_correct, false)
    assert.equal(result.questions[2]!.selected_option, null)
    assert.ok(result.questions.every((q) => q.explanation?.trim()))
    assert.deepEqual(result.questions.map((q) => q.id), questions.map((q) => q.id))
    assert.ok((await review(other)).questions.every((q) => q.selected_option === null))
    assert.deepEqual(await review(newcomer), { state: "not_completed", questions: [] })
    assert.deepEqual(await review(student, "python"), { state: "not_completed", questions: [] })
  })

  await t.test("reopening or locking stops new review requests", async () => {
    await open()
    assert.deepEqual(await review(), { state: "session_open", questions: [] })
    await db.exec("update public.quizzes set session_state='locked' where slug='html'")
    assert.deepEqual(await review(), { state: "session_open", questions: [] })
    await close()
  })

  await t.test("disabled graded questions remain; newly added questions are excluded", async () => {
    await db.query("update public.questions set is_active=false, explanation=null where id=$1", [questions[0]!.id])
    await db.exec(`insert into public.questions (quiz_id, question_text, options, correct_option, position)
      select id, 'A new question', '["A","B","C","D"]', 0, 11 from public.quizzes where slug='html'`)
    const result = await review()
    assert.equal(result.questions.length, 10)
    assert.equal(result.questions[0]!.id, questions[0]!.id)
    assert.equal(result.questions[0]!.explanation, null)
  })

  await t.test("force-close releases unanswered review once it finishes every attempt", async () => {
    await open("css")
    await start(student, "css")
    await start(other, "css")
    await db.query("select public.force_close_quiz_session($1)", ["css"])
    const result = await review(student, "css")
    assert.equal(result.state, "available")
    assert.equal(result.questions.length, 10)
    assert.ok(result.questions.every((q) => q.selected_option === null))
  })

  await t.test("reset attempts, unknown quizzes and inactive quizzes fail closed", async () => {
    await db.query("select public.admin_reset_attempt($1, $2)", [student, "html"])
    assert.deepEqual(await review(), { state: "not_completed", questions: [] })
    await assert.rejects(() => review(student, "ruby"), /unknown quiz/)
    await db.exec("update public.quizzes set is_active=false where slug='css'")
    await assert.rejects(() => review(student, "css"), /unknown quiz/)
  })
})
