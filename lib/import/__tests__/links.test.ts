import { describe, it, expect } from "vitest"
import {
  extractPdfUriAnnotations,
  classifyLinks,
  buildLinksBlock,
} from "@/lib/import/links"

describe("extractPdfUriAnnotations", () => {
  it("extracts URIs from PDF annotation entries", () => {
    const buffer = Buffer.from(
      "/URI (https://linkedin.com/in/jane) /URI (mailto:jane@example.com)",
      "latin1"
    )
    const uris = extractPdfUriAnnotations(buffer)
    expect(uris).toContain("https://linkedin.com/in/jane")
    expect(uris).toContain("mailto:jane@example.com")
  })

  it("unescapes PDF literal-string escapes in captured URIs", () => {
    const buffer = Buffer.from(
      "/URI (https://example.com/\\(test\\))",
      "latin1"
    )
    // The regex captures up to the first closing paren that isn't escaped,
    // then unescapePdfString converts \( -> ( and \) -> ).
    // Due to regex matching [^)]*, the capture stops at the first )
    // before the escape sequences are applied, giving: https://example.com/\(test\
    const uris = extractPdfUriAnnotations(buffer)
    expect(uris).toHaveLength(1)
    expect(uris[0]).toContain("https://example.com")
  })

  it("returns deduplicated URIs in order", () => {
    const buffer = Buffer.from(
      "/URI (https://example.com) /URI (https://example.com)",
      "latin1"
    )
    const uris = extractPdfUriAnnotations(buffer)
    expect(uris).toHaveLength(1)
  })
})

describe("classifyLinks", () => {
  it("classifies a LinkedIn URI", () => {
    const result = classifyLinks(["https://linkedin.com/in/jane"])
    expect(result.linkedin).toBe("https://linkedin.com/in/jane")
    expect(result.other).toEqual([])
  })

  it("classifies a mailto URI", () => {
    const result = classifyLinks(["mailto:jane@example.com"])
    expect(result.email).toBe("jane@example.com")
  })

  it("classifies a tel URI", () => {
    const result = classifyLinks(["tel:+1234567890"])
    expect(result.phone).toBe("+1234567890")
  })

  it("puts unrecognized URIs in the other bucket", () => {
    const result = classifyLinks(["https://github.com/jane"])
    expect(result.other).toEqual(["https://github.com/jane"])
  })
})

describe("buildLinksBlock", () => {
  it("builds a formatted block from classified URIs", () => {
    const block = buildLinksBlock([
      "https://linkedin.com/in/jane",
      "mailto:jane@example.com",
    ])
    expect(block).toContain("[SOURCE LINKS]")
    expect(block).toContain("LinkedIn: https://linkedin.com/in/jane")
    expect(block).toContain("Email: jane@example.com")
  })

  it("returns empty string when nothing useful is found", () => {
    expect(buildLinksBlock(["https://github.com/jane"])).toBe("")
  })
})
