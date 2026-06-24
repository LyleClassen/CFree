import { emptyResume, makeId } from "@/lib/resume/factory"
import type { Resume, TemplateId } from "@/lib/resume/types"
import { TEMPLATE_IDS } from "@/lib/resume/types"

const RESUME_KEY = "resume-builder:resume"
const TEMPLATE_KEY = "resume-builder:template"

export const DEFAULT_TEMPLATE: TemplateId = "professional"

/**
 * Coerce arbitrary parsed JSON into a valid `Resume`, filling missing fields
 * and assigning ids to repeatable entries. Tolerant by design: imported and
 * persisted data is never fully trusted.
 */
export function normalizeResume(input: unknown): Resume {
  const base = emptyResume()
  if (!input || typeof input !== "object") return base
  const data = input as Record<string, unknown>

  const header = (data.header ?? {}) as Record<string, unknown>
  base.header = {
    fullName: str(header.fullName),
    email: str(header.email),
    phone: str(header.phone),
    location: str(header.location),
    linkedin: str(header.linkedin),
  }

  base.summary = str(data.summary)

  if (Array.isArray(data.experience)) {
    base.experience = data.experience.map((raw) => {
      const e = (raw ?? {}) as Record<string, unknown>
      return {
        id: str(e.id) || makeId(),
        company: str(e.company),
        role: str(e.role),
        startDate: str(e.startDate),
        endDate: str(e.endDate),
        location: str(e.location),
        bullets: Array.isArray(e.bullets)
          ? e.bullets.map(str).filter((b) => b.length > 0)
          : [],
      }
    })
  }

  if (Array.isArray(data.education)) {
    base.education = data.education.map((raw) => {
      const e = (raw ?? {}) as Record<string, unknown>
      return {
        id: str(e.id) || makeId(),
        institution: str(e.institution),
        degree: str(e.degree),
        field: str(e.field),
        graduationDate: str(e.graduationDate),
        gpa: str(e.gpa),
      }
    })
  }

  if (Array.isArray(data.skills)) {
    base.skills = data.skills.map(str).filter((s) => s.length > 0)
  }

  return base
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v)
}

export function loadResume(): Resume | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(RESUME_KEY)
    if (!raw) return null
    return normalizeResume(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveResume(resume: Resume): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(RESUME_KEY, JSON.stringify(resume))
  } catch {
    // Quota or serialization failure — ignore; in-memory state still works.
  }
}

export function loadTemplate(): TemplateId {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE
  try {
    const raw = window.localStorage.getItem(TEMPLATE_KEY)
    if (raw && (TEMPLATE_IDS as string[]).includes(raw)) {
      return raw as TemplateId
    }
  } catch {
    // ignore
  }
  return DEFAULT_TEMPLATE
}

export function saveTemplate(template: TemplateId): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(TEMPLATE_KEY, template)
  } catch {
    // ignore
  }
}
