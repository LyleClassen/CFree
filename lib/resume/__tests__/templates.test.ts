import { describe, it, expect } from "vitest"
import { TEMPLATES } from "@/lib/resume/templates"

describe("TEMPLATES", () => {
  it("contains exactly four templates", () => {
    expect(TEMPLATES).toHaveLength(4)
  })

  it("includes all required template identifiers", () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(ids).toContain("professional")
    expect(ids).toContain("modern")
    expect(ids).toContain("minimal")
    expect(ids).toContain("executive")
  })

  it("every template has the required metadata", () => {
    for (const t of TEMPLATES) {
      expect(t.label).toBeTruthy()
      expect(t.codename).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(typeof t.serif).toBe("boolean")
      expect(["rule", "bar", "plain", "flanked"]).toContain(t.heading)
    }
  })

  it("only the executive template uses serif", () => {
    const serifOnes = TEMPLATES.filter((t) => t.serif)
    expect(serifOnes).toHaveLength(1)
    expect(serifOnes[0].id).toBe("executive")
  })
})
