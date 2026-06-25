import { describe, it, expect } from "vitest"
import {
  isEditableFieldPath,
  FEEDBACK_ACTIONS,
} from "@/lib/review/capabilities"

describe("isEditableFieldPath", () => {
  it("accepts header fields", () => {
    expect(isEditableFieldPath("header.fullName")).toBe(true)
    expect(isEditableFieldPath("header.email")).toBe(true)
    expect(isEditableFieldPath("header.city")).toBe(true)
  })

  it("accepts summary", () => {
    expect(isEditableFieldPath("summary")).toBe(true)
  })

  it("accepts experience paths", () => {
    expect(isEditableFieldPath("experience")).toBe(true)
    expect(isEditableFieldPath("experience[0]")).toBe(true)
    expect(isEditableFieldPath("experience[0].role")).toBe(true)
    expect(isEditableFieldPath("experience[0].bullets")).toBe(true)
    expect(isEditableFieldPath("experience[0].bullets[2]")).toBe(true)
  })

  it("accepts education paths", () => {
    expect(isEditableFieldPath("education")).toBe(true)
    expect(isEditableFieldPath("education[1]")).toBe(true)
    expect(isEditableFieldPath("education[1].institution")).toBe(true)
  })

  it("accepts skills paths", () => {
    expect(isEditableFieldPath("skills")).toBe(true)
    expect(isEditableFieldPath("skills[0]")).toBe(true)
    expect(isEditableFieldPath("skills[0].name")).toBe(true)
    expect(isEditableFieldPath("skills[0].items")).toBe(true)
    expect(isEditableFieldPath("skills[0].items[3]")).toBe(true)
  })

  it("rejects unknown fields", () => {
    expect(isEditableFieldPath("header.streetAddress")).toBe(false)
    expect(isEditableFieldPath("profile")).toBe(false)
    expect(isEditableFieldPath("experience[0].description")).toBe(false)
  })
})

describe("FEEDBACK_ACTIONS", () => {
  it("contains the four actions", () => {
    expect(FEEDBACK_ACTIONS).toEqual([
      "replace",
      "add",
      "remove",
      "advice",
    ])
  })
})
