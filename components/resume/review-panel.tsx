"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  Alert02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MANUAL_CHECKLIST } from "@/lib/review/checklist"
import { REVIEW_CATEGORIES } from "@/lib/review/types"
import { useResumeStore } from "@/lib/resume/store"

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}

export function ReviewPanel() {
  const { review, requestReview } = useResumeStore()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Review</h2>
        {review.status !== "unavailable" && (
          <Button
            type="button"
            size="sm"
            onClick={requestReview}
            disabled={review.status === "loading"}
          >
            <HugeiconsIcon icon={AiMagicIcon} data-icon="inline-start" />
            {review.status === "loading"
              ? "Reviewing…"
              : review.status === "ready"
                ? "Re-run review"
                : "Run review"}
          </Button>
        )}
      </div>

      {review.status === "idle" && (
        <p className="text-xs text-muted-foreground">
          Run an AI review to score your resume against the 2026 guidelines and
          get inline suggestions.
        </p>
      )}

      {review.status === "loading" && (
        <p className="text-xs text-muted-foreground">
          Analyzing your resume against the 2026 guidelines…
        </p>
      )}

      {review.status === "error" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-3.5" />
          <span>{review.error}</span>
        </div>
      )}

      {review.status === "ready" && review.result && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-semibold ${scoreColor(review.result.score)}`}
            >
              {review.result.score}
            </span>
            <span className="text-xs text-muted-foreground">/ 100 overall</span>
          </div>
          <div className="space-y-2">
            {REVIEW_CATEGORIES.map(({ key, label }) => {
              const value = review.result!.categories[key]
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{label}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                  <Progress value={value} />
                </div>
              )
            })}
          </div>
          {review.result.feedback.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-xs font-medium">Feedback</h3>
              <ul className="list-disc space-y-0.5 pl-4 text-xs leading-snug text-foreground/80">
                {review.result.feedback.map((f, i) => (
                  <li key={i}>
                    <span className="font-medium capitalize">{f.section}:</span>{" "}
                    {f.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {review.status === "unavailable" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            No OpenRouter API key configured — automated scoring is unavailable.
            Use this manual checklist derived from the 2026 guidelines:
          </p>
          {MANUAL_CHECKLIST.map((group) => (
            <div key={group.category} className="space-y-1">
              <h3 className="text-xs font-medium">{group.category}</h3>
              <ul className="space-y-0.5">
                {group.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs leading-snug text-foreground/80"
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="mt-0.5 size-3 shrink-0 text-muted-foreground"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
