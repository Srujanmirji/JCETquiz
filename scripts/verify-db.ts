/**
 * End-to-end verification against a REAL Supabase project.
 *
 *   npm run verify:db
 *
 * Exercises the rules that cannot be unit-tested because they live in the
 * database: instructor session gating, one attempt per quiz, server-side
 * scoring, the 28/40 boundary, latecomer handling, and answer-key
 * confidentiality.
 *
 * Creates throwaway auth users, then deletes them and everything they own.
 * Safe against a project that already holds real participants — it only ever
 * touches the users it creates. It DOES change session state while running,
 * and restores each quiz's state at the end.
 */
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"

const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]
const anon = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
const service = process.env["SUPABASE_SERVICE_ROLE_KEY"]

if (!url || !anon || !service || url.includes("placeholder")) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and\n" +
      "SUPABASE_SERVICE_ROLE_KEY in .env.local first (see docs/SETUP.md).",
  )
  process.exit(1)
}

const admin = createClient(url, service, { auth: { persistSession: false } })
const SLUGS = ["html", "css", "javascript", "python"] as const
type Slug = (typeof SLUGS)[number]

let passed = 0
let failed = 0

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`  \x1b[32m✔\x1b[0m ${name}`)
    passed++
  } catch (err) {
    console.log(`  \x1b[31m✖\x1b[0m ${name}`)
    console.log(`      ${(err as Error).message}`)
    failed++
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function createStudent(label: string) {
  const email = `verify-${label}-${randomUUID().slice(0, 8)}@example.test`
  const password = randomUUID()

  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create test user: ${error?.message}`)

  await admin.from("profiles").insert({
    id: data.user.id, email, name: `Verify ${label}`,
    phone: "9876543210", branch: "Computer Science", year: "1st Year",
  })

  const asStudent = createClient(url!, anon!, { auth: { persistSession: false } })
  const { error: signInError } = await asStudent.auth.signInWithPassword({ email, password })
  if (signInError) throw new Error(`could not sign in test user: ${signInError.message}`)

  return { id: data.user.id, email, client: asStudent }
}

/** Builds a payload for `slug` that scores exactly `target` marks. */
async function payload(slug: Slug, target: number) {
  const { data } = await admin
    .from("questions")
    .select("id, correct_option, quiz:quizzes!inner(slug)")
    .eq("quizzes.slug", slug)
    .order("position")

  const rows = (data ?? []) as { id: string; correct_option: number }[]
  return rows.map((q, i) => ({
    questionId: q.id,
    selectedOption: i < target ? q.correct_option : (q.correct_option + 1) % 4,
  }))
}

const open  = (s: Slug) => admin.rpc("open_quiz_session",  { p_slug: s })
const close = (s: Slug) => admin.rpc("close_quiz_session", { p_slug: s })
const start = (id: string, s: Slug) => admin.rpc("start_quiz_attempt", { p_profile_id: id, p_slug: s })
const submit = (id: string, s: Slug, answers: { questionId: string; selectedOption: number | null }[]) =>
  admin.rpc("submit_quiz", {
    p_profile_id: id, p_slug: s,
    p_answers: answers.map((a) => ({ question_id: a.questionId, selected_option: a.selectedOption })),
  })

async function cleanup(ids: string[]) {
  for (const id of ids) {
    await admin.from("certificates").delete().eq("profile_id", id)
    await admin.from("final_results").delete().eq("profile_id", id)
    const { data: attempts } = await admin.from("quiz_attempts").select("id").eq("profile_id", id)
    await admin.from("quiz_answers").delete().in("attempt_id", (attempts ?? []).map((a) => (a as { id: string }).id))
    await admin.from("quiz_attempts").delete().eq("profile_id", id)
    await admin.from("profiles").delete().eq("id", id)
    await admin.auth.admin.deleteUser(id)
  }
}

async function main() {
  console.log("\nVerifying the four-quiz workshop rules against your Supabase project\n")

  const created: string[] = []
  const { data: before } = await admin.from("quizzes").select("slug, session_state")
  const originalState = new Map(
    (before ?? []).map((q) => [(q as { slug: Slug }).slug, (q as { session_state: string }).session_state]),
  )

  await check("question bank is 10 active questions per quiz, 40 in total", async () => {
    for (const slug of SLUGS) {
      const { count } = await admin
        .from("questions").select("id, quiz:quizzes!inner(slug)", { count: "exact", head: true })
        .eq("quizzes.slug", slug).eq("is_active", true)
      assert(count === 10, `${slug} has ${count} active questions, expected 10`)
    }
  })

  const a = await createStudent("main")
  created.push(a.id)

  // ------------------------------------------------------------ session gate
  await check("every session starts closed to new attempts", async () => {
    for (const slug of SLUGS) await close(slug)
    const { error } = await start(a.id, "html")
    assert(error?.code === "P0002", `expected P0002, got ${error?.code ?? "success"}`)
  })

  await check("a student cannot skip to a quiz whose session is not open", async () => {
    await open("html")
    const { error } = await start(a.id, "python")
    assert(error?.code === "P0002", `expected P0002, got ${error?.code ?? "success"}`)
  })

  await check("opening a session automatically closes the previous one", async () => {
    await open("css")
    const { data } = await admin.from("quizzes").select("slug, session_state")
    const states = new Map((data ?? []).map((q) => [(q as { slug: string }).slug, (q as { session_state: string }).session_state]))
    assert(states.get("html") === "closed", "HTML should have auto-closed")
    assert(states.get("css") === "open", "CSS should be open")
    await open("html")
  })

  // ------------------------------------------------------- answer-key privacy
  await check("a student's browser cannot read the answer key", async () => {
    const { data } = await a.client.from("questions").select("correct_option").limit(1)
    const leaked = data?.[0] && (data[0] as { correct_option?: unknown }).correct_option != null
    assert(!leaked, "correct_option was readable with the anon key")
  })

  await check("a student's browser CAN read the public question view", async () => {
    const { data, error } = await a.client.from("public_questions").select("*").limit(1)
    assert(!error, `public_questions unreadable: ${error?.message}`)
    assert(data && data.length === 1, "expected a question row")
    assert(!("correct_option" in (data[0] as object)), "the view leaked correct_option")
  })

  await check("a student cannot insert their own attempt", async () => {
    const { data: quiz } = await admin.from("quizzes").select("id").eq("slug", "html").single()
    const { error } = await a.client.from("quiz_attempts")
      .insert({ profile_id: a.id, quiz_id: (quiz as { id: string }).id })
    assert(error, "a student was able to create an attempt directly")
  })

  // -------------------------------------------------------------- the journey
  await check("HTML scores 9/10 (90%)", async () => {
    await start(a.id, "html")
    const { data, error } = await submit(a.id, "html", await payload("html", 9))
    assert(!error, `submit failed: ${error?.message}`)
    const r = data as unknown as { score: number; percentage: number }
    assert(r.score === 9, `expected 9, got ${r.score}`)
    assert(Number(r.percentage) === 90, `expected 90%, got ${r.percentage}`)
  })

  await check("a second submission of the same quiz is refused", async () => {
    const { error } = await submit(a.id, "html", await payload("html", 10))
    assert(error?.code === "P0001", `expected P0001, got ${error?.code ?? "success"}`)
  })

  await check("restarting a completed quiz is refused", async () => {
    const { error } = await start(a.id, "html")
    assert(error?.code === "P0001", `expected P0001, got ${error?.code}`)
  })

  await check("concurrent submissions cannot both succeed", async () => {
    const c = await createStudent("concurrent")
    created.push(c.id)
    await open("css")
    await start(c.id, "css")
    const p = await payload("css", 6)
    const results = await Promise.all([submit(c.id, "css", p), submit(c.id, "css", p)])
    const ok = results.filter((r) => !r.error).length
    assert(ok === 1, `expected exactly 1 of 2 concurrent submissions to succeed, got ${ok}`)
  })

  const late = await createStudent("latecomer")
  created.push(late.id)

  await check("the full journey: 9 + 8 + 7 + 8 = 32/40 (80%), eligible", async () => {
    for (const [slug, target] of [["css", 8], ["javascript", 7], ["python", 8]] as const) {
      await open(slug)
      await start(a.id, slug)
      const { error } = await submit(a.id, slug, await payload(slug, target))
      assert(!error, `${slug} submit failed: ${error?.message}`)

      // The latecomer joins from CSS onward and aces every quiz they attend.
      await start(late.id, slug)
      await submit(late.id, slug, await payload(slug, 10))
    }

    const { data } = await admin.from("final_results").select("*").eq("profile_id", a.id).single()
    const f = data as unknown as Record<string, number | boolean>
    assert(f["html_score"] === 9 && f["css_score"] === 8, "section scores wrong")
    assert(f["javascript_score"] === 7 && f["python_score"] === 8, "section scores wrong")
    assert(f["total_score"] === 32, `expected 32, got ${f["total_score"]}`)
    assert(f["total_questions"] === 40, `expected /40, got ${f["total_questions"]}`)
    assert(Number(f["percentage"]) === 80, `expected 80%, got ${f["percentage"]}`)
    assert(f["certificate_eligible"] === true, "32/40 must be eligible")
  })

  await check("a latecomer who missed HTML scores 0 there and can still qualify", async () => {
    const { data } = await admin.from("final_results").select("*").eq("profile_id", late.id).single()
    const f = data as unknown as Record<string, number | boolean>
    assert(f["html_score"] === 0, `expected 0 for the missed quiz, got ${f["html_score"]}`)
    assert(f["total_score"] === 30, `expected 30/40, got ${f["total_score"]}`)
    assert(Number(f["percentage"]) === 75, `expected 75%, got ${f["percentage"]}`)
    assert(f["certificate_eligible"] === true, "30/40 must still qualify")
  })

  await check("the final result unlocks only once every session is closed", async () => {
    let { data: complete } = await admin.rpc("workshop_complete")
    assert(complete === false, "workshop should not be complete while python is open")
    await close("python")
    ;({ data: complete } = await admin.rpc("workshop_complete"))
    assert(complete === true, "workshop should be complete once all sessions are closed")
  })

  // ------------------------------------------------------------- the boundary
  await check("28/40 is exactly 70% and IS eligible", async () => {
    const b = await createStudent("boundary-28")
    created.push(b.id)
    for (const slug of SLUGS) {
      await open(slug)
      await start(b.id, slug)
      await submit(b.id, slug, await payload(slug, 7))
    }
    await close("python")
    const { data } = await admin.from("final_results").select("*").eq("profile_id", b.id).single()
    const f = data as unknown as Record<string, number | boolean>
    assert(f["total_score"] === 28, `expected 28, got ${f["total_score"]}`)
    assert(Number(f["percentage"]) === 70, `expected 70%, got ${f["percentage"]}`)
    assert(f["certificate_eligible"] === true, "28/40 must be eligible")
  })

  await check("27/40 is one mark under and is NOT eligible", async () => {
    const b = await createStudent("boundary-27")
    created.push(b.id)
    for (const slug of SLUGS) {
      await open(slug)
      await start(b.id, slug)
      await submit(b.id, slug, await payload(slug, slug === "html" ? 6 : 7))
    }
    await close("python")
    const { data } = await admin.from("final_results").select("*").eq("profile_id", b.id).single()
    const f = data as unknown as Record<string, number | boolean>
    assert(f["total_score"] === 27, `expected 27, got ${f["total_score"]}`)
    assert(f["certificate_eligible"] === false, "27/40 must NOT be eligible")
    const { count } = await admin.from("certificates")
      .select("id", { count: "exact", head: true }).eq("profile_id", b.id)
    assert(count === 0, "an ineligible student must not get a certificate row")
  })

  // ----------------------------------------------------------- immutability
  await check("a completed attempt cannot be modified, even with the service role", async () => {
    const { error } = await admin.from("quiz_attempts")
      .update({ score: 10 }).eq("profile_id", a.id)
    assert(error, "a completed attempt was editable")
  })

  await check("a student cannot edit their own score", async () => {
    const { data, error } = await a.client.from("quiz_attempts")
      .update({ score: 10 }).eq("profile_id", a.id).select()
    assert(error || !data?.length, "a student was able to change their score")
  })

  await check("a student cannot read another student's result", async () => {
    const { data } = await a.client.from("final_results").select("*").eq("profile_id", late.id)
    assert(!data?.length, "a student could read another student's final result")
  })

  await check("unanswered questions score zero rather than shrinking the total", async () => {
    const d = await createStudent("partial")
    created.push(d.id)
    await open("html")
    await start(d.id, "html")
    const full = await payload("html", 10)
    const { data, error } = await submit(d.id, "html", full.slice(0, 4))
    assert(!error, `submit failed: ${error?.message}`)
    const r = data as unknown as { score: number; total_questions: number }
    assert(r.score === 4, `expected 4, got ${r.score}`)
    assert(r.total_questions === 10, `denominator must stay 10, got ${r.total_questions}`)
  })

  await check("a submission cannot smuggle in a question from another quiz", async () => {
    const e = await createStudent("crossquiz")
    created.push(e.id)
    await open("css")
    await start(e.id, "css")
    const foreign = await payload("python", 10)
    const { error } = await submit(e.id, "css", foreign)
    assert(error, "answers from another quiz were accepted")
  })

  await check("admin_reset_attempt clears one attempt and rescores", async () => {
    const { error } = await admin.rpc("admin_reset_attempt", { p_profile_id: a.id, p_slug: "html" })
    assert(!error, `reset failed: ${error?.message}`)
    const { data } = await admin.from("final_results").select("html_score").eq("profile_id", a.id).single()
    assert((data as { html_score: number }).html_score === 0, "html score should be back to 0")
  })

  await check("the certificates bucket is private", async () => {
    const { data } = await admin.storage.getBucket("certificates")
    assert(data, "the certificates bucket does not exist — run 0004_storage.sql")
    assert(data.public === false, "the certificates bucket is PUBLIC — it must be private")
  })

  console.log("\nCleaning up test users and restoring session state…")
  await cleanup(created)
  for (const [slug, state] of originalState) {
    await admin.from("quizzes").update({ session_state: state }).eq("slug", slug)
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error("\nVerification crashed:", err)
  process.exit(1)
})
