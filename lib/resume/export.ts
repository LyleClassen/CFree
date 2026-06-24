import type { Resume } from "@/lib/resume/types"

/** Build the `FirstName_LastName_Resume.pdf` download name from the header. */
export function exportFileName(resume: Resume): string {
  const name = resume.header.fullName.trim()
  if (!name) return "Resume.pdf"
  const slug = name
    .split(/\s+/)
    .map((part) => part.replace(/[^\w-]/g, ""))
    .filter(Boolean)
    .join("_")
  return slug ? `${slug}_Resume.pdf` : "Resume.pdf"
}
