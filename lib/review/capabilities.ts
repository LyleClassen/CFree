// Single source of truth for what the builder can actually edit. Drives both
// the constrained review prompt (so the AI only suggests applicable edits) and
// feedback validation (so we drop suggestions targeting non-editable fields).
// A future auto-correct feature will resolve `fieldPath` against the live
// `Resume` and apply the suggested value.

import type { FeedbackAction } from "@/lib/review/types"

/**
 * Patterns for every editable path in the `Resume` model. `n` placeholders are
 * matched as array indices. Anchored, matched case-sensitively.
 */
const EDITABLE_PATH_PATTERNS: RegExp[] = [
  /^header\.(fullName|email|phone|city|country|linkedin)$/,
  /^summary$/,
  /^experience$/, // add a new role
  /^experience\[\d+\]$/, // a whole role (e.g. remove)
  /^experience\[\d+\]\.(role|company|startDate|endDate|location)$/,
  /^experience\[\d+\]\.bullets$/, // add a bullet
  /^experience\[\d+\]\.bullets\[\d+\]$/,
  /^education$/,
  /^education\[\d+\]$/,
  /^education\[\d+\]\.(institution|degree|field|graduationDate|gpa)$/,
  /^skills$/, // add a category
  /^skills\[\d+\]$/, // a whole category
  /^skills\[\d+\]\.name$/,
  /^skills\[\d+\]\.items$/, // add a skill
  /^skills\[\d+\]\.items\[\d+\]$/,
]

export const FEEDBACK_ACTIONS: FeedbackAction[] = [
  "replace",
  "add",
  "remove",
  "advice",
]

/** True when `path` targets a field the builder can actually edit. */
export function isEditableFieldPath(path: string): boolean {
  return EDITABLE_PATH_PATTERNS.some((re) => re.test(path))
}

/**
 * Prompt fragment describing exactly what the app can change. Embedded in the
 * review system prompt so the model never suggests edits the app can't apply.
 */
export const CAPABILITIES_PROMPT = `CAPABILITIES — the resume is stored as structured JSON and the app can ONLY apply edits that map to its fields. Every suggestion you make MUST correspond to one of the editable paths below. Do NOT suggest anything the app cannot do (e.g. "run the Notepad/Word parse test", change fonts/margins/colors, add a photo, use external tools, or rename sections).

Editable fields and the "fieldPath" to use:
- header.fullName, header.email, header.phone, header.city, header.country, header.linkedin
  (location is split into city + country — never suggest a full street address)
- summary  (free text; encourage one quantified achievement)
- experience  (add a role) | experience[i]  (a whole role) | experience[i].role | experience[i].company | experience[i].startDate | experience[i].endDate | experience[i].location | experience[i].bullets  (add a bullet) | experience[i].bullets[j]  (one bullet)
  (dates use the canonical format "Mon YYYY", e.g. "Oct 2022"; ongoing roles use "Present")
- education  (add) | education[i] | education[i].institution | education[i].degree | education[i].field | education[i].graduationDate | education[i].gpa
- skills  (add a category) | skills[i]  (a whole category) | skills[i].name  (category label) | skills[i].items  (add a skill) | skills[i].items[j]  (one skill)
  (skills are grouped into named categories — suggest grouping via skills[i].name)

"action" must be one of: "replace" (overwrite the value at fieldPath), "add" (append a new item — use the container path like "experience[2].bullets" or "skills"), "remove" (delete the item at fieldPath), or "advice" (guidance with no single concrete value).
When action is "replace" or "add", set "suggestedValue" to the exact text to write. For "advice", omit "fieldPath" and "suggestedValue".`
