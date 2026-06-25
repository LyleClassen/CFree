import { describe, it, expect } from "vitest"
import { exportFileName } from "@/lib/resume/export"
import { emptyResume } from "@/lib/resume/factory"

describe("exportFileName", () => {
  it("builds a file name from the full name", () => {
    const resume = emptyResume()
    resume.header.fullName = "Jane Doe"
    expect(exportFileName(resume)).toBe("Jane_Doe_Resume.pdf")
  })

  it("replaces special characters in the name", () => {
    const resume = emptyResume()
    resume.header.fullName = "John 'Jack' Smith"
    expect(exportFileName(resume)).toBe("John_Jack_Smith_Resume.pdf")
  })

  it("falls back to Resume.pdf when name is empty", () => {
    expect(exportFileName(emptyResume())).toBe("Resume.pdf")
  })

  it("falls back to Resume.pdf when name is only whitespace", () => {
    const resume = emptyResume()
    resume.header.fullName = "   "
    expect(exportFileName(resume)).toBe("Resume.pdf")
  })

  it("handles a single name", () => {
    const resume = emptyResume()
    resume.header.fullName = "Madonna"
    expect(exportFileName(resume)).toBe("Madonna_Resume.pdf")
  })
})
