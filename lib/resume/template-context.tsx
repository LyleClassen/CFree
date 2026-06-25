"use client"

import * as React from "react"

import type { TemplateStorage } from "@/lib/resume/storage-adapter"
import type { TemplateId } from "@/lib/resume/types"

interface TemplateContextValue {
  template: TemplateId
  setTemplate: (template: TemplateId) => void
}

const TemplateContext = React.createContext<TemplateContextValue | null>(null)

export function TemplateProvider({
  storage,
  children,
}: {
  storage: TemplateStorage
  children: React.ReactNode
}) {
  const [template, setTemplateState] = React.useState<TemplateId>(() =>
    storage.load()
  )

  React.useEffect(() => {
    storage.save(template)
  }, [template, storage])

  const setTemplate = React.useCallback((next: TemplateId) => {
    setTemplateState(next)
  }, [])

  const value = React.useMemo(
    () => ({ template, setTemplate }),
    [template, setTemplate]
  )

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  )
}

export function useTemplateContext(): TemplateContextValue {
  const ctx = React.useContext(TemplateContext)
  if (!ctx) {
    throw new Error(
      "useTemplateContext must be used within a TemplateProvider"
    )
  }
  return ctx
}
