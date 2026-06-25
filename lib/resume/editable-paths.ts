export interface EditablePathDef {
  template: string
  actions: ("replace" | "add" | "remove")[]
  /** When true, the "add" action appends a plain string value (not a structured object). */
  addsString?: boolean
}

export const PATH_DEFINITIONS: EditablePathDef[] = [
  { template: "header.fullName", actions: ["replace"] },
  { template: "header.email", actions: ["replace"] },
  { template: "header.phone", actions: ["replace"] },
  { template: "header.city", actions: ["replace"] },
  { template: "header.country", actions: ["replace"] },
  { template: "header.linkedin", actions: ["replace"] },
  { template: "summary", actions: ["replace"] },
  { template: "experience", actions: ["add"] },
  { template: "experience[i]", actions: ["remove"] },
  { template: "experience[i].role", actions: ["replace"] },
  { template: "experience[i].company", actions: ["replace"] },
  { template: "experience[i].startDate", actions: ["replace"] },
  { template: "experience[i].endDate", actions: ["replace"] },
  { template: "experience[i].location", actions: ["replace"] },
  { template: "experience[i].bullets", actions: ["add"], addsString: true },
  { template: "experience[i].bullets[j]", actions: ["replace", "remove"] },
  { template: "education", actions: ["add"] },
  { template: "education[i]", actions: ["remove"] },
  { template: "education[i].institution", actions: ["replace"] },
  { template: "education[i].degree", actions: ["replace"] },
  { template: "education[i].field", actions: ["replace"] },
  { template: "education[i].graduationDate", actions: ["replace"] },
  { template: "education[i].gpa", actions: ["replace"] },
  { template: "skills", actions: ["add"] },
  { template: "skills[i]", actions: ["remove"] },
  { template: "skills[i].name", actions: ["replace"] },
  { template: "skills[i].items", actions: ["add"], addsString: true },
  { template: "skills[i].items[j]", actions: ["replace", "remove"] },
]

function templateToRegex(template: string): RegExp {
  const escaped = template
    .replace(/\./g, "\\.")
    .replace(/\[[ijk]\]/g, "\\[\\d+\\]")
  return new RegExp(`^${escaped}$`)
}

function compilePatterns(
  defs: EditablePathDef[],
  action: "replace" | "add" | "remove",
  filter?: (def: EditablePathDef) => boolean,
): RegExp[] {
  const seen = new Set<string>()
  const result: RegExp[] = []
  for (const def of defs) {
    if (def.actions.includes(action) && !seen.has(def.template) && (!filter || filter(def))) {
      seen.add(def.template)
      result.push(templateToRegex(def.template))
    }
  }
  return result
}

function compileAllPatterns(defs: EditablePathDef[]): RegExp[] {
  const seen = new Set<string>()
  const result: RegExp[] = []
  for (const def of defs) {
    if (!seen.has(def.template)) {
      seen.add(def.template)
      result.push(templateToRegex(def.template))
    }
  }
  return result
}

export const REPLACE_PATTERNS: readonly RegExp[] = compilePatterns(PATH_DEFINITIONS, "replace")
export const ADD_STRING_PATTERNS: readonly RegExp[] = compilePatterns(PATH_DEFINITIONS, "add", (d) => d.addsString === true)
export const REMOVE_PATTERNS: readonly RegExp[] = compilePatterns(PATH_DEFINITIONS, "remove")
export const ALL_PATTERNS: readonly RegExp[] = compileAllPatterns(PATH_DEFINITIONS)

export function isReplaceableFieldPath(path: string): boolean {
  return REPLACE_PATTERNS.some((r) => r.test(path))
}

export function isAddableStringFieldPath(path: string): boolean {
  return ADD_STRING_PATTERNS.some((r) => r.test(path))
}

export function isRemovableFieldPath(path: string): boolean {
  return REMOVE_PATTERNS.some((r) => r.test(path))
}

export function isEditableFieldPath(path: string): boolean {
  return ALL_PATTERNS.some((r) => r.test(path))
}

const SECTION_ORDER = ["header", "summary", "experience", "education", "skills"] as const

function sectionOf(template: string): string {
  return template.startsWith("header.") ? "header"
    : template === "summary" ? "summary"
    : template.startsWith("experience") ? "experience"
    : template.startsWith("education") ? "education"
    : template.startsWith("skills") ? "skills"
    : "other"
}

const SECTION_NOTES: Record<string, string> = {
  header: "(location is split into city + country — never suggest a full street address)",
  summary: "(free text; encourage one quantified achievement)",
  experience: '(dates use the canonical format "Mon YYYY", e.g. "Oct 2022"; ongoing roles use "Present")',
  education: "",
  skills: "(skills are grouped into named categories — suggest grouping via skills[i].name)",
}

const PATH_ANNOTATIONS: Record<string, string> = {
  "experience": "(add a role)",
  "experience[i]": "(a whole role)",
  "experience[i].bullets": "(add a bullet)",
  "experience[i].bullets[j]": "(one bullet)",
  "education": "(add)",
  "skills": "(add a category)",
  "skills[i]": "(a whole category)",
  "skills[i].name": "(category label)",
  "skills[i].items": "(add a skill)",
  "skills[i].items[j]": "(one skill)",
}

export function buildCapabilitiesPrompt(): string {
  const sections = groupBySection(PATH_DEFINITIONS)
  const lines: string[] = [
    'CAPABILITIES — the resume is stored as structured JSON and the app can ONLY apply edits that map to its fields. Every suggestion you make MUST correspond to one of the editable paths below. Do NOT suggest anything the app cannot do (e.g. "run the Notepad/Word parse test", change fonts/margins/colors, add a photo, use external tools, or rename sections).',
    "",
    'Editable fields and the "fieldPath" to use:',
  ]

  for (const section of SECTION_ORDER) {
    const defs = sections.get(section)
    if (!defs || defs.length === 0) continue
    const formatted = defs.map(formatPath).join(" | ")
    lines.push(`- ${formatted}`)
    const note = SECTION_NOTES[section]
    if (note) lines.push(`  ${note}`)
  }

  lines.push(
    "",
    '"action" must be one of: "replace" (overwrite the value at fieldPath), "add" (append a new item — use the container path like "experience[2].bullets" or "skills"), "remove" (delete the item at fieldPath), or "advice" (guidance with no single concrete value).',
    'When action is "replace" or "add", set "suggestedValue" to the exact text to write. For "advice", omit "fieldPath" and "suggestedValue".',
  )

  return lines.join("\n")
}

function groupBySection(defs: EditablePathDef[]): Map<string, EditablePathDef[]> {
  const map = new Map<string, EditablePathDef[]>()
  for (const def of defs) {
    const s = sectionOf(def.template)
    if (!map.has(s)) map.set(s, [])
    map.get(s)!.push(def)
  }
  return map
}

function formatPath(def: EditablePathDef): string {
  const annotation = PATH_ANNOTATIONS[def.template]
  return annotation ? `${def.template}  ${annotation}` : def.template
}
