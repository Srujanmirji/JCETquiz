import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import {
  PASS_SCORE,
  PASS_PERCENTAGE,
  TOTAL_QUESTIONS,
  QUESTIONS_PER_QUIZ,
  QUIZZES,
  QUIZ_SLUGS,
  BRANCHES,
  isQuizSlug,
} from "@/lib/constants.ts"
import { profileSchema, submitSchema, sessionActionSchema } from "@/lib/validation.ts"

/** Mirrors recompute_final_result's rule so the boundary is exercised directly. */
const eligible = (score: number) => score >= PASS_SCORE
const percentage = (score: number) => Math.round((score * 10000) / TOTAL_QUESTIONS) / 100

// ------------------------------------------------------------ workshop shape
test("four quizzes of ten make forty questions", () => {
  assert.equal(QUIZZES.length, 4)
  assert.equal(QUESTIONS_PER_QUIZ, 10)
  assert.equal(TOTAL_QUESTIONS, 40)
  assert.deepEqual([...QUIZ_SLUGS], ["html", "css", "javascript", "python"])
})

test("quiz order is html, css, javascript, python", () => {
  assert.deepEqual(QUIZZES.map((q) => q.order), [1, 2, 3, 4])
})

test("isQuizSlug rejects anything not in the workshop", () => {
  assert.equal(isQuizSlug("python"), true)
  assert.equal(isQuizSlug("ruby"), false)
  assert.equal(isQuizSlug(""), false)
})

// ------------------------------------------------------------- eligibility
test("28/40 is eligible and 27/40 is not — the exact 70% boundary", () => {
  assert.equal(eligible(28), true, "28/40 is exactly 70% and must qualify")
  assert.equal(eligible(27), false, "27/40 is 67.5% and must not qualify")
})

test("eligibility never depends on a rounded percentage", () => {
  assert.equal(percentage(27), 67.5)
  assert.equal(percentage(28), 70)
  assert.equal(PASS_PERCENTAGE, 70)
  assert.equal((PASS_SCORE / TOTAL_QUESTIONS) * 100, PASS_PERCENTAGE)
})

test("every score from 0 to 40 lands on the right side of the line", () => {
  for (let s = 0; s <= TOTAL_QUESTIONS; s++) {
    assert.equal(eligible(s), s >= 28, `score ${s}`)
  }
})

test("the scenario from the brief: 9+8+7+8 = 32/40 = 80%, eligible", () => {
  const total = 9 + 8 + 7 + 8
  assert.equal(total, 32)
  assert.equal(percentage(total), 80)
  assert.equal(eligible(total), true)
})

test("a latecomer who misses HTML can still qualify", () => {
  // 0 + 10 + 10 + 10 = 30/40 = 75%. Session-only gating means a missed session
  // scores zero rather than locking the student out of the certificate.
  const total = 0 + 10 + 10 + 10
  assert.equal(total, 30)
  assert.equal(eligible(total), true)
})

test("6/6/6/6 = 24/40 = 60% is not eligible", () => {
  const total = 6 * 4
  assert.equal(percentage(total), 60)
  assert.equal(eligible(total), false)
})

test("7/7/7/7 = 28/40 = exactly 70% IS eligible", () => {
  const total = 7 * 4
  assert.equal(total, 28)
  assert.equal(percentage(total), 70)
  assert.equal(eligible(total), true)
})

// ----------------------------------------------------------- drift guards
test("the SQL threshold matches the TypeScript constant", () => {
  // The rule lives in recompute_final_result; this constant is what the UI
  // promises students. They must not disagree.
  const sql = readFileSync(new URL("../supabase/migrations/0009_quiz_functions.sql", import.meta.url), "utf8")
  assert.match(sql, /v_eligible\s*:=\s*v_total\s*>=\s*ceil\(v_qtotal\s*\*\s*0\.7\)/,
    "recompute_final_result must gate on 70% of the question total")
  assert.equal(Math.ceil(TOTAL_QUESTIONS * 0.7), PASS_SCORE)
})

test("the database enforces one attempt per quiz, not one per student", () => {
  const sql = readFileSync(new URL("../supabase/migrations/0008_four_quiz_architecture.sql", import.meta.url), "utf8")
  assert.match(sql, /unique \(profile_id, quiz_id\)/,
    "quiz_attempts must be unique on (profile_id, quiz_id)")
})

