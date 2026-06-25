// Resolves a feedback item's `fieldPath` against the live `Resume` and applies
// (or reverts) its `suggestedValue`. The set of paths handled here mirrors the
// editable-path manifest in `@/lib/review/capabilities` — feedback is already
// validated against that manifest in `normalizeReview`, so by the time an item
// reaches us its `fieldPath` is known-editable; we only narrow further to the
// subset auto-correct can apply from a string `suggestedValue`.

import type { Resume } from "@/lib/resume/types"
import type { FeedbackItem } from "@/lib/review/types"

/** Tokenize a dot/bracket path into segments, e.g.
 * "experience[0].bullets[2]" -> ["experience", 0, "bullets", 2]. */
export function parsePath(path: string): (string | number)[] {
  const segments: (string | number)[] = []
  for (const part of path.split(".")) {
    const match = part.match(/^([^[]+)((?:\[\d+\])*)$/)
    if (!match) {
      segments.push(part)
      continue
    }
    const [, key, indices] = match
    if (key) segments.push(key)
    for (const idx of indices.matchAll(/\[(\d+)\]/g)) {
      segments.push(Number(idx[1]))
    }
  }
  return segments
}

/**
 * Walk to the container that holds the final segment, returning the container
 * and the final key/index. Returns null if any intermediate segment is missing.
 */
function resolveParent(
  root: Resume,
  segments: (string | number)[]
): { parent: Record<string | number, unknown>; key: string | number } | null {
  if (segments.length === 0) return null
  let current: unknown = root
  for (let i = 0; i < segments.length - 1; i++) {
    if (current == null || typeof current !== "object") return null
    current = (current as Record<string | number, unknown>)[segments[i]]
  }
  if (current == null || typeof current !== "object") return null
  return {
    parent: current as Record<string | number, unknown>,
    key: segments[segments.length - 1],
  }
}

// Paths whose value is an editable string — `replace` targets.
const STRING_FIELD_PATTERNS: RegExp[] = [
  /^header\.(fullName|email|phone|city|country|linkedin)$/,
  /^summary$/,
  /^experience\[\d+\]\.(role|company|startDate|endDate|location)$/,
  /^experience\[\d+\]\.bullets\[\d+\]$/,
  /^education\[\d+\]\.(institution|degree|field|graduationDate|gpa)$/,
  /^skills\[\d+\]\.name$/,
  /^skills\[\d+\]\.items\[\d+\]$/,
]

// Containers that hold strings — the only `add` targets we can fill from a
// string `suggestedValue` (top-level entry arrays need a structured object).
const STRING_ARRAY_PATTERNS: RegExp[] = [
  /^experience\[\d+\]\.bullets$/,
  /^skills\[\d+\]\.items$/,
]

// Array elements that can be removed.
const ARRAY_ELEMENT_PATTERNS: RegExp[] = [
  /^experience\[\d+\]$/,
  /^education\[\d+\]$/,
  /^skills\[\d+\]$/,
  /^experience\[\d+\]\.bullets\[\d+\]$/,
  /^skills\[\d+\]\.items\[\d+\]$/,
]

function matchesAny(path: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(path))
}

/**
 * True when a feedback item carries a concrete edit auto-correct can apply.
 * Pure (path + action + value only) so the UI can use it to decide whether to
 * render an Apply button.
 */
export function isApplicableFeedback(item: FeedbackItem): boolean {
  const { fieldPath, action } = item
  if (!fieldPath || !action) return false
  switch (action) {
    case "replace":
      return (
        typeof item.suggestedValue === "string" &&
        matchesAny(fieldPath, STRING_FIELD_PATTERNS)
      )
    case "add":
      return (
        typeof item.suggestedValue === "string" &&
        matchesAny(fieldPath, STRING_ARRAY_PATTERNS)
      )
    case "remove":
      return matchesAny(fieldPath, ARRAY_ELEMENT_PATTERNS)
    default:
      return false
  }
}

/** The inverse of an applied edit, enough to undo it. */
export type ReversePatch =
  | { kind: "replace"; path: string; previousValue: unknown }
  | { kind: "removeAppended"; containerPath: string; index: number }
  | { kind: "reinsert"; containerPath: string; index: number; value: unknown }

/**
 * Apply a feedback item to `draft` in place. Returns the patch needed to undo
 * it, or null if the item isn't applicable or its path doesn't resolve against
 * this resume.
 */
export function applyFeedbackToDraft(
  draft: Resume,
  item: FeedbackItem
): ReversePatch | null {
  if (!isApplicableFeedback(item) || !item.fieldPath) return null
  const segments = parsePath(item.fieldPath)

  if (item.action === "replace") {
    const resolved = resolveParent(draft, segments)
    if (!resolved) return null
    const { parent, key } = resolved
    const previousValue = parent[key]
    parent[key] = item.suggestedValue
    return { kind: "replace", path: item.fieldPath, previousValue }
  }

  if (item.action === "add") {
    const resolved = resolveParent(draft, segments)
    if (!resolved) return null
    const { parent, key } = resolved
    const container = parent[key]
    if (!Array.isArray(container)) return null
    const index = container.length
    container.push(item.suggestedValue)
    return { kind: "removeAppended", containerPath: item.fieldPath, index }
  }

  if (item.action === "remove") {
    const resolved = resolveParent(draft, segments)
    if (!resolved) return null
    const { parent, key } = resolved
    if (!Array.isArray(parent) || typeof key !== "number") return null
    const [value] = parent.splice(key, 1)
    const containerPath = item.fieldPath.replace(/\[\d+\]$/, "")
    return { kind: "reinsert", containerPath, index: key, value }
  }

  return null
}

/** Apply the inverse of a previously-applied edit to `draft` in place. */
export function revertPatch(draft: Resume, patch: ReversePatch): void {
  if (patch.kind === "replace") {
    const resolved = resolveParent(draft, parsePath(patch.path))
    if (!resolved) return
    resolved.parent[resolved.key] = patch.previousValue
    return
  }

  const resolved = resolveParent(draft, parsePath(patch.containerPath))
  if (!resolved) return
  const container = resolved.parent[resolved.key]
  if (!Array.isArray(container)) return

  if (patch.kind === "removeAppended") {
    // Only undo if the appended item is still the tail, to stay safe under
    // out-of-order single-item undo.
    if (patch.index === container.length - 1) container.pop()
    return
  }

  // reinsert
  container.splice(Math.min(patch.index, container.length), 0, patch.value)
}
