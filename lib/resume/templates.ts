import type { TemplateId } from "@/lib/resume/types"

export interface TemplateMeta {
  id: TemplateId
  label: string
  description: string
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "professional",
    label: "Professional",
    description: "Classic sans-serif with ruled section headings.",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Clean sans-serif with a blue accent, no rules.",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Understated, mixed-case headings, maximum whitespace.",
  },
  {
    id: "executive",
    label: "Executive",
    description: "Serif typeface with a centered header.",
  },
]
