"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

import { useTemplateContext } from "@/lib/resume/template-context"
import { TEMPLATES, type TemplateMeta } from "@/lib/resume/templates"
import { cn } from "@/lib/utils"

// A tiny abstract specimen so the picker reads as four real layouts, not four
// identical labels. Mirrors the heading treatment of each template.
function Specimen({ template }: { template: TemplateMeta }) {
  const center = template.id === "executive"
  return (
    <div
      className={cn(
        "flex h-[58px] flex-col gap-1.5 rounded-sm bg-white p-2 ring-1 ring-black/10",
        center ? "items-center" : "items-start"
      )}
    >
      {/* Name */}
      <div
        className={cn(
          "h-1.5 rounded-full bg-zinc-800",
          template.serif ? "w-12" : "w-10"
        )}
      />
      {/* Heading marker */}
      {template.heading === "rule" && (
        <div className="mt-0.5 h-px w-full bg-zinc-400" />
      )}
      {template.heading === "bar" && (
        <div className="mt-0.5 flex items-center gap-1">
          <div className="size-1.5 bg-primary" />
          <div className="h-1 w-6 rounded-full bg-zinc-300" />
        </div>
      )}
      {template.heading === "plain" && (
        <div className="mt-1 h-1 w-5 rounded-full bg-zinc-300" />
      )}
      {template.heading === "flanked" && (
        <div className="mt-0.5 flex w-full items-center gap-1">
          <div className="h-px flex-1 bg-zinc-300" />
          <div className="h-1 w-4 rounded-full bg-zinc-400" />
          <div className="h-px flex-1 bg-zinc-300" />
        </div>
      )}
      {/* Body lines */}
      <div className="h-1 w-full rounded-full bg-zinc-200" />
      <div
        className={cn(
          "h-1 rounded-full bg-zinc-200",
          center ? "w-3/4" : "w-5/6"
        )}
      />
    </div>
  )
}

export function TemplatePicker() {
  const { template, setTemplate } = useTemplateContext()

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {TEMPLATES.map((t) => {
        const selected = t.id === template
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            aria-pressed={selected}
            className={cn(
              "group relative flex flex-col gap-2 rounded-lg border p-2.5 text-left transition-all",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            {selected && (
              <span className="absolute top-2 right-2 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <HugeiconsIcon icon={Tick02Icon} className="size-2.5" />
              </span>
            )}
            <Specimen template={t} />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-1">
                <span className="font-display text-xs font-semibold tracking-tight">
                  {t.label}
                </span>
                <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                  {t.codename}
                </span>
              </div>
              <span className="text-[0.7rem] leading-snug text-muted-foreground">
                {t.description}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
