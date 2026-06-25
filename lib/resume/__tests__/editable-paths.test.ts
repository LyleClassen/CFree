import { describe, it, expect } from "vitest"
import {
  isEditableFieldPath,
  isReplaceableFieldPath,
  isAddableStringFieldPath,
  isRemovableFieldPath,
  REPLACE_PATTERNS,
  ADD_STRING_PATTERNS,
  REMOVE_PATTERNS,
  ALL_PATTERNS,
  PATH_DEFINITIONS,
  buildCapabilitiesPrompt,
} from "@/lib/resume/editable-paths"

describe("isEditableFieldPath", () => {
  it("accepts header fields", () => {
    expect(isEditableFieldPath("header.fullName")).toBe(true)
    expect(isEditableFieldPath("header.email")).toBe(true)
    expect(isEditableFieldPath("header.phone")).toBe(true)
    expect(isEditableFieldPath("header.city")).toBe(true)
    expect(isEditableFieldPath("header.country")).toBe(true)
    expect(isEditableFieldPath("header.linkedin")).toBe(true)
  })

  it("accepts summary", () => {
    expect(isEditableFieldPath("summary")).toBe(true)
  })

  it("accepts experience paths", () => {
    expect(isEditableFieldPath("experience")).toBe(true)
    expect(isEditableFieldPath("experience[0]")).toBe(true)
    expect(isEditableFieldPath("experience[0].role")).toBe(true)
    expect(isEditableFieldPath("experience[0].company")).toBe(true)
    expect(isEditableFieldPath("experience[0].startDate")).toBe(true)
    expect(isEditableFieldPath("experience[0].endDate")).toBe(true)
    expect(isEditableFieldPath("experience[0].location")).toBe(true)
    expect(isEditableFieldPath("experience[0].bullets")).toBe(true)
    expect(isEditableFieldPath("experience[0].bullets[2]")).toBe(true)
    expect(isEditableFieldPath("experience[5].bullets[0]")).toBe(true)
  })

  it("accepts education paths", () => {
    expect(isEditableFieldPath("education")).toBe(true)
    expect(isEditableFieldPath("education[1]")).toBe(true)
    expect(isEditableFieldPath("education[1].institution")).toBe(true)
    expect(isEditableFieldPath("education[1].degree")).toBe(true)
    expect(isEditableFieldPath("education[1].field")).toBe(true)
    expect(isEditableFieldPath("education[1].graduationDate")).toBe(true)
    expect(isEditableFieldPath("education[1].gpa")).toBe(true)
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
    expect(isEditableFieldPath("header")).toBe(false)
    expect(isEditableFieldPath("")).toBe(false)
  })

  it("rejects malformed indices", () => {
    expect(isEditableFieldPath("experience[x]")).toBe(false)
    expect(isEditableFieldPath("experience[].role")).toBe(false)
  })
})

describe("isReplaceableFieldPath", () => {
  it("accepts leaf string fields", () => {
    expect(isReplaceableFieldPath("header.fullName")).toBe(true)
    expect(isReplaceableFieldPath("summary")).toBe(true)
    expect(isReplaceableFieldPath("experience[0].role")).toBe(true)
    expect(isReplaceableFieldPath("experience[0].bullets[2]")).toBe(true)
    expect(isReplaceableFieldPath("education[1].institution")).toBe(true)
    expect(isReplaceableFieldPath("skills[0].name")).toBe(true)
    expect(isReplaceableFieldPath("skills[0].items[3]")).toBe(true)
  })

  it("rejects container paths", () => {
    expect(isReplaceableFieldPath("experience")).toBe(false)
    expect(isReplaceableFieldPath("experience[0]")).toBe(false)
    expect(isReplaceableFieldPath("experience[0].bullets")).toBe(false)
    expect(isReplaceableFieldPath("education")).toBe(false)
    expect(isReplaceableFieldPath("skills")).toBe(false)
    expect(isReplaceableFieldPath("skills[0].items")).toBe(false)
  })
})

describe("isAddableStringFieldPath", () => {
  it("accepts string array containers", () => {
    expect(isAddableStringFieldPath("experience[0].bullets")).toBe(true)
    expect(isAddableStringFieldPath("skills[0].items")).toBe(true)
    expect(isAddableStringFieldPath("experience[5].bullets")).toBe(true)
  })

  it("rejects non-container paths", () => {
    expect(isAddableStringFieldPath("header.fullName")).toBe(false)
    expect(isAddableStringFieldPath("experience[0].role")).toBe(false)
    expect(isAddableStringFieldPath("experience[0].bullets[2]")).toBe(false)
    expect(isAddableStringFieldPath("experience")).toBe(false)
    expect(isAddableStringFieldPath("education")).toBe(false)
    expect(isAddableStringFieldPath("skills")).toBe(false)
    expect(isAddableStringFieldPath("skills[0]")).toBe(false)
  })
})

