"use client"

import * as React from "react"

import {
  applyFeedbackToDraft,
  revertPatch,
  type ReversePatch,
} from "@/lib/resume/apply-feedback"
import type { Resume } from "@/lib/resume/types"
import type { FeedbackItem, FeedbackSection } from "@/lib/review/types"

interface FeedbackContextValue {
  appliedFeedback: Record<number, ReversePatch>
  applyFeedback: (index: number) => void
  undoFeedback: (index: number) => void
  applyFeedbackSection: (section: FeedbackSection) => void
  undoFeedbackSection: (section: FeedbackSection) => void
  applyAllFeedback: () => void
  undoAllFeedback: () => void
}

const FeedbackContext = React.createContext<FeedbackContextValue | null>(null)

export function FeedbackProvider({
  updateResume,
  feedbackItems,
  children,
}: {
  updateResume: (recipe: (draft: Resume) => void) => void
  feedbackItems: FeedbackItem[] | undefined
  children: React.ReactNode
}) {
  const [appliedFeedback, setAppliedFeedback] = React.useState<
    Record<number, ReversePatch>
  >({})

  const applyIndices = React.useCallback(
    (indices: number[]) => {
      if (!feedbackItems) return
      const patches: Record<number, ReversePatch> = {}
      updateResume((draft) => {
        for (const i of indices) {
          const item = feedbackItems[i]
          if (!item || appliedFeedback[i]) continue
          const patch = applyFeedbackToDraft(draft, item)
          if (patch) patches[i] = patch
        }
      })
      if (Object.keys(patches).length > 0) {
        setAppliedFeedback((prev) => ({ ...prev, ...patches }))
      }
    },
    [feedbackItems, appliedFeedback, updateResume]
  )

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
      (feedbackItems ?? []).flatMap((f, i) =>
        f.section === section ? [i] : []
      ),
    [feedbackItems]
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
    () => (feedbackItems ?? []).map((_, i) => i),
    [feedbackItems]
  )
  const applyAllFeedback = React.useCallback(
    () => applyIndices(allIndices()),
    [applyIndices, allIndices]
  )
  const undoAllFeedback = React.useCallback(
    () => undoIndices(allIndices()),
    [undoIndices, allIndices]
  )

  const value = React.useMemo(
    () => ({
      appliedFeedback,
      applyFeedback,
      undoFeedback,
      applyFeedbackSection,
      undoFeedbackSection,
      applyAllFeedback,
      undoAllFeedback,
    }),
    [
      appliedFeedback,
      applyFeedback,
      undoFeedback,
      applyFeedbackSection,
      undoFeedbackSection,
      applyAllFeedback,
      undoAllFeedback,
    ]
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedbackContext(): FeedbackContextValue {
  const ctx = React.useContext(FeedbackContext)
  if (!ctx) {
    throw new Error(
      "useFeedbackContext must be used within a FeedbackProvider"
    )
  }
  return ctx
}
