"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  Alert02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { MANUAL_CHECKLIST } from "@/lib/review/checklist"
import { REVIEW_CATEGORIES } from "@/lib/review/types"
import { useResumeStore } from "@/lib/resume/store"

function scoreTone(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}

function scoreBand(score: number): string {
  if (score >= 80) return "Strong"
  if (score >= 60) return "Workable"
  return "Needs work"
}

export function ReviewPanel() {
  const { review, requestReview } = useResumeStore()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-sm font-semibold tracking-tight">
            Review
          </h2>
          <span className="eyebrow">2026 guidelines</span>
        </div>
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
                ? "Re-run"
                : "Run review"}
          </Button>
        )}
      </div>

      {review.status === "idle" && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Score your résumé against the 2026 guidelines and get inline
          suggestions on each section.
        </p>
      )}

      {review.status === "loading" && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 animate-pulse rounded-full bg-muted"
              style={{ width: `${90 - i * 18}%` }}
            />
          ))}
        </div>
      )}

      {review.status === "error" && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert02Icon} />
          <AlertTitle>Review failed</AlertTitle>
          <AlertDescription>{review.error}</AlertDescription>
        </Alert>
      )}

      {review.status === "ready" && review.result && (
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between rounded-lg border bg-muted/30 px-4 py-3">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-display text-4xl font-bold leading-none",
                  scoreTone(review.result.score)
                )}
              >
                {review.result.score}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                /100
              </span>
            </div>
            <span
              className={cn(
                "font-mono text-[0.65rem] uppercase tracking-wider",
                scoreTone(review.result.score)
              )}
            >
              {scoreBand(review.result.score)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {REVIEW_CATEGORIES.map(({ key, label }) => {
              const value = review.result!.categories[key]
              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{label}</span>
                    <span className="font-mono text-muted-foreground">
                      {value}
                    </span>
                  </div>
                  <Progress value={value} />
                </div>
              )
            })}
          </div>

          {review.result.feedback.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow">Feedback</span>
              <ul className="flex flex-col gap-1 text-xs leading-snug text-foreground/80">
                {review.result.feedback.map((f, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
                    <span>
                      <span className="font-medium capitalize">
                        {f.section}:
                      </span>{" "}
                      {f.message}
                      {f.suggestedValue && (
                        <span className="mt-0.5 block rounded bg-muted px-1.5 py-0.5 font-mono text-[0.68rem] text-muted-foreground">
                          Suggested: {f.suggestedValue}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {review.status === "unavailable" && (
        <div className="flex flex-col gap-3">
          <Alert>
            <HugeiconsIcon icon={Alert02Icon} />
            <AlertTitle>Manual mode</AlertTitle>
            <AlertDescription>
              No OpenRouter API key configured — use this checklist from the 2026
              guidelines.
            </AlertDescription>
          </Alert>
          {MANUAL_CHECKLIST.map((group) => (
            <div key={group.category} className="flex flex-col gap-1">
              <span className="eyebrow">{group.category}</span>
              <ul className="flex flex-col gap-1">
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
