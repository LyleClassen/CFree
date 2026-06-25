"use client"

import * as React from "react"
import { pdf } from "@react-pdf/renderer"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon } from "@hugeicons/core-free-icons"

import { ResumeDocument } from "@/components/resume/resume-document"
import { TEMPLATES } from "@/lib/resume/templates"
import { cn } from "@/lib/utils"
import { useResumeContext } from "@/lib/resume/resume-context"
import { useTemplateContext } from "@/lib/resume/template-context"

const DEBOUNCE_MS = 400

/**
 * Live PDF preview. Renders the résumé to a blob via @react-pdf/renderer and
 * shows it floating on the composing stage — the exact same renderer used for
 * export, so the preview is WYSIWYG. Re-renders are debounced.
 */
export function ResumePreview() {
  const { resume, hydrated } = useResumeContext()
  const { template } = useTemplateContext()
  const [url, setUrl] = React.useState<string | null>(null)
  const [rendering, setRendering] = React.useState(false)
  const urlRef = React.useRef<string | null>(null)

  const templateLabel =
    TEMPLATES.find((t) => t.id === template)?.label ?? template

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
    <div className="flex h-full w-full flex-col bg-desk">
      {/* Ruler: the spec strip above the page. */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b bg-card/60 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-mono text-[0.7rem] text-muted-foreground">
          <HugeiconsIcon icon={File01Icon} className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">{templateLabel}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>LETTER · 8.5 × 11 in</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          <span
            className={cn(
              "size-1.5 rounded-full",
              rendering ? "animate-pulse bg-amber-500" : "bg-primary"
            )}
          />
          {rendering ? "Rendering" : "Live"}
        </div>
      </div>

      {/* Stage: the page floats on the desk. */}
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {url ? (
          <div className="mx-auto h-full w-full max-w-[760px] overflow-hidden rounded-sm bg-white shadow-2xl ring-1 ring-black/10">
            <iframe
              title="Résumé preview"
              src={`${url}#toolbar=0&navpanes=0&view=FitH`}
              className="h-full w-full border-0"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Building preview…
          </div>
        )}
      </div>
    </div>
  )
}
