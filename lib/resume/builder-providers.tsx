"use client"

import type React from "react"

import { ResumeProvider, useResumeContext } from "@/lib/resume/resume-context"
import { ReviewProvider, useReviewContext } from "@/lib/resume/review-context"
import { FeedbackProvider } from "@/lib/resume/feedback-context"
import { TemplateProvider } from "@/lib/resume/template-context"
import { createLocalStorageAdapter } from "@/lib/resume/storage-adapter"

const adapter = createLocalStorageAdapter()

const configCheck = () =>
  fetch("/api/review").then((r) => r.json() as Promise<{ apiKeyMissing?: boolean }>)

function FeedbackProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { updateResume } = useResumeContext()
  const { review } = useReviewContext()
  return (
    <FeedbackProvider
      updateResume={updateResume}
      feedbackItems={review.result?.feedback}
    >
      {children}
    </FeedbackProvider>
  )
}

export function BuilderProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ResumeProvider storage={adapter.resume}>
      <ReviewProvider configCheck={configCheck}>
        <FeedbackProviderWrapper>
          <TemplateProvider storage={adapter.template}>
            {children}
          </TemplateProvider>
        </FeedbackProviderWrapper>
      </ReviewProvider>
    </ResumeProvider>
  )
}

export { useResumeContext } from "@/lib/resume/resume-context"
export { useReviewContext } from "@/lib/resume/review-context"
export { useFeedbackContext } from "@/lib/resume/feedback-context"
export { useTemplateContext } from "@/lib/resume/template-context"

export type { ReviewStatus } from "@/lib/resume/review-context"
