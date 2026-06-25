// Exports the shared action taxonomy and re-exports the canonical editable-path
// functions from the consolidated definitions module.

import type { FeedbackAction } from "@/lib/review/types"
import { isEditableFieldPath } from "@/lib/resume/editable-paths"

export const FEEDBACK_ACTIONS: FeedbackAction[] = [
  "replace",
  "add",
  "remove",
  "advice",
]

export { isEditableFieldPath }
