import { NextResponse } from "next/server"

import {
  extractDocxHyperlinks,
  extractPdfUriAnnotations,
} from "@/lib/import/links"

// Minimum native-text length below which a PDF is treated as image-based and
// the client is told to run the OCR fallback.
const TEXT_THRESHOLD = 80

export interface ExtractResponse {
  ok: boolean
  text?: string
  /** True when a PDF yielded below-threshold native text (run OCR client-side). */
  imageBased?: boolean
  /** Which path produced the text: "sidecar" | "native" | "" (debugging). */
  engine?: string
  /**
   * Hyperlink targets harvested from the file's annotations/relationships
   * (LinkedIn, mailto:, tel:, …). Native text extraction drops these, so the
   * client appends them to the text before structuring.
   */
  links?: string[]
  error?: string
}

interface SidecarResponse {
  ok: boolean
  text?: string
  engine?: string
}

// Forward a PDF to the Python OCR sidecar (DocTR + PaddleOCR, layout-aware).
// Returns null on any failure so callers can fall back to native extraction.
async function trySidecar(
  buffer: Buffer,
  filename: string
): Promise<{ text: string; engine: string } | null> {
  const base = process.env.OCR_SIDECAR_URL?.trim()
  if (!base) return null
  try {
    const form = new FormData()
    form.append("file", new Blob([new Uint8Array(buffer)]), filename)
    const res = await fetch(`${base.replace(/\/$/, "")}/ocr`, {
      method: "POST",
      body: form,
      // The sidecar may need to load OCR models on the first scanned page.
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as SidecarResponse
    const text = (data.text ?? "").trim()
    if (!data.ok || !text) return null
    return { text, engine: data.engine || "sidecar" }
  } catch (e) {
    console.error("Extract: OCR sidecar request failed:", e)
    return null
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<ExtractResponse>> {
  let file: File | null = null
  try {
    const form = await request.formData()
    const value = form.get("file")
    if (value instanceof File) file = value
  } catch (e) {
    console.error("Extract: failed to parse multipart form data:", e)
    file = null
  }

  if (!file) {
    return NextResponse.json(
      { ok: false, error: "No file uploaded." },
      { status: 400 }
    )
  }

  const name = file.name.toLowerCase()
  const isDocx =
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf"

  if (!isDocx && !isPdf) {
    return NextResponse.json(
      { ok: false, error: "Only PDF and DOCX files are supported." },
      { status: 415 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Hyperlinks (LinkedIn, mailto:, tel:, …) are stored as annotations and are
  // lost by native text extraction, so harvest them up front from the raw
  // buffer and return them on every path — the client appends them to the text
  // before structuring. For DOCX they live in relationships (recovered below).
  const links = isPdf ? extractPdfUriAnnotations(buffer) : []

  try {
    if (isDocx) {
      const mammoth = (await import("mammoth")).default
      const { value } = await mammoth.extractRawText({ buffer })
      const docxLinks = await extractDocxHyperlinks(buffer)
      return NextResponse.json({
        ok: true,
        text: value.trim(),
        links: docxLinks,
      })
    }

    // PDF: prefer the layout-aware OCR sidecar when configured. It reconstructs
    // columns/reading order, which native extraction flattens (and which causes
    // sidebar skills to bleed into the main column's experience).
    const sidecar = await trySidecar(buffer, file.name)
    if (sidecar) {
      return NextResponse.json({
        ok: true,
        text: sidecar.text,
        engine: sidecar.engine,
        links,
      })
    }

    // Fallback: native text extraction.
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    try {
      const result = await parser.getText()
      // pdf-parse interleaves page markers like "-- 1 of 3 --"; drop them.
      const text = (result.text ?? "")
        .replace(/^\s*-+\s*\d+\s+of\s+\d+\s*-+\s*$/gim, "")
        .trim()
      if (text.length < TEXT_THRESHOLD) {
        // Likely a scanned/image-based PDF — let the client run OCR.
        return NextResponse.json({
          ok: true,
          text: "",
          imageBased: true,
          links,
        })
      }
      return NextResponse.json({ ok: true, text, engine: "native", links })
    } finally {
      await parser.destroy()
    }
  } catch (e) {
    console.error("Extract: text extraction failed:", e)
    // Native extraction failed entirely; for PDFs, fall back to OCR.
    if (isPdf) {
      return NextResponse.json({ ok: true, text: "", imageBased: true, links })
    }
    return NextResponse.json(
      { ok: false, error: "Could not read the uploaded file." },
      { status: 500 }
    )
  }
}
