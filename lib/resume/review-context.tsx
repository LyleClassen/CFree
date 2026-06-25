"use client"

import * as React from "react"

import type { ReviewResult } from "@/lib/review/types"

export type ReviewStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "unavailable"

interface ReviewState {
  status: ReviewStatus
  result: ReviewResult | null
  error: string | null
}

interface ReviewContextValue {
  review: ReviewState
  requestReview: (resume: unknown) => Promise<void>
  clearReview: () => void
}

const ReviewContext = React.createContext<ReviewContextValue | null>(null)

export function ReviewProvider({
  configCheck,
  children,
}: {
  configCheck: () => Promise<{ apiKeyMissing?: boolean }>
  children: React.ReactNode
}) {
  const [review, setReview] = React.useState<ReviewState>({
    status: "idle",
    result: null,
    error: null,
  })

  React.useEffect(() => {
    let cancelled = false
    configCheck()
      .then((d) => {
        if (!cancelled && d.apiKeyMissing) {
          setReview({ status: "unavailable", result: null, error: null })
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [configCheck])

  const requestReview = React.useCallback(async (resume: unknown) => {
    setReview({ status: "loading", result: null, error: null })
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      })
      const data = (await res.json()) as {
        ok: boolean
        review?: ReviewResult
        apiKeyMissing?: boolean
        error?: string
      }

      if (data.apiKeyMissing) {
        setReview({ status: "unavailable", result: null, error: null })
        return
      }
      if (data.ok && data.review) {
        setReview({ status: "ready", result: data.review, error: null })
        return
      }
      setReview({
        status: "error",
        result: null,
        error:
          data.error ?? "Review unavailable. Please try again.",
      })
    } catch {
      setReview({
        status: "error",
        result: null,
        error: "Review unavailable. Please try again.",
      })
    }
  }, [])

  const clearReview = React.useCallback(() => {
    setReview({ status: "idle", result: null, error: null })
  }, [])

  const value = React.useMemo(
    () => ({ review, requestReview, clearReview }),
    [review, requestReview, clearReview]
  )

  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  )
}

export function useReviewContext(): ReviewContextValue {
  const ctx = React.useContext(ReviewContext)
  if (!ctx) {
    throw new Error("useReviewContext must be used within a ReviewProvider")
  }
  return ctx
}
