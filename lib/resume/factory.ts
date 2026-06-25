import type {
  EducationEntry,
  ExperienceEntry,
  Resume,
  SkillGroup,
} from "@/lib/resume/types"

/** Stable-ish unique id for repeatable entries (client-only usage). */
export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** A fresh resume conforming to the canonical model — all sections present. */
export function emptyResume(): Resume {
  return {
    header: {
      fullName: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      linkedin: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
  }
}

export function emptyExperience(): ExperienceEntry {
  return {
    id: makeId(),
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    location: "",
    bullets: [""],
  }
}

export function emptySkillGroup(name = ""): SkillGroup {
  return {
    id: makeId(),
    name,
    items: [],
  }
}

export function emptyEducation(): EducationEntry {
  return {
    id: makeId(),
    institution: "",
    degree: "",
    field: "",
    graduationDate: "",
    gpa: "",
  }
}
