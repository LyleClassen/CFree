import { describe, it, expect } from "vitest"
import { MANUAL_CHECKLIST } from "@/lib/review/checklist"

describe("MANUAL_CHECKLIST", () => {
  it("contains four checklist groups", () => {
    expect(MANUAL_CHECKLIST).toHaveLength(4)
  })

  it("each group has a category and items", () => {
    for (const group of MANUAL_CHECKLIST) {
      expect(group.category).toBeTruthy()
      expect(group.items.length).toBeGreaterThan(0)
      for (const item of group.items) {
        expect(typeof item).toBe("string")
        expect(item.length).toBeGreaterThan(0)
      }
    }
  })

  it("includes ATS Compatibility and Achievement Impact groups", () => {
    const categories = MANUAL_CHECKLIST.map((g) => g.category)
    expect(categories).toContain("ATS Compatibility")
    expect(categories).toContain("Achievement Impact")
    expect(categories).toContain("Professional Format")
  })
})
