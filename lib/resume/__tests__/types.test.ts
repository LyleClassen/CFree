import { describe, it, expect } from "vitest"
import { TEMPLATE_IDS, PRESENT } from "@/lib/resume/types"

describe("resume types", () => {
  describe("TEMPLATE_IDS", () => {
    it("contains all four template identifiers", () => {
      expect(TEMPLATE_IDS).toEqual([
        "professional",
        "modern",
        "minimal",
        "executive",
      ])
    })
  })

  describe("PRESENT", () => {
    it("is the literal 'Present'", () => {
      expect(PRESENT).toBe("Present")
    })
  })
})
