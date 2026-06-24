import { emptyResume, makeId } from "@/lib/resume/factory"
import type { Resume } from "@/lib/resume/types"

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/
const PHONE_RE = /(\+?\(?\d[\d\s().-]{7,}\d)/
const LINKEDIN_RE = /(linkedin\.com\/[^\s,]+)/i

type SectionKey = "summary" | "experience" | "education" | "skills"

const HEADINGS: { key: SectionKey; patterns: RegExp }[] = [
  { key: "summary", patterns: /^(professional\s+)?(summary|profile|objective|about)\b/i },
  { key: "experience", patterns: /^(work\s+|professional\s+)?(experience|employment|history)\b/i },
  { key: "education", patterns: /^education\b/i },
  { key: "skills", patterns: /^(technical\s+)?(skills|competencies|technologies)\b/i },
]

function classifyHeading(line: string): SectionKey | null {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > 40) return null
  for (const h of HEADINGS) {
    if (h.patterns.test(trimmed)) return h.key
  }
  return null
}

/**
 * Best-effort, dependency-free mapping of raw resume text into the canonical
 * model. Used when no LLM is configured. Intentionally conservative: the user
 * corrects the result in the editor.
 */
export function heuristicParse(text: string): Resume {
  const resume = emptyResume()
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) return resume

  // Header heuristics from the first handful of lines.
  const headerScan = lines.slice(0, 8).join("  ")
  resume.header.email = headerScan.match(EMAIL_RE)?.[0] ?? ""
  resume.header.phone = headerScan.match(PHONE_RE)?.[0]?.trim() ?? ""
  resume.header.linkedin = headerScan.match(LINKEDIN_RE)?.[0] ?? ""

  // First line that isn't contact info is most likely the name.
  const nameLine = lines.find(
    (l) => !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !LINKEDIN_RE.test(l)
  )
  if (nameLine && nameLine.length <= 60) resume.header.fullName = nameLine

  // Bucket the remaining lines by detected section heading.
  const buckets: Record<SectionKey, string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
  }
  let current: SectionKey | null = null
  for (const line of lines) {
    const heading = classifyHeading(line)
    if (heading) {
      current = heading
      continue
    }
    if (current) buckets[current].push(line)
  }

  resume.summary = buckets.summary.join(" ").trim()

  if (buckets.experience.length > 0) {
    resume.experience = [
      {
        id: makeId(),
        company: "",
        role: buckets.experience[0] ?? "",
        startDate: "",
        endDate: "",
        location: "",
        bullets: buckets.experience.slice(1),
      },
    ]
  }

  if (buckets.education.length > 0) {
    resume.education = [
      {
        id: makeId(),
        institution: buckets.education[0] ?? "",
        degree: buckets.education[1] ?? "",
        field: "",
        graduationDate: "",
        gpa: "",
      },
    ]
  }

  if (buckets.skills.length > 0) {
    resume.skills = buckets.skills
      .join(",")
      .split(/[,•|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 60)
  }

  return resume
}
