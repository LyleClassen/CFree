"use client"

import dynamic from "next/dynamic"

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
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { BuilderProviders, useResumeContext } from "@/lib/resume/builder-providers"
import { useResetAll } from "@/hooks/use-reset-all"
import type { Resume } from "@/lib/resume/types"

// The preview renders PDFs in the browser — never on the server.
const ResumePreview = dynamic(
  () =>
    import("@/components/resume/resume-preview").then((m) => m.ResumePreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-desk text-xs text-muted-foreground">
        Loading preview…
      </div>
    ),
  }
)

interface SectionDef {
  index: string
  title: string
  hint: string
  filled: (r: Resume) => boolean
  Form: React.ComponentType
}

// Sections are a deliberate sequence — the index doubles as a checklist of the
// document's parts, not decoration.
const SECTIONS: SectionDef[] = [
  {
    index: "01",
    title: "Header",
    hint: "Name & contacts",
    filled: (r) => r.header.fullName.trim().length > 0,
    Form: HeaderForm,
  },
  {
    index: "02",
    title: "Summary",
    hint: "The opening line",
    filled: (r) => r.summary.trim().length > 0,
    Form: SummaryForm,
  },
  {
    index: "03",
    title: "Experience",
    hint: "Roles & impact",
    filled: (r) => r.experience.length > 0,
    Form: ExperienceForm,
  },
  {
    index: "04",
    title: "Education",
    hint: "Degrees & schools",
    filled: (r) => r.education.length > 0,
    Form: EducationForm,
  },
  {
    index: "05",
    title: "Skills",
    hint: "Tools & strengths",
    filled: (r) => r.skills.some((g) => g.items.length > 0),
    Form: SkillsForm,
  },
]

function SectionBlock({
  def,
  filled,
}: {
  def: SectionDef
  filled: boolean
}) {
  const { Form } = def
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <header className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background font-mono text-[0.7rem] font-medium text-muted-foreground">
          {def.index}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold leading-none tracking-tight">
            {def.title}
          </h2>
          <p className="mt-1 truncate text-[0.7rem] text-muted-foreground">
            {def.hint}
          </p>
        </div>
        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-wider",
            filled ? "text-primary" : "text-muted-foreground/60"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              filled ? "bg-primary" : "bg-muted-foreground/30"
            )}
          />
          {filled ? "ready" : "empty"}
        </span>
      </header>
      <div className="p-4">
        <Form />
      </div>
    </section>
  )
}

function DocumentStatus() {
  const { resume } = useResumeContext()
  const done = SECTIONS.filter((s) => s.filled(resume)).length
  const total = SECTIONS.length
  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-xs">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">Document</span>
        <span className="font-mono text-[0.7rem] text-muted-foreground">
          {done}/{total} sections
        </span>
      </div>
      <div className="mt-2 flex gap-1">
        {SECTIONS.map((s) => (
          <span
            key={s.index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s.filled(resume) ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  )
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
        C
      </span>
      <div className="leading-none">
        <div className="font-display text-sm font-bold tracking-tight">
          CFree
        </div>
        <div className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
          Résumé Bench
        </div>
      </div>
    </div>
  )
}

function Toolbar() {
  const resetAll = useResetAll()
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-sm">
      <Wordmark />
      <div className="flex items-center gap-1.5">
        <ImportButton />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      "Start a new blank résumé? This clears the current one."
                    )
                  ) {
                    resetAll()
                  }
                }}
              >
                New
              </Button>
            }
          />
          <TooltipContent>Clear and start blank</TooltipContent>
        </Tooltip>
        <ThemeToggle />
        <div className="mx-1 h-5 w-px bg-border" />
        <ExportButton />
      </div>
    </header>
  )
}

function BuilderInner() {
  const { resume } = useResumeContext()
  return (
    <div className="flex h-svh flex-col">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        {/* Left: the control desk — editor, review, templates. */}
        <div className="w-[460px] shrink-0 overflow-y-auto border-r bg-background">
          <div className="flex flex-col gap-4 p-4">
            <DocumentStatus />

            {SECTIONS.map((def) => (
              <SectionBlock
                key={def.index}
                def={def}
                filled={def.filled(resume)}
              />
            ))}

            <div className="rounded-lg border bg-card p-4 shadow-xs">
              <ReviewPanel />
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-xs">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-sm font-semibold tracking-tight">
                  Template
                </h2>
                <span className="eyebrow">Type set</span>
              </div>
              <TemplatePicker />
            </div>
          </div>
        </div>

        {/* Right: the composing stage. */}
        <div className="min-w-0 flex-1">
          <ResumePreview />
        </div>
      </div>
    </div>
  )
}

export function Builder() {
  return (
    <BuilderProviders>
      <BuilderInner />
    </BuilderProviders>
  )
}
