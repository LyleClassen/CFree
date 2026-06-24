"use client"

import * as React from "react"
import { pdf } from "@react-pdf/renderer"

import { ResumeDocument } from "@/components/resume/resume-document"
import { useResumeStore } from "@/lib/resume/store"

const DEBOUNCE_MS = 400

/**
 * Live PDF preview. Renders the resume to a blob via @react-pdf/renderer and
 * shows it in an iframe — the exact same renderer used for export, so the
 * preview is WYSIWYG. Re-renders are debounced so typing stays responsive.
 */
export function ResumePreview() {
  const { resume, template, hydrated } = useResumeStore()
  const [url, setUrl] = React.useState<string | null>(null)
  const [rendering, setRendering] = React.useState(false)
  const urlRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setRendering(true)
      try {
        const blob = await pdf(
          <ResumeDocument resume={resume} template={template} />
        ).toBlob()
        if (cancelled) return
        const nextUrl = URL.createObjectURL(blob)
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = nextUrl
        setUrl(nextUrl)
      } catch {
        // Keep the previous preview on a transient render error.
      } finally {
        if (!cancelled) setRendering(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [resume, template, hydrated])

  // Revoke the last URL on unmount.
  React.useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  return (
    <div className="relative h-full w-full bg-muted/30">
      {url ? (
        <iframe
          title="Resume preview"
          src={`${url}#toolbar=0&navpanes=0`}
          className="h-full w-full border-0"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          Building preview…
        </div>
      )}
      {rendering && url && (
        <div className="absolute top-2 right-2 rounded-md bg-background/80 px-2 py-1 text-[0.7rem] text-muted-foreground shadow-sm">
          Updating…
        </div>
      )}
    </div>
  )
}
