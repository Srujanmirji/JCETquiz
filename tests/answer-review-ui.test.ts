import { test } from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { AnswerReviewContent, AnswerReviewLoading } from "../src/components/result/answer-review.tsx"
import type { AnswerReview, ReviewedQuestion } from "../src/types/database.ts"

const question: ReviewedQuestion = {
  id: "example",
  question_text: "Which tag creates a hyperlink?",
  options: ["<a>", "<link>", "<href>", "<script>alert(1)</script>"],
  selected_option: 1,
  correct_option: 0,
  is_correct: false,
  explanation: 'The <a href="..."> tag creates a clickable link.',
}
const render = (review: AnswerReview | null) => renderToStaticMarkup(createElement(AnswerReviewContent, { review, slug: "html" }))

test("review renders answers as text and provides native keyboard-operable disclosure", () => {
  const html = render({ state: "available", questions: [question] })
  assert.match(html, /<details><summary/)
  assert.match(html, /Your answer/)
  assert.match(html, /&lt;link&gt;/)
  assert.match(html, /Correct answer/)
  assert.match(html, /&lt;a&gt;/)
  assert.match(html, /Incorrect/)
  assert.match(html, /The &lt;a href=/)
  assert.doesNotMatch(html, /<script>|<a href="\.\.\."/)
})

test("correct, unanswered and missing-explanation states are explicit", () => {
  const correct = render({ state: "available", questions: [{ ...question, selected_option: 0, is_correct: true }] })
  assert.match(correct, />Correct<\/span>/)
  const skipped = render({ state: "available", questions: [{ ...question, selected_option: null, explanation: " " }] })
  assert.match(skipped, /Unanswered/)
  assert.match(skipped, /Not answered/)
  assert.match(skipped, /Ask your instructor/)
})

test("locked states never render a key, even if a malformed payload includes one", () => {
  for (const state of ["session_open", "awaiting_submissions", "not_completed"] as const) {
    const html = render({ state, questions: [question] } as unknown as AnswerReview)
    assert.doesNotMatch(html, /Correct answer|Which tag|&lt;a|clickable link/)
    assert.match(html, state === "not_completed" ? /Back to dashboard/ : /Check availability/)
  }
})

test("error, empty and loading states provide recovery or accessible status", () => {
  assert.match(render(null), /role="alert"/)
  assert.match(render(null), /Try again/)
  assert.match(render({ state: "available", questions: [] }), /No saved answers/)
  assert.match(renderToStaticMarkup(createElement(AnswerReviewLoading)), /aria-busy="true"/)
})
