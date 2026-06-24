"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

import { useResumeStore } from "@/lib/resume/store"
import { TEMPLATES } from "@/lib/resume/templates"
import { cn } from "@/lib/utils"

export function TemplatePicker() {
  const { template, setTemplate } = useResumeStore()

  return (
    <div className="grid grid-cols-2 gap-2">
      {TEMPLATES.map((t) => {
        const selected = t.id === template
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            aria-pressed={selected}
            className={cn(
              "group relative flex flex-col gap-1 rounded-md border p-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50"
            )}
          >
            {selected && (
              <span className="absolute top-2 right-2 text-primary">
                <HugeiconsIcon icon={Tick02Icon} className="size-4" />
              </span>
            )}
            <span className="text-xs font-medium">{t.label}</span>
            <span className="text-[0.7rem] leading-snug text-muted-foreground">
              {t.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
