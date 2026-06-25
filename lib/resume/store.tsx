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
import {
  applyFeedbackToDraft,
  revertPatch,
  type ReversePatch,
} from "@/lib/resume/apply-feedback"
import type { Resume, TemplateId } from "@/lib/resume/types"
import type { FeedbackSection, ReviewResult } from "@/lib/review/types"

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
  /** Reverse patch for each applied feedback item, keyed by its feedback index. */
  appliedFeedback: Record<number, ReversePatch>

  setResume: (resume: Resume) => void
  updateResume: (recipe: (draft: Resume) => void) => void
  setTemplate: (template: TemplateId) => void
  resetResume: () => void

  requestReview: () => Promise<void>
  clearReview: () => void

  applyFeedback: (index: number) => void
  undoFeedback: (index: number) => void
  applyFeedbackSection: (section: FeedbackSection) => void
  undoFeedbackSection: (section: FeedbackSection) => void
  applyAllFeedback: () => void
  undoAllFeedback: () => void
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
  const [appliedFeedback, setAppliedFeedback] = React.useState<
    Record<number, ReversePatch>
  >({})

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
    setAppliedFeedback({})
  }, [])

  const clearReview = React.useCallback(() => {
    setReview({ status: "idle", result: null, error: null })
    setAppliedFeedback({})
  }, [])

  const requestReview = React.useCallback(async () => {
    // A fresh review invalidates applied-state indices from the previous one.
    setAppliedFeedback({})
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

  // Apply the feedback items at `indices`, skipping ones already applied or not
  // auto-applicable. Batched into a single resume update and a single
  // applied-state update.
  const applyIndices = React.useCallback(
    (indices: number[]) => {
      const feedback = review.result?.feedback
      if (!feedback) return
      const patches: Record<number, ReversePatch> = {}
      updateResume((draft) => {
        for (const i of indices) {
          const item = feedback[i]
          if (!item || appliedFeedback[i]) continue
          const patch = applyFeedbackToDraft(draft, item)
          if (patch) patches[i] = patch
        }
      })
      if (Object.keys(patches).length > 0) {
        setAppliedFeedback((prev) => ({ ...prev, ...patches }))
      }
    },
    [review.result, appliedFeedback, updateResume]
  )

  // Undo the applied items at `indices`, reverting in reverse application order
  // so array add/remove patches resolve against consistent indices.
  const undoIndices = React.useCallback(
    (indices: number[]) => {
      const toUndo = indices
        .filter((i) => appliedFeedback[i])
        .sort((a, b) => b - a)
      if (toUndo.length === 0) return
      updateResume((draft) => {
        for (const i of toUndo) revertPatch(draft, appliedFeedback[i])
      })
      setAppliedFeedback((prev) => {
        const next = { ...prev }
        for (const i of toUndo) delete next[i]
        return next
      })
    },
    [appliedFeedback, updateResume]
  )

  const sectionIndices = React.useCallback(
    (section: FeedbackSection) =>
      (review.result?.feedback ?? []).flatMap((f, i) =>
        f.section === section ? [i] : []
      ),
    [review.result]
  )

  const applyFeedback = React.useCallback(
    (index: number) => applyIndices([index]),
    [applyIndices]
  )
  const undoFeedback = React.useCallback(
    (index: number) => undoIndices([index]),
    [undoIndices]
  )
  const applyFeedbackSection = React.useCallback(
    (section: FeedbackSection) => applyIndices(sectionIndices(section)),
    [applyIndices, sectionIndices]
  )
  const undoFeedbackSection = React.useCallback(
    (section: FeedbackSection) => undoIndices(sectionIndices(section)),
    [undoIndices, sectionIndices]
  )
  const allIndices = React.useCallback(
    () => (review.result?.feedback ?? []).map((_, i) => i),
    [review.result]
  )
  const applyAllFeedback = React.useCallback(
    () => applyIndices(allIndices()),
    [applyIndices, allIndices]
  )
  const undoAllFeedback = React.useCallback(
    () => undoIndices(allIndices()),
    [undoIndices, allIndices]
  )

  const value = React.useMemo<ResumeStore>(
    () => ({
      resume,
      template,
      hydrated,
      review,
      appliedFeedback,
      setResume,
      updateResume,
      setTemplate,
      resetResume,
      requestReview,
      clearReview,
      applyFeedback,
      undoFeedback,
      applyFeedbackSection,
      undoFeedbackSection,
      applyAllFeedback,
      undoAllFeedback,
    }),
    [
      resume,
      template,
      hydrated,
      review,
      appliedFeedback,
      setResume,
      updateResume,
      setTemplate,
      resetResume,
      requestReview,
      clearReview,
      applyFeedback,
      undoFeedback,
      applyFeedbackSection,
      undoFeedbackSection,
      applyAllFeedback,
      undoAllFeedback,
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
