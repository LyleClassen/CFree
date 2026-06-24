"use client"

import * as React from "react"

import { emptyResume } from "@/lib/resume/factory"
import {
  DEFAULT_TEMPLATE,
  loadResume,
  loadTemplate,
  saveResume,
  saveTemplate,
} from "@/lib/resume/storage"
import type { Resume, TemplateId } from "@/lib/resume/types"
import type { ReviewResult } from "@/lib/review/types"

export type ReviewStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "unavailable" // no API key configured — show manual checklist

interface ReviewState {
  status: ReviewStatus
  result: ReviewResult | null
  error: string | null
}

interface ResumeStore {
  resume: Resume
  template: TemplateId
  hydrated: boolean
  review: ReviewState

  setResume: (resume: Resume) => void
  updateResume: (recipe: (draft: Resume) => void) => void
  setTemplate: (template: TemplateId) => void
  resetResume: () => void

  requestReview: () => Promise<void>
  clearReview: () => void
}

const ResumeContext = React.createContext<ResumeStore | null>(null)

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resume, setResumeState] = React.useState<Resume>(emptyResume)
  const [template, setTemplateState] =
    React.useState<TemplateId>(DEFAULT_TEMPLATE)
  const [hydrated, setHydrated] = React.useState(false)
  const [review, setReview] = React.useState<ReviewState>({
    status: "idle",
    result: null,
    error: null,
  })

  // Restore from localStorage on mount. Synchronous setState here is the
  // intended hydration pattern (must run client-side, after mount).
  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = loadResume()
    if (stored) setResumeState(stored)
    setTemplateState(loadTemplate())
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Detect whether automated review is available; if not, surface the manual
  // checklist state up front rather than waiting for a failed request.
  React.useEffect(() => {
    let cancelled = false
    fetch("/api/review")
      .then((r) => r.json())
      .then((d: { apiKeyMissing?: boolean }) => {
        if (!cancelled && d.apiKeyMissing) {
          setReview({ status: "unavailable", result: null, error: null })
        }
      })
      .catch(() => {
        // Leave review in its default idle state on a config check failure.
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist resume after hydration.
  React.useEffect(() => {
    if (hydrated) saveResume(resume)
  }, [resume, hydrated])

  React.useEffect(() => {
    if (hydrated) saveTemplate(template)
  }, [template, hydrated])

  const setResume = React.useCallback((next: Resume) => {
    setResumeState(next)
  }, [])

  const updateResume = React.useCallback(
    (recipe: (draft: Resume) => void) => {
      setResumeState((prev) => {
        const draft = structuredClone(prev)
        recipe(draft)
        return draft
      })
    },
    []
  )

  const setTemplate = React.useCallback((next: TemplateId) => {
    setTemplateState(next)
  }, [])

  const resetResume = React.useCallback(() => {
    setResumeState(emptyResume())
    setReview({ status: "idle", result: null, error: null })
  }, [])

  const clearReview = React.useCallback(() => {
    setReview({ status: "idle", result: null, error: null })
  }, [])

  const requestReview = React.useCallback(async () => {
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
        error: data.error ?? "Review unavailable. Please try again.",
      })
    } catch {
      setReview({
        status: "error",
        result: null,
        error: "Review unavailable. Please try again.",
      })
    }
  }, [resume])

  const value = React.useMemo<ResumeStore>(
    () => ({
      resume,
      template,
      hydrated,
      review,
      setResume,
      updateResume,
      setTemplate,
      resetResume,
      requestReview,
      clearReview,
    }),
    [
      resume,
      template,
      hydrated,
      review,
      setResume,
      updateResume,
      setTemplate,
      resetResume,
      requestReview,
      clearReview,
    ]
  )

  return (
    <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>
  )
}

export function useResumeStore(): ResumeStore {
  const ctx = React.useContext(ResumeContext)
  if (!ctx) {
    throw new Error("useResumeStore must be used within a ResumeProvider")
  }
  return ctx
}
