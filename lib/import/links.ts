// Hyperlink harvesting from uploaded resumes. Resume files carry contact
// details (LinkedIn, email, phone) as hyperlinks whose visible text is just an
// anchor word ("LinkedIn") — the real target lives in a PDF /URI annotation or
// a DOCX relationship. Native text extraction (pdf-parse, mammoth.extractRawText)
// drops these, so we recover them here and feed them to the structurer.

/** Unescape PDF literal-string escapes (\( \) \\) in a /URI value. */
function unescapePdfString(s: string): string {
  return s.replace(/\\([()\\])/g, "$1")
}

/**
 * Extract every URI from PDF /URI annotation entries (e.g. "/URI (https://…)").
 * pdf-parse does not surface these, so we scan the raw binary. Returns http(s),
 * mailto:, and tel: targets, deduped in document order.
 */
export function extractPdfUriAnnotations(buffer: Buffer): string[] {
  const URI_RE = /\/URI\s*\(([^)]*)\)/gi
  const found = new Set<string>()
  for (const m of buffer.toString("latin1").matchAll(URI_RE)) {
    const uri = unescapePdfString(m[1]).trim()
    if (uri) found.add(uri)
  }
  return [...found]
}

/**
 * Extract hyperlink targets from a DOCX. mammoth.extractRawText drops anchors,
 * but convertToHtml preserves them as <a href="…">, so we parse the HTML.
 */
export async function extractDocxHyperlinks(buffer: Buffer): Promise<string[]> {
  const mammoth = (await import("mammoth")).default
  const { value: html } = await mammoth.convertToHtml({ buffer })
  const HREF_RE = /href\s*=\s*"([^"]+)"/gi
  const found = new Set<string>()
  for (const m of html.matchAll(HREF_RE)) {
    const href = m[1].trim()
    if (href) found.add(href)
  }
  return [...found]
}

export interface ClassifiedLinks {
  linkedin?: string
  email?: string
  phone?: string
  other: string[]
}

/** Bucket raw URIs into the header fields they map to. */
export function classifyLinks(uris: string[]): ClassifiedLinks {
  const result: ClassifiedLinks = { other: [] }
  for (const uri of uris) {
    const lower = uri.toLowerCase()
    if (!result.linkedin && lower.includes("linkedin.com/")) {
      result.linkedin = uri
    } else if (!result.email && lower.startsWith("mailto:")) {
      result.email = uri.slice("mailto:".length).trim()
    } else if (!result.phone && lower.startsWith("tel:")) {
      try {
        result.phone = decodeURIComponent(uri.slice("tel:".length)).trim()
      } catch {
        result.phone = uri.slice("tel:".length).trim()
      }
    } else {
      result.other.push(uri)
    }
  }
  return result
}

/**
 * Build a labeled block to append to extracted text so the structurer (LLM or
 * heuristic) can associate the real URLs with the header fields. Returns an
 * empty string when nothing useful was found.
 */
export function buildLinksBlock(uris: string[]): string {
  const { linkedin, email, phone } = classifyLinks(uris)
  const lines: string[] = []
  if (linkedin) lines.push(`LinkedIn: ${linkedin}`)
  if (email) lines.push(`Email: ${email}`)
  if (phone) lines.push(`Phone: ${phone}`)
  if (lines.length === 0) return ""
  return [
    "[SOURCE LINKS] (use these exact values for the matching header fields)",
    ...lines,
  ].join("\n")
}
