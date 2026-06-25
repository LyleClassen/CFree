import { describe, it, expect } from "vitest"
import { normalizeResume } from "@/lib/resume/storage"

describe("normalizeResume", () => {
  it("returns an empty resume for null/undefined input", () => {
    const r = normalizeResume(null)
    expect(r.header.fullName).toBe("")
    expect(r.experience).toEqual([])
  })

  it("returns an empty resume for non-object input", () => {
    expect(normalizeResume("foo").header.fullName).toBe("")
  })

  it("preserves valid header fields", () => {
    const r = normalizeResume({
      header: {
        fullName: "Jane Doe",
        email: "jane@example.com",
        phone: "555-1234",
        city: "Cape Town",
        country: "South Africa",
      },
    })
    expect(r.header.fullName).toBe("Jane Doe")
    expect(r.header.email).toBe("jane@example.com")
    expect(r.header.city).toBe("Cape Town")
    expect(r.header.country).toBe("South Africa")
  })

  it("migrates legacy location into city/country", () => {
    const r = normalizeResume({
      header: { location: "Cape Town, South Africa" },
    })
    expect(r.header.city).toBe("Cape Town")
    expect(r.header.country).toBe("South Africa")
  })

  it("normalizes experience entries", () => {
    const r = normalizeResume({
      experience: [
        {
          role: "Engineer",
          company: "Acme",
          startDate: "Jan 2022",
          endDate: "Present",
          bullets: ["Built things", "Shipped features"],
        },
      ],
    })
    expect(r.experience).toHaveLength(1)
    expect(r.experience[0].role).toBe("Engineer")
    expect(r.experience[0].bullets).toEqual(["Built things", "Shipped features"])
  })

  it("normalizes education entries", () => {
    const r = normalizeResume({
      education: [
        {
          institution: "MIT",
          degree: "B.S.",
          field: "CS",
          graduationDate: "2021",
        },
      ],
    })
    expect(r.education).toHaveLength(1)
    expect(r.education[0].institution).toBe("MIT")
  })

  it("converts non-array experience/education to empty arrays", () => {
    const r = normalizeResume({ experience: "invalid", education: null })
    expect(r.experience).toEqual([])
    expect(r.education).toEqual([])
  })
})

describe("normalizeResume — skills", () => {
  it("handles null/missing skills", () => {
    expect(normalizeResume({}).skills).toEqual([])
  })

  it("wraps legacy flat string arrays into one uncategorized group", () => {
    const r = normalizeResume({ skills: ["React", "TypeScript", "Node"] })
    expect(r.skills).toHaveLength(1)
    expect(r.skills[0].name).toBe("")
    expect(r.skills[0].items).toEqual(["React", "TypeScript", "Node"])
  })

  it("normalizes grouped skill format", () => {
    const r = normalizeResume({
      skills: [
        { name: "Front-End", items: ["React", "CSS"] },
        { name: "Back-End", items: ["Node", "Python"] },
      ],
    })
    expect(r.skills).toHaveLength(2)
    expect(r.skills[0].items).toEqual(["React", "CSS"])
    expect(r.skills[1].name).toBe("Back-End")
  })

  it("drops empty groups", () => {
    const r = normalizeResume({
      skills: [
        { name: "Empty", items: [] },
        { name: "Has Skills", items: ["Go"] },
      ],
    })
    expect(r.skills).toHaveLength(1)
    expect(r.skills[0].name).toBe("Has Skills")
  })
})
