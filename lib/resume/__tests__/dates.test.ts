import { describe, it, expect } from "vitest"
import { normalizeDateString } from "@/lib/resume/dates"

describe("normalizeDateString", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeDateString("")).toBe("")
    expect(normalizeDateString("   ")).toBe("")
  })

  it("preserves the Present literal", () => {
    expect(normalizeDateString("Present")).toBe("Present")
    expect(normalizeDateString("present")).toBe("Present")
  })

  it("parses 'Month YYYY' format", () => {
    expect(normalizeDateString("October 2022")).toBe("Oct 2022")
    expect(normalizeDateString("Jan 2021")).toBe("Jan 2021")
  })

  it("parses abbreviated month with period", () => {
    expect(normalizeDateString("Oct. 2022")).toBe("Oct 2022")
  })

  it("parses numeric month/year formats", () => {
    expect(normalizeDateString("10/2022")).toBe("Oct 2022")
    expect(normalizeDateString("10-2022")).toBe("Oct 2022")
    expect(normalizeDateString("10.2022")).toBe("Oct 2022")
  })

  it("parses ISO month/year format", () => {
    expect(normalizeDateString("2022-10")).toBe("Oct 2022")
    expect(normalizeDateString("2022/10")).toBe("Oct 2022")
  })

  it("parses MM/DD/YYYY and YYYY-MM-DD formats", () => {
    expect(normalizeDateString("10/15/2022")).toBe("Oct 2022")
    expect(normalizeDateString("2022-10-15")).toBe("Oct 2022")
  })

  it("preserves bare years", () => {
    expect(normalizeDateString("2021")).toBe("2021")
  })

  it("returns unrecognized input unchanged", () => {
    expect(normalizeDateString("sometime in 2021")).toBe("sometime in 2021")
  })
})
