import { describe, it, expect } from "vitest"
import { heuristicParse } from "@/lib/import/heuristic"

describe("heuristicParse", () => {
  it("returns an empty resume for empty text", () => {
    const r = heuristicParse("")
    expect(r.header.fullName).toBe("")
    expect(r.experience).toEqual([])
  })

  it("extracts the name from the first non-contact line", () => {
    const r = heuristicParse("Jane Doe\njane@example.com\n555-1234")
    expect(r.header.fullName).toBe("Jane Doe")
  })

  it("extracts email and phone from header lines", () => {
    const r = heuristicParse(
      "Jane Doe\njane@example.com\n(555) 123-4567\nCape Town"
    )
    expect(r.header.email).toBe("jane@example.com")
    expect(r.header.phone).toBe("(555) 123-4567")
  })

  it("extracts LinkedIn URL from the full text", () => {
    const r = heuristicParse(
      "Jane Doe\nlinkedin.com/in/jane\nA skilled engineer."
    )
    expect(r.header.linkedin).toContain("linkedin.com/in/jane")
  })

  it("parses section headings and buckets content", () => {
    const r = heuristicParse([
      "Jane Doe",
      "SUMMARY",
      "A skilled engineer.",
      "EXPERIENCE",
      "Acme Inc.",
      "Built stuff.",
      "Shipped things.",
      "EDUCATION",
      "MIT",
      "B.S. Computer Science",
      "SKILLS",
      "React, TypeScript",
    ].join("\n"))
    expect(r.summary).toBe("A skilled engineer.")
    expect(r.experience[0].role).toBe("Acme Inc.")
    expect(r.experience[0].bullets).toContain("Built stuff.")
    expect(r.experience[0].bullets).toContain("Shipped things.")
    expect(r.education[0].institution).toBe("MIT")
    expect(r.education[0].degree).toBe("B.S. Computer Science")
    expect(r.skills[0].items).toContain("React")
  })
})
