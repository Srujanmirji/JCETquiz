import { z } from "zod"
import { BRANCHES, YEARS, QUIZ_SLUGS } from "@/lib/constants"

/**
 * Boundary validation. Every value crossing from the browser into a server
 * handler is parsed here first (docs/SECURITY.md).
 */

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80, "Name is too long")
    .regex(/^[\p{L}\p{M}'.\- ]+$/u, "Name can only contain letters, spaces, hyphens and apostrophes"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  branch: z.enum(BRANCHES, { errorMap: () => ({ message: "Select your branch" }) }),
  year: z.enum(YEARS, { errorMap: () => ({ message: "Select your year" }) }),
})

export type ProfileInput = z.infer<typeof profileSchema>

export const quizSlugSchema = z.enum(
  QUIZ_SLUGS as unknown as [string, ...string[]],
  { errorMap: () => ({ message: "Unknown quiz" }) },
)

export const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedOption: z.number().int().min(0).max(3).nullable(),
      }),
    )
    .max(40, "Too many answers submitted"),
})

export const sessionActionSchema = z.object({
  slug: quizSlugSchema,
  action: z.enum(["open", "close", "force_close"]),
})

export const resetAttemptSchema = z.object({
  profileId: z.string().uuid(),
  slug: quizSlugSchema,
})

export const settingsSchema = z.object({
  club_name: z.string().trim().min(2).max(120),
  college_name: z.string().trim().min(2).max(160),
  workshop_name: z.string().trim().min(2).max(120),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  event_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").or(z.literal("")).nullable().optional(),
  organizer_name: z.string().trim().min(2).max(120),
  organizer_title: z.string().trim().min(2).max(120),
  certificate_prefix: z.string().trim().regex(/^[A-Z0-9]{2,8}$/, "2-8 uppercase letters or digits"),
  quiz_open: z.boolean(),
  randomize_questions: z.boolean(),
  lock_year: z.boolean(),
})

export const questionSchema = z.object({
  quiz_id: z.string().uuid(),
  question_text: z.string().trim().min(8).max(500),
  options: z.array(z.string().trim().min(1).max(200)).length(4),
  correct_option: z.number().int().min(0).max(3),
  explanation: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean(),
})

/** Turns a ZodError into the field-keyed map the forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === "string" && !out[key]) out[key] = issue.message
  }
  return out
}