test("a new attempt requires an open session", () => {
  const sql = readFileSync(new URL("../supabase/migrations/0009_quiz_functions.sql", import.meta.url), "utf8")
  assert.match(sql, /if v_quiz\.session_state <> 'open' then/,
    "start_quiz_attempt must refuse unless the instructor has opened the session")
})

// ---------------------------------------------------------------- seed bank
test("the seed contains exactly 10 questions for each of the four quizzes", () => {
  const seed = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8")
  for (const v of ["v_html", "v_css", "v_js", "v_py"]) {
    const n = [...seed.matchAll(new RegExp(`^\\s*\\(${v},`, "gm"))].length
    assert.equal(n, QUESTIONS_PER_QUIZ, `${v} should have ${QUESTIONS_PER_QUIZ} questions, found ${n}`)
  }
})

test("no seeded question has an out-of-range answer key", () => {
  const seed = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8")
  const keys = [...seed.matchAll(/\]',\s*(\d+),/g)].map((m) => Number(m[1]))
  assert.equal(keys.length, TOTAL_QUESTIONS, `expected ${TOTAL_QUESTIONS} answer keys`)
  for (const k of keys) assert.ok(k >= 0 && k <= 3, `answer key ${k} out of range`)
})

// ------------------------------------------------------------------ input
test("registration offers and accepts only the five workshop branches", () => {
  const branches = [
    "Computer Science",
    "Artificial Intelligence & Machine Learning",
    "Electronics & Communication",
    "Civil",
    "Mechanical",
  ]
  assert.deepEqual([...BRANCHES], branches)

  const profile = { name: "Ananya Sharma", phone: "9876543210", year: "1st Year" }
  for (const branch of branches) {
    assert.equal(profileSchema.safeParse({ ...profile, branch }).success, true, branch)
  }
  for (const branch of ["Information Science", "Electrical & Electronics", "Data Science", "Biotechnology", "Other", ""]) {
    assert.equal(profileSchema.safeParse({ ...profile, branch }).success, false, branch)
  }
})

test("profile input rejects what the database would reject", () => {
  const good = { name: "Ananya Sharma", phone: "9876543210", branch: "Computer Science", year: "1st Year" }
  assert.equal(profileSchema.safeParse(good).success, true)
  assert.equal(profileSchema.safeParse({ ...good, phone: "12345" }).success, false)
  assert.equal(profileSchema.safeParse({ ...good, phone: "1234567890" }).success, false, "must start 6-9")
  assert.equal(profileSchema.safeParse({ ...good, branch: "Hogwarts" }).success, false)
})

test("submission payload rejects out-of-range option indexes", () => {
  const id = "11111111-1111-4111-8111-111111111111"
  assert.equal(submitSchema.safeParse({ answers: [{ questionId: id, selectedOption: 3 }] }).success, true)
  assert.equal(submitSchema.safeParse({ answers: [{ questionId: id, selectedOption: null }] }).success, true,
    "unanswered is legal and scores zero")
  assert.equal(submitSchema.safeParse({ answers: [{ questionId: id, selectedOption: 4 }] }).success, false)
  assert.equal(submitSchema.safeParse({ answers: [{ questionId: "nope", selectedOption: 0 }] }).success, false)
})

test("a client-supplied score is stripped, not trusted", () => {
  const id = "11111111-1111-4111-8111-111111111111"
  const parsed = submitSchema.parse({
    answers: [{ questionId: id, selectedOption: 0 }],
    score: 40,
    certificateEligible: true,
  } as unknown)
  assert.deepEqual(Object.keys(parsed), ["answers"])
})

test("session actions are restricted to known quizzes and verbs", () => {
  assert.equal(sessionActionSchema.safeParse({ slug: "html", action: "open" }).success, true)
  assert.equal(sessionActionSchema.safeParse({ slug: "html", action: "force_close" }).success, true)
  assert.equal(sessionActionSchema.safeParse({ slug: "ruby", action: "open" }).success, false)
  assert.equal(sessionActionSchema.safeParse({ slug: "html", action: "delete" }).success, false)
})
