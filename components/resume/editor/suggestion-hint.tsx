"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { AiIdeaIcon } from "@hugeicons/core-free-icons"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useResumeStore } from "@/lib/resume/store"

/** A static, guideline-based tip shown before any review has run. */
export interface FieldHint {
  message: string
  rationale: string
}

/**
 * Hover hint for a single editable field. Surfaces what to add and why it's
 * strong per the guidelines — so the user fills in their own real figures
 * rather than applying a fabricated value.
 *
 * A review suggestion targeting exactly this `fieldPath` takes precedence; when
 * none exists, the static `fallback` tip is shown so the hint aids users
 * starting from scratch. Renders nothing when neither is available.
 */
export function SuggestionHint({
  fieldPath,
  fallback,
}: {
  fieldPath: string
  fallback?: FieldHint
}) {
  const { review } = useResumeStore()
  const item = review.result?.feedback.find((f) => f.fieldPath === fieldPath)

  const message = item?.message ?? fallback?.message
  const rationale = item?.rationale ?? fallback?.rationale
  if (!message) return null

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Suggestion"
            className="shrink-0 text-primary/70 hover:text-primary"
          >
            <HugeiconsIcon icon={AiIdeaIcon} className="size-3.5" />
          </button>
        }
      />
      <TooltipContent className="max-w-xs">
        <div className="flex flex-col gap-1 text-left">
          <p>{message}</p>
          {item?.suggestedValue && (
            <p className="font-mono opacity-80">Try: {item.suggestedValue}</p>
          )}
          {rationale && <p className="opacity-70">Why: {rationale}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
