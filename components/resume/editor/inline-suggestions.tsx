"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { AiMagicIcon } from "@hugeicons/core-free-icons"

import { useResumeStore } from "@/lib/resume/store"
import type { FeedbackSection } from "@/lib/review/types"

/**
 * Inline LLM suggestions for a given section. Renders nothing unless a review
 * is available and has feedback for this section.
 */
export function InlineSuggestions({ section }: { section: FeedbackSection }) {
  const { review } = useResumeStore()

  if (review.status !== "ready" || !review.result) return null
  const items = review.result.feedback.filter((f) => f.section === section)
  if (items.length === 0) return null

  return (
    <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-2">
      <div className="mb-1 flex items-center gap-1 text-[0.7rem] font-medium text-primary">
        <HugeiconsIcon icon={AiMagicIcon} className="size-3" />
        Suggestions
      </div>
      <ul className="list-disc space-y-0.5 pl-4 text-[0.72rem] leading-snug text-foreground/80">
        {items.map((item, i) => (
          <li key={i}>{item.message}</li>
        ))}
      </ul>
    </div>
  )
}
