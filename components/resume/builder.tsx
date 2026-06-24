"use client"

import dynamic from "next/dynamic"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon } from "@hugeicons/core-free-icons"

import { ExportButton } from "@/components/resume/export-button"
import { ImportButton } from "@/components/resume/import-button"
import { ReviewPanel } from "@/components/resume/review-panel"
import { TemplatePicker } from "@/components/resume/template-picker"
import {
  EducationForm,
  ExperienceForm,
  HeaderForm,
  SkillsForm,
  SummaryForm,
} from "@/components/resume/editor/section-forms"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ResumeProvider, useResumeStore } from "@/lib/resume/store"

// The preview renders PDFs in the browser — never on the server.
const ResumePreview = dynamic(
  () =>
    import("@/components/resume/resume-preview").then((m) => m.ResumePreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Loading preview…
      </div>
    ),
  }
)

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Toolbar() {
  const { resetResume } = useResumeStore()
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <HugeiconsIcon icon={File01Icon} className="size-4 text-primary" />
        Resume Builder
      </div>
      <div className="flex items-center gap-2">
        <ImportButton />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (
              window.confirm("Start a new blank resume? This clears the current one.")
            ) {
              resetResume()
            }
          }}
        >
          New
        </Button>
        <ExportButton />
      </div>
    </header>
  )
}

function BuilderInner() {
  return (
    <div className="flex h-svh flex-col">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        {/* Left: editor + review + templates */}
        <div className="w-[480px] shrink-0 overflow-y-auto border-r">
          <div className="space-y-4 p-4">
            <SectionCard title="Header">
              <HeaderForm />
            </SectionCard>
            <SectionCard title="Summary">
              <SummaryForm />
            </SectionCard>
            <SectionCard title="Experience">
              <ExperienceForm />
            </SectionCard>
            <SectionCard title="Education">
              <EducationForm />
            </SectionCard>
            <SectionCard title="Skills">
              <SkillsForm />
            </SectionCard>

            <Separator />

            <Card>
              <CardContent className="pt-0">
                <ReviewPanel />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplatePicker />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="min-w-0 flex-1">
          <ResumePreview />
        </div>
      </div>
    </div>
  )
}

export function Builder() {
  return (
    <ResumeProvider>
      <BuilderInner />
    </ResumeProvider>
  )
}
