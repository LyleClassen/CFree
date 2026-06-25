"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  Tick02Icon,
  TickDouble01Icon,
  Undo02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { isApplicableFeedback } from "@/lib/resume/apply-feedback"
import { useReviewContext } from "@/lib/resume/review-context"
import { useFeedbackContext } from "@/lib/resume/feedback-context"
import type { FeedbackSection } from "@/lib/review/types"

/**
 * Inline LLM suggestions for a given section, with per-item and section-level
 * Apply/Undo controls. Renders nothing unless a review is available and has
 * feedback for this section.
 */
export function InlineSuggestions({ section }: { section: FeedbackSection }) {
  const { review } = useReviewContext()
  const {
    appliedFeedback,
    applyFeedback,
    undoFeedback,
    applyFeedbackSection,
    undoFeedbackSection,
  } = useFeedbackContext()

  if (review.status !== "ready" || !review.result) return null

  // Keep each item's original feedback index so apply/undo target the right one.
  const items = review.result.feedback
    .map((f, index) => ({ f, index }))
    .filter(({ f }) => f.section === section)
  if (items.length === 0) return null

  const applicable = items.filter(({ f }) => isApplicableFeedback(f))
  const appliedCount = applicable.filter(
    ({ index }) => appliedFeedback[index]
  ).length

  return (
    <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[0.7rem] font-medium text-primary">
          <HugeiconsIcon icon={AiMagicIcon} className="size-3" />
          Suggestions
        </div>
        {applicable.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[0.7rem]"
            onClick={() =>
              appliedCount > 0
                ? undoFeedbackSection(section)
                : applyFeedbackSection(section)
            }
          >
            <HugeiconsIcon
              icon={appliedCount > 0 ? Undo02Icon : Tick02Icon}
              data-icon="inline-start"
            />
            {appliedCount > 0 ? "Undo section" : `Apply all (${applicable.length})`}
          </Button>
        )}
      </div>
      <ul className="space-y-1.5 text-[0.72rem] leading-snug text-foreground/80">
        {items.map(({ f, index }) => {
          const canApply = isApplicableFeedback(f)
          const applied = Boolean(appliedFeedback[index])
          return (
            <li
              key={index}
              className="flex items-start justify-between gap-2 border-b border-primary/10 pb-1.5 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {applied && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-emerald-500/15 px-1 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      <HugeiconsIcon
                        icon={TickDouble01Icon}
                        className="size-2.5"
                      />
                      Applied
                    </span>
                  )}
                  <span>{f.message}</span>
                </div>
                {f.suggestedValue && (
                  <span className="mt-0.5 block rounded bg-background/60 px-1.5 py-0.5 font-mono text-[0.68rem] text-foreground/70">
                    Suggested: {f.suggestedValue}
                  </span>
                )}
              </div>
              {canApply && (
                <Button
                  type="button"
                  variant={applied ? "ghost" : "outline"}
                  size="sm"
                  className="h-6 shrink-0 px-1.5 text-[0.7rem]"
                  onClick={() =>
                    applied ? undoFeedback(index) : applyFeedback(index)
                  }
                >
                  <HugeiconsIcon
                    icon={applied ? Undo02Icon : Tick02Icon}
                    data-icon="inline-start"
                  />
                  {applied ? "Undo" : "Apply"}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
