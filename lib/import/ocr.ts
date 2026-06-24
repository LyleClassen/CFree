// Client-side OCR fallback for image-based PDFs. Both pdfjs-dist and
// tesseract.js are imported lazily so the heavy WASM/worker payload only loads
// when a scanned PDF is actually encountered.

export interface OcrProgress {
  /** 1-based current page. */
  page: number
  totalPages: number
  /** 0-1 recognition progress for the current page. */
  fraction: number
}

const OCR_SCALE = 2

export async function ocrPdf(
  file: File,
  onProgress?: (p: OcrProgress) => void
): Promise<string> {
  const [{ getDocument, GlobalWorkerOptions }, Tesseract] = await Promise.all([
    import("pdfjs-dist"),
    import("tesseract.js"),
  ])

  // Point pdf.js at its bundled worker (resolved by the bundler).
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()

  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = getDocument({ data })
  const pdf = await loadingTask.promise

  const pageTexts: string[] = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: OCR_SCALE })

    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")
    if (!ctx) continue

    await page.render({ canvas, canvasContext: ctx, viewport }).promise

    const {
      data: { text },
    } = await Tesseract.recognize(canvas, "eng", {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text") {
          onProgress?.({
            page: pageNum,
            totalPages: pdf.numPages,
            fraction: m.progress,
          })
        }
      },
    })

    pageTexts.push(text)
    canvas.width = 0
    canvas.height = 0
  }

  await loadingTask.destroy()
  return pageTexts.join("\n\n").trim()
}
