"use client"

import * as React from "react"
import { pdf } from "@react-pdf/renderer"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { ResumeDocument } from "@/components/resume/resume-document"
import { Button } from "@/components/ui/button"
import { exportFileName } from "@/lib/resume/export"
import { useResumeContext } from "@/lib/resume/resume-context"
import { useTemplateContext } from "@/lib/resume/template-context"

export function ExportButton() {
  const { resume } = useResumeContext()
  const { template } = useTemplateContext()
  const [exporting, setExporting] = React.useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      // Same renderer as the live preview → WYSIWYG export.
      const blob = await pdf(
        <ResumeDocument resume={resume} template={template} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = exportFileName(resume)
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Export failed. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button type="button" size="sm" disabled={exporting} onClick={handleExport}>
      <HugeiconsIcon icon={Download01Icon} data-icon="inline-start" />
      {exporting ? "Exporting…" : "Export PDF"}
    </Button>
  )
}
