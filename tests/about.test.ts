import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("About and Learn More link to a dedicated public page", () => {
  const home = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8")
  const about = readFileSync(new URL("../src/app/about/page.tsx", import.meta.url), "utf8")

  assert.match(home, /href="\/about">About<\/Link>/)
  assert.match(home, /href="\/about">\s*&gt; Learn More/)
  assert.doesNotMatch(home, /href="#about"/)
  assert.match(about, /export default function AboutPage/)
})
