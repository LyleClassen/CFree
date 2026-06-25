// Structured LLM review contract, shared by the server route and the client.

export type ReviewCategory =
  | "atsCompatibility"
  | "achievementImpact"
  | "contentClarity"
  | "format"

export const REVIEW_CATEGORIES: { key: ReviewCategory; label: string }[] = [
  { key: "atsCompatibility", label: "ATS Compatibility" },
  { key: "achievementImpact", label: "Achievement Impact" },
  { key: "contentClarity", label: "Content Clarity" },
  { key: "format", label: "Format" },
]

/** Which resume section a feedback item relates to (drives inline display). */
export type FeedbackSection =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "general"

/** What a future auto-correct would do with a feedback item's suggested value. */
export type FeedbackAction = "replace" | "add" | "remove" | "advice"

export interface FeedbackItem {
  section: FeedbackSection
  message: string
  /** What auto-correct would do; defaults to "advice" (no automatic edit). */
  action?: FeedbackAction
  /**
   * Dot/bracket path into the `Resume` the suggestion targets, e.g.
   * "header.city", "experience[0].bullets[2]", "skills". Only present when the
   * app can apply the edit. Validated against the capabilities manifest.
   */
  fieldPath?: string
  /** Concrete value auto-correct would write at `fieldPath`. */
  suggestedValue?: string
}

export interface ReviewResult {
  /** Overall score, 0-100. */
  score: number
  categories: Record<ReviewCategory, number>
  feedback: FeedbackItem[]
}

/** Server response: either an automated review, or the no-key fallback flag. */
export interface ReviewResponse {
  ok: boolean
  /** Present when the LLM returned a usable review. */
  review?: ReviewResult
  /** True when no API key is configured — client shows the manual checklist. */
  apiKeyMissing?: boolean
  /** Human-readable reason when `ok` is false. */
  error?: string
}
