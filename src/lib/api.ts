import { NextResponse } from "next/server"

/**
 * One response envelope for every route (rules/common/patterns.md).
 * Errors carry a stable machine `code` so the client can branch on intent
 * rather than on message text.
 */
export type ApiError =
  | "unauthenticated"
  | "forbidden"
  | "no_profile"
  | "already_completed"
  | "no_attempt"
  | "quiz_closed"
  | "invalid_input"
  | "not_eligible"
  | "conflict"
  | "not_found"
  | "server_error"

const STATUS: Record<ApiError, number> = {
  unauthenticated: 401,
  forbidden: 403,
  no_profile: 409,
  already_completed: 409,
  no_attempt: 409,
  quiz_closed: 423,
  invalid_input: 400,
  not_eligible: 409,
  conflict: 409,
  not_found: 404,
  server_error: 500,
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data, error: null }, init)
}

export function fail(code: ApiError, message: string, fields?: Record<string, string>) {
  return NextResponse.json(
    { success: false, data: null, error: { code, message, fields: fields ?? null } },
    { status: STATUS[code] },
  )
}

/** Maps the SQLSTATEs raised by our Postgres functions onto API errors. */
export function mapPostgresError(err: unknown): { code: ApiError; message: string } {
  const e = err as { code?: string; message?: string }

  switch (e?.code) {
    case "P0001":
      return { code: "already_completed", message: "You have already submitted the quiz." }
    case "P0002":
      return { code: "quiz_closed", message: "The quiz is not open right now." }
    case "P0003":
      return { code: "no_attempt", message: "No quiz attempt was found to submit." }
    case "22023":
      return { code: "invalid_input", message: e.message ?? "The submission was not valid." }
    case "23505":
      return { code: "conflict", message: "That record already exists." }
    case "42501":
      return { code: "forbidden", message: e.message ?? "That action is not permitted." }
    default:
      return { code: "server_error", message: "Something went wrong. Please try again." }
  }
}

/** Never let a raw driver message reach the client. */
export function failFromPostgres(err: unknown) {
  const { code, message } = mapPostgresError(err)
  if (code === "server_error") {
    console.error("[db]", err)
  }
  return fail(code, message)
}
