import type {
  FeedbackItem,
  FeedbackSection,
  ReviewCategory,
  ReviewResult,
} from "@/lib/review/types"

const CATEGORY_KEYS: ReviewCategory[] = [
  "atsCompatibility",
  "achievementImpact",
  "contentClarity",
  "format",
]

const SECTIONS: FeedbackSection[] = [
  "header",
  "summary",
  "experience",
  "education",
  "skills",
  "general",
]

function clampScore(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function toSection(v: unknown): FeedbackSection {
  return SECTIONS.includes(v as FeedbackSection)
    ? (v as FeedbackSection)
    : "general"
}

/**
 * Validate and normalize raw LLM JSON into a `ReviewResult`. Returns null when
 * the input cannot be coerced into a usable shape (caller surfaces a graceful
 * "review unavailable" state).
 */
export function normalizeReview(input: unknown): ReviewResult | null {
  if (!input || typeof input !== "object") return null
  const data = input as Record<string, unknown>

  const rawCategories = (data.categories ?? {}) as Record<string, unknown>
  const categories = {} as Record<ReviewCategory, number>
  for (const key of CATEGORY_KEYS) {
    categories[key] = clampScore(rawCategories[key])
  }

  let score: number
  if (data.score != null) {
    score = clampScore(data.score)
  } else {
    // Derive an overall score from the category average if absent.
    const avg =
      CATEGORY_KEYS.reduce((sum, k) => sum + categories[k], 0) /
      CATEGORY_KEYS.length
    score = clampScore(avg)
  }

  let feedback: FeedbackItem[] = []
  if (Array.isArray(data.feedback)) {
    feedback = data.feedback
      .map((raw): FeedbackItem | null => {
        if (typeof raw === "string") {
          return { section: "general", message: raw }
        }
        if (raw && typeof raw === "object") {
          const f = raw as Record<string, unknown>
          const message = typeof f.message === "string" ? f.message : ""
          if (!message.trim()) return null
          return { section: toSection(f.section), message }
        }
        return null
      })
      .filter((f): f is FeedbackItem => f !== null)
  }

  // Require at least some signal to consider the review usable.
  const hasSignal =
    feedback.length > 0 || CATEGORY_KEYS.some((k) => categories[k] > 0)
  if (!hasSignal) return null

  return { score, categories, feedback }
}
