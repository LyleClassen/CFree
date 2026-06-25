"use client"

import { useCallback } from "react"
import { useResumeContext } from "@/lib/resume/resume-context"
import { useReviewContext } from "@/lib/resume/review-context"
import { useFeedbackContext } from "@/lib/resume/feedback-context"

export function useResetAll() {
  const { resetResume } = useResumeContext()
  const { clearReview } = useReviewContext()
  const { undoAllFeedback } = useFeedbackContext()

  return useCallback(() => {
    resetResume()
    clearReview()
    undoAllFeedback()
  }, [resetResume, clearReview, undoAllFeedback])
}
