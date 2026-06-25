import { describe, it, expect } from "vitest"
import { emptyResume, emptyExperience } from "@/lib/resume/factory"
import { normalizeResume } from "@/lib/resume/storage"
import {
  applyFeedbackToDraft,
  revertPatch,
} from "@/lib/resume/apply-feedback"
import { normalizeReview } from "@/lib/review/normalize"

describe("integration: normalizeReview → applyFeedbackToDraft", () => {
  it("takes a review suggestion and applies it to a resume", () => {
    const draft = emptyResume()
    draft.header.fullName = "Jane Doe"
    draft.header.city = "Johannesburg"

    const review = normalizeReview({
      categories: {
        atsCompatibility: 70,
        achievementImpact: 50,
        contentClarity: 80,
        format: 90,
      },
      feedback: [
        {
          section: "header",
          message: "Update city to Cape Town",
          action: "replace",
          fieldPath: "header.city",
          suggestedValue: "Cape Town",
        },
      ],
    })

    expect(review).not.toBeNull()
    const item = review!.feedback[0]
    expect(item.fieldPath).toBe("header.city")
    expect(item.suggestedValue).toBe("Cape Town")

    const patch = applyFeedbackToDraft(draft, item)
    expect(patch).not.toBeNull()
    expect(draft.header.city).toBe("Cape Town")

    revertPatch(draft, patch!)
    expect(draft.header.city).toBe("Johannesburg")
  })
})

describe("integration: normalizeResume with factory defaults", () => {
  it("fills in empty sections when partial data is provided", () => {
    const r = normalizeResume({
      header: { fullName: "Jane" },
      experience: [],
      education: [],
    })
    expect(r.header.fullName).toBe("Jane")
    expect(r.header.email).toBe("")
    expect(r.header.linkedin).toBe("")
    expect(r.summary).toBe("")
    expect(r.experience).toEqual([])
    expect(r.education).toEqual([])
    expect(r.skills).toEqual([])
  })
})

describe("integration: apply feedback across multiple paths", () => {
  it("applies batches of feedback items in sequence", () => {
    const draft = emptyResume()
    draft.header.fullName = "Jane Doe"

    const patches = [
      applyFeedbackToDraft(draft, {
        section: "header",
        message: "",
        action: "replace",
        fieldPath: "header.fullName",
        suggestedValue: "Jane Smith",
      }),
      applyFeedbackToDraft(draft, {
        section: "header",
        message: "",
        action: "replace",
        fieldPath: "header.email",
        suggestedValue: "jane@example.com",
      }),
    ]

    expect(draft.header.fullName).toBe("Jane Smith")
    expect(draft.header.email).toBe("jane@example.com")

    // Revert in reverse order
    for (const p of patches.reverse()) {
      if (p) revertPatch(draft, p)
    }

    expect(draft.header.fullName).toBe("Jane Doe")
    expect(draft.header.email).toBe("")
  })
})

describe("integration: experience + bullets add/remove", () => {
  it("adds a role, fills it, adds bullets, then undoes everything", () => {
    const draft = emptyResume()

    // Simulate adding a new experience entry
    draft.experience.push(emptyExperience())

    // Apply feedback to fill in the role
    const patch1 = applyFeedbackToDraft(draft, {
      section: "experience",
      message: "",
      action: "replace",
      fieldPath: "experience[0].role",
      suggestedValue: "Senior Engineer",
    })

    // Add a bullet
    const patch2 = applyFeedbackToDraft(draft, {
      section: "experience",
      message: "",
      action: "add",
      fieldPath: "experience[0].bullets",
      suggestedValue: "Led migration reducing latency by 40%",
    })

    expect(draft.experience[0].role).toBe("Senior Engineer")
    expect(draft.experience[0].bullets).toContain(
      "Led migration reducing latency by 40%"
    )

    // Undo add bullet, then undo replace role
    if (patch2) revertPatch(draft, patch2)
    if (patch1) revertPatch(draft, patch1)
    expect(draft.experience[0].role).toBe("")
    expect(draft.experience[0].bullets).toEqual([""])
  })
})