describe("isRemovableFieldPath", () => {
  it("accepts array elements", () => {
    expect(isRemovableFieldPath("experience[0]")).toBe(true)
    expect(isRemovableFieldPath("education[1]")).toBe(true)
    expect(isRemovableFieldPath("skills[2]")).toBe(true)
    expect(isRemovableFieldPath("experience[0].bullets[2]")).toBe(true)
    expect(isRemovableFieldPath("skills[0].items[3]")).toBe(true)
  })

  it("rejects non-element paths", () => {
    expect(isRemovableFieldPath("header.fullName")).toBe(false)
    expect(isRemovableFieldPath("experience")).toBe(false)
    expect(isRemovableFieldPath("experience[0].bullets")).toBe(false)
    expect(isRemovableFieldPath("experience[0].role")).toBe(false)
  })
})

describe("PATH_DEFINITIONS", () => {
  it("contains all 28 entries", () => {
    expect(PATH_DEFINITIONS).toHaveLength(28)
  })

  it("each definition has a unique template", () => {
    const templates = PATH_DEFINITIONS.map((d) => d.template)
    expect(new Set(templates).size).toBe(templates.length)
  })

  it("every action is replace, add, or remove", () => {
    const valid = new Set(["replace", "add", "remove"])
    for (const def of PATH_DEFINITIONS) {
      for (const action of def.actions) {
        expect(valid.has(action)).toBe(true)
      }
    }
  })
})

describe("compiled pattern arrays", () => {
  it("REPLACE_PATTERNS matches known replace paths", () => {
    expect(REPLACE_PATTERNS.some((r) => r.test("header.city"))).toBe(true)
    expect(REPLACE_PATTERNS.some((r) => r.test("experience"))).toBe(false)
  })

  it("ADD_STRING_PATTERNS matches known add paths", () => {
    expect(ADD_STRING_PATTERNS.some((r) => r.test("experience[0].bullets"))).toBe(true)
    expect(ADD_STRING_PATTERNS.some((r) => r.test("skills[0].items"))).toBe(true)
    expect(ADD_STRING_PATTERNS.some((r) => r.test("header.fullName"))).toBe(false)
  })

  it("REMOVE_PATTERNS matches known remove paths", () => {
    expect(REMOVE_PATTERNS.some((r) => r.test("experience[0]"))).toBe(true)
    expect(REMOVE_PATTERNS.some((r) => r.test("skills[1].items[2]"))).toBe(true)
    expect(REMOVE_PATTERNS.some((r) => r.test("header.fullName"))).toBe(false)
  })

  it("ALL_PATTERNS contains every unique template", () => {
    const uniqueTemplates = new Set(PATH_DEFINITIONS.map((d) => d.template))
    expect(ALL_PATTERNS.length).toBe(uniqueTemplates.size)
  })

  it("ALL_PATTERNS is a superset of the other arrays", () => {
    const allTest = (p: string) => ALL_PATTERNS.some((r) => r.test(p))
    expect(allTest("header.city")).toBe(true)
    expect(allTest("experience")).toBe(true)
    expect(allTest("experience[0].bullets")).toBe(true)
    expect(allTest("experience[0]")).toBe(true)
    expect(allTest("experience[0].bullets[2]")).toBe(true)
  })
})

describe("buildCapabilitiesPrompt", () => {
  it("returns a non-empty string", () => {
    const prompt = buildCapabilitiesPrompt()
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("mentions all sections", () => {
    const prompt = buildCapabilitiesPrompt()
    expect(prompt).toContain("header")
    expect(prompt).toContain("summary")
    expect(prompt).toContain("experience")
    expect(prompt).toContain("education")
    expect(prompt).toContain("skills")
  })

  it("includes path annotations", () => {
    const prompt = buildCapabilitiesPrompt()
    expect(prompt).toContain("(add a role)")
    expect(prompt).toContain("(add a category)")
    expect(prompt).toContain("(add a skill)")
  })

  it("includes action descriptions", () => {
    const prompt = buildCapabilitiesPrompt()
    expect(prompt).toContain('"replace"')
    expect(prompt).toContain('"add"')
    expect(prompt).toContain('"remove"')
    expect(prompt).toContain('"advice"')
  })

  it("includes section notes", () => {
    const prompt = buildCapabilitiesPrompt()
    expect(prompt).toContain("Mon YYYY")
    expect(prompt).toContain("split into city")
    expect(prompt).toContain("named categories")
  })

  it("is deterministic", () => {
    expect(buildCapabilitiesPrompt()).toBe(buildCapabilitiesPrompt())
  })
})
