import { test } from "node:test"
import assert from "node:assert/strict"
import { settingsSchema } from "@/lib/validation"

const parse = (v: unknown) => settingsSchema.partial().safeParse({ feedback_url: v })

test("a javascript: URL is rejected — it renders as a link for students", () => {
  assert.equal(parse("javascript:alert(document.cookie)").success, false)
})

test("other non-http schemes are rejected", () => {
  for (const u of ["data:text/html,<script>x</script>", "file:///etc/passwd", "vbscript:msgbox"]) {
    assert.equal(parse(u).success, false, u)
  }
})

test("a Google Form link is accepted", () => {
  assert.equal(parse("https://forms.gle/abc123").success, true)
})

test("empty string is accepted — that is how the prompt is cleared", () => {
  assert.equal(parse("").success, true)
})

test("a bare word is rejected, not silently stored as a broken link", () => {
  assert.equal(parse("forms.gle/abc").success, false)
})
