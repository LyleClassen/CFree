"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { ExtractResponse } from "@/app/api/extract/route"
import type { StructureResponse } from "@/app/api/structure/route"
import { ocrPdf } from "@/lib/import/ocr"
import { useResumeStore } from "@/lib/resume/store"

const ACCEPT = ".pdf,.docx"

export function ImportButton() {
  const { setResume, clearReview } = useResumeStore()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const busy = status !== null

  async function handleFile(file: File) {
    const name = file.name.toLowerCase()
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      toast.error("Only PDF and DOCX files are supported.")
      return
    }

    try {
      setStatus("Reading file…")
      const form = new FormData()
      form.append("file", file)
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        body: form,
      })
      const extract = (await extractRes.json()) as ExtractResponse
      if (!extract.ok) {
        toast.error(extract.error ?? "Could not read the file.")
        return
      }

      let text = extract.text ?? ""

      if (extract.imageBased) {
        setStatus("Scanned PDF detected — running OCR…")
        text = await ocrPdf(file, (p) => {
          setStatus(
            `Running OCR — page ${p.page}/${p.totalPages} (${Math.round(
              p.fraction * 100
            )}%)…`
          )
        })
      }

      if (!text.trim()) {
        // Empty extraction after native + OCR: offer a blank start.
        const blank = window.confirm(
          "We couldn't extract any text from this file. Start from a blank resume instead?"
        )
        if (blank) {
          clearReview()
          toast.info("Started a blank resume.")
        }
        return
      }

      setStatus("Structuring content…")
      const structureRes = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const structure = (await structureRes.json()) as StructureResponse
      if (!structure.ok || !structure.resume) {
        toast.error(structure.error ?? "Could not structure the resume.")
        return
      }

      setResume(structure.resume)
      clearReview()
      window.scrollTo({ top: 0 })
      toast.success("Imported. Review and correct the details below.")
    } catch {
      toast.error("Import failed. Please try again.")
    } finally {
      setStatus(null)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Reset so selecting the same file again re-triggers onChange.
          e.target.value = ""
          if (file) void handleFile(file)
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" />
        {busy ? status : "Import PDF / DOCX"}
      </Button>
    </>
  )
}
