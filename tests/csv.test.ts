import { test } from "node:test"
import assert from "node:assert/strict"
import { toCsv, exportFilename } from "@/lib/admin/csv.ts"

test("a name that looks like a formula cannot execute in Excel", () => {
  // A student registering as "=1+1" or "=HYPERLINK(...)" would otherwise become
  // a live formula in whatever the organisers open the export with.
  const csv = toCsv(["Name"], [["=1+1"], ["+44 7700"], ["-5"], ["@handle"]])
  for (const dangerous of ["\n=1+1", "\n+44", "\n-5", "\n@handle"]) {
    assert.ok(!csv.includes(dangerous), `unescaped formula: ${dangerous.trim()}`)
  }
  assert.ok(csv.includes("'=1+1"), "should be neutralised with a leading quote")
})

test("commas, quotes and newlines are quoted per RFC 4180", () => {
  const csv = toCsv(["Name", "Note"], [["Sharma, Ananya", 'said "hi"'], ["Multi\nline", "x"]])
  assert.ok(csv.includes('"Sharma, Ananya"'), "comma must be quoted")
  assert.ok(csv.includes('"said ""hi"""'), "embedded quotes must be doubled")
  assert.ok(csv.includes('"Multi\nline"'), "newline must be quoted")
})

test("the file starts with a BOM so Excel reads UTF-8", () => {
  // Without it Excel assumes the system codepage and mangles non-ASCII names.
  const csv = toCsv(["Name"], [["Ananya Sharma"]])
  assert.equal(csv.charCodeAt(0), 0xfeff)
})

test("empty and null cells serialise as blank, not 'null'", () => {
  const csv = toCsv(["A", "B", "C"], [[null, undefined, ""]])
  assert.ok(csv.includes("\r\n,,"), "expected three empty cells")
  assert.ok(!csv.includes("null"), "null must not appear as text")
})

test("rows use CRLF endings", () => {
  const csv = toCsv(["A"], [["1"], ["2"]])
  assert.equal(csv.split("\r\n").length, 4, "header + 2 rows + trailing")
})

test("the filename carries the export date", () => {
  assert.equal(
    exportFilename("participants", new Date("2026-08-31T10:00:00Z")),
    "participants-2026-08-31.csv",
  )
})

test("a zero score is preserved, not blanked", () => {
  // 0 is a real result and must survive; only never-attempted is blank.
  const csv = toCsv(["Score"], [[0]])
  assert.ok(csv.includes("\r\n0"), "zero must be written")
})
