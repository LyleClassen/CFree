"use client"

import * as React from "react"

import { emptyResume } from "@/lib/resume/factory"
import type { ResumeStorage } from "@/lib/resume/storage-adapter"
import type { Resume } from "@/lib/resume/types"

interface ResumeContextValue {
  resume: Resume
  hydrated: boolean
  setResume: (resume: Resume) => void
  updateResume: (recipe: (draft: Resume) => void) => void
  resetResume: () => void
}

const ResumeContext = React.createContext<ResumeContextValue | null>(null)

export function ResumeProvider({
  storage,
  children,
}: {
  storage: ResumeStorage
  children: React.ReactNode
}) {
  const [resume, setResumeState] = React.useState<Resume>(emptyResume)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = storage.load()
    if (stored) setResumeState(stored)
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storage])

  React.useEffect(() => {
    if (hydrated) storage.save(resume)
  }, [resume, hydrated, storage])

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

  const resetResume = React.useCallback(() => {
    setResumeState(emptyResume())
  }, [])

  const value = React.useMemo(
    () => ({ resume, hydrated, setResume, updateResume, resetResume }),
    [resume, hydrated, setResume, updateResume, resetResume]
  )

  return (
    <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>
  )
}

export function useResumeContext(): ResumeContextValue {
  const ctx = React.useContext(ResumeContext)
  if (!ctx) {
    throw new Error("useResumeContext must be used within a ResumeProvider")
  }
  return ctx
}
