import { describe, it, expect } from "vitest"
import { normalizeReview } from "@/lib/review/normalize"

describe("normalizeReview", () => {
  it("returns null for non-object input", () => {
    expect(normalizeReview(null)).toBeNull()
    expect(normalizeReview("string")).toBeNull()
  })

  it("computes default score from category average", () => {
    const result = normalizeReview({
      categories: {
        atsCompatibility: 80,
        achievementImpact: 60,
        contentClarity: 40,
        format: 20,
      },
      feedback: [],
    })
    expect(result).not.toBeNull()
    expect(result!.score).toBe(50)
  })

  it("uses the explicit score when provided", () => {
    const result = normalizeReview({
      score: 85,
      categories: { atsCompatibility: 50, achievementImpact: 50, contentClarity: 50, format: 50 },
      feedback: [],
    })
    expect(result!.score).toBe(85)
  })

  it("clamps score to 0-100 range", () => {
    const result = normalizeReview({
      score: 150,
      categories: { atsCompatibility: 50, achievementImpact: 50, contentClarity: 50, format: 50 },
      feedback: [],
    })
    expect(result!.score).toBe(100)
  })

  it("normalizes raw string feedback items", () => {
    const result = normalizeReview({
      categories: { atsCompatibility: 0, achievementImpact: 0, contentClarity: 0, format: 0 },
      feedback: ["Needs more impact", "Add metrics"],
    })
    expect(result!.feedback).toHaveLength(2)
    expect(result!.feedback[0].message).toBe("Needs more impact")
    expect(result!.feedback[0].section).toBe("general")
  })

  it("normalizes structured feedback items", () => {
    const result = normalizeReview({
      categories: { atsCompatibility: 0, achievementImpact: 0, contentClarity: 0, format: 0 },
      feedback: [
        {
          section: "header",
          message: "Add LinkedIn URL",
          action: "replace",
          fieldPath: "header.linkedin",
          suggestedValue: "linkedin.com/in/jane",
          rationale: "LinkedIn is the #1 recruiter signal.",
        },
      ],
    })
    expect(result!.feedback).toHaveLength(1)
    expect(result!.feedback[0].fieldPath).toBe("header.linkedin")
    expect(result!.feedback[0].suggestedValue).toBe("linkedin.com/in/jane")
    expect(result!.feedback[0].rationale).toBe(
      "LinkedIn is the #1 recruiter signal."
    )
  })

  it("strips invalid field paths from structured items", () => {
    const result = normalizeReview({
      categories: { atsCompatibility: 0, achievementImpact: 0, contentClarity: 0, format: 0 },
      feedback: [
        {
          section: "header",
          message: "Change font",
          action: "replace",
          fieldPath: "header.fontSize",
          suggestedValue: "12pt",
        },
      ],
    })
    expect(result!.feedback[0].fieldPath).toBeUndefined()
    expect(result!.feedback[0].suggestedValue).toBeUndefined()
  })

  it("returns null when there is no signal (empty categories, no feedback)", () => {
    const result = normalizeReview({
      categories: { atsCompatibility: 0, achievementImpact: 0, contentClarity: 0, format: 0 },
      feedback: [],
    })
    expect(result).toBeNull()
  })
})
