import { describe, it, expect } from "vitest"
import {
  parsePath,
  isApplicableFeedback,
  applyFeedbackToDraft,
  revertPatch,
} from "@/lib/resume/apply-feedback"
import { emptyResume } from "@/lib/resume/factory"
import type { FeedbackItem } from "@/lib/review/types"
import type { Resume } from "@/lib/resume/types"

describe("parsePath", () => {
  it("parses a simple field path", () => {
    expect(parsePath("header.fullName")).toEqual(["header", "fullName"])
  })

  it("parses paths with array indices", () => {
    expect(parsePath("experience[0].bullets[2]")).toEqual([
      "experience",
      0,
      "bullets",
      2,
    ])
  })

  it("parses skills path", () => {
    expect(parsePath("skills[1].items[0]")).toEqual(["skills", 1, "items", 0])
  })
})

function feedback(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    section: "general",
    message: "test",
    ...overrides,
  }
}

describe("isApplicableFeedback", () => {
  it("returns true for a replace on a string field", () => {
    expect(
      isApplicableFeedback(
        feedback({
          action: "replace",
          fieldPath: "header.city",
          suggestedValue: "Cape Town",
        })
      )
    ).toBe(true)
  })

  it("returns false when fieldPath is missing", () => {
    expect(
      isApplicableFeedback(
        feedback({ action: "replace", suggestedValue: "x" })
      )
    ).toBe(false)
  })

  it("returns true for adding to a string array", () => {
    expect(
      isApplicableFeedback(
        feedback({
          action: "add",
          fieldPath: "experience[0].bullets",
          suggestedValue: "Did a thing",
        })
      )
    ).toBe(true)
  })

  it("returns true for removing an array element", () => {
    expect(
      isApplicableFeedback(
        feedback({
          action: "remove",
          fieldPath: "experience[0].bullets[2]",
        })
      )
    ).toBe(true)
  })

  it("returns false for an unrecognised action", () => {
    expect(
      isApplicableFeedback(
        feedback({ action: "advice", fieldPath: "header.city" })
      )
    ).toBe(false)
  })
})

function sampleResume(): Resume {
  const r = emptyResume()
  r.header.fullName = "Jane Doe"
  r.header.email = "jane@example.com"
  r.header.city = "Cape Town"
  r.summary = "Engineer with 6 years experience."
  r.experience = [
    {
      id: "exp-1",
      company: "Acme",
      role: "Engineer",
      startDate: "Jan 2022",
      endDate: "Present",
      location: "Remote",
      bullets: ["Built feature X", "Shipped Y"],
    },
  ]
  r.skills = [
    { id: "sk-1", name: "Front-End", items: ["React", "CSS"] },
  ]
  return r
}

describe("applyFeedbackToDraft", () => {
  it("applies a replace on a header field and returns a revert patch", () => {
    const draft = sampleResume()
    const patch = applyFeedbackToDraft(
      draft,
      feedback({
        action: "replace",
        fieldPath: "header.fullName",
        suggestedValue: "Jane Smith",
      })
    )
    expect(patch).toEqual({
      kind: "replace",
      path: "header.fullName",
      previousValue: "Jane Doe",
    })
    expect(draft.header.fullName).toBe("Jane Smith")
  })

  it("applies a replace on a nested string field", () => {
    const draft = sampleResume()
    applyFeedbackToDraft(
      draft,
      feedback({
        action: "replace",
        fieldPath: "experience[0].role",
        suggestedValue: "Senior Engineer",
      })
    )
    expect(draft.experience[0].role).toBe("Senior Engineer")
  })

  it("appends to an array on add", () => {
    const draft = sampleResume()
    const patch = applyFeedbackToDraft(
      draft,
      feedback({
        action: "add",
        fieldPath: "experience[0].bullets",
        suggestedValue: "New bullet",
      })
    )
    expect(patch).toEqual({
      kind: "removeAppended",
      containerPath: "experience[0].bullets",
      index: 2,
    })
    expect(draft.experience[0].bullets).toHaveLength(3)
    expect(draft.experience[0].bullets[2]).toBe("New bullet")
  })

  it("removes an array element on remove", () => {
    const draft = sampleResume()
    const patch = applyFeedbackToDraft(
      draft,
      feedback({
        action: "remove",
        fieldPath: "experience[0].bullets[1]",
      })
    )
    expect(patch).toEqual({
      kind: "reinsert",
      containerPath: "experience[0].bullets",
      index: 1,
      value: "Shipped Y",
    })
    expect(draft.experience[0].bullets).toEqual(["Built feature X"])
  })

  it("returns null for an inapplicable item", () => {
    const patch = applyFeedbackToDraft(
      sampleResume(),
      feedback({ action: "advice", message: "just advice" })
    )
    expect(patch).toBeNull()
  })
})

describe("revertPatch", () => {
  it("reverts a replace patch", () => {
    const draft = sampleResume()
    const patch = applyFeedbackToDraft(
      draft,
      feedback({
        action: "replace",
        fieldPath: "header.city",
        suggestedValue: "Johannesburg",
      })
    )
    expect(draft.header.city).toBe("Johannesburg")
    revertPatch(draft, patch!)
    expect(draft.header.city).toBe("Cape Town")
  })

  it("reverts a removeAppended (undo a push)", () => {
    const draft = sampleResume()
    const patch = applyFeedbackToDraft(
      draft,
      feedback({
        action: "add",
        fieldPath: "skills[0].items",
        suggestedValue: "TypeScript",
      })
    )
    expect(draft.skills[0].items).toHaveLength(3)
    revertPatch(draft, patch!)
    expect(draft.skills[0].items).toHaveLength(2)
  })
})
