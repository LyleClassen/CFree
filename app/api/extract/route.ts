import { NextResponse } from "next/server"

// Minimum native-text length below which a PDF is treated as image-based and
// the client is told to run the OCR fallback.
const TEXT_THRESHOLD = 80

export interface ExtractResponse {
  ok: boolean
  text?: string
  /** True when a PDF yielded below-threshold native text (run OCR client-side). */
  imageBased?: boolean
  error?: string
}

export async function POST(
  request: Request
): Promise<NextResponse<ExtractResponse>> {
  let file: File | null = null
  try {
    const form = await request.formData()
    const value = form.get("file")
    if (value instanceof File) file = value
  } catch {
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

  try {
    if (isDocx) {
      const mammoth = (await import("mammoth")).default
      const { value } = await mammoth.extractRawText({ buffer })
      return NextResponse.json({ ok: true, text: value.trim() })
    }

    // PDF: attempt native text extraction.
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
        return NextResponse.json({ ok: true, text: "", imageBased: true })
      }
      return NextResponse.json({ ok: true, text })
    } finally {
      await parser.destroy()
    }
  } catch {
    // Native extraction failed entirely; for PDFs, fall back to OCR.
    if (isPdf) {
      return NextResponse.json({ ok: true, text: "", imageBased: true })
    }
    return NextResponse.json(
      { ok: false, error: "Could not read the uploaded file." },
      { status: 500 }
    )
  }
}
