// The canonical structured resume model. Every feature (import, edit, review,
// render, export) reads from and writes to this single shape.

export interface ResumeHeader {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin?: string
}

export interface ExperienceEntry {
  id: string
  company: string
  role: string
  /** Free-form, e.g. "Jan 2022". */
  startDate: string
  /** Free-form end date, or the literal "Present" for an ongoing role. */
  endDate: string
  location: string
  bullets: string[]
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  field: string
  graduationDate: string
  gpa?: string
}

export interface Resume {
  header: ResumeHeader
  summary: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills: string[]
}

/** The set of available template identifiers. */
export type TemplateId = "professional" | "modern" | "minimal" | "executive"

export const TEMPLATE_IDS: TemplateId[] = [
  "professional",
  "modern",
  "minimal",
  "executive",
]

/** The literal value stored in `endDate` for an ongoing role. */
export const PRESENT = "Present"
