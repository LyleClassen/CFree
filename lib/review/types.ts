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

export interface FeedbackItem {
  section: FeedbackSection
  message: string
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
