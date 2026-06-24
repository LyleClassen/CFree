import type { TemplateId } from "@/lib/resume/types"

export interface TemplateMeta {
  id: TemplateId
  label: string
  /** Internal codename shown as an eyebrow — gives each template a voice. */
  codename: string
  description: string
  /** Serif body sets the specimen in a serif face. */
  serif: boolean
  /** How section headings are marked, mirrored in the mini specimen. */
  heading: "rule" | "bar" | "plain" | "flanked"
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "professional",
    label: "Professional",
    codename: "Ledger",
    description: "Tracked caps headings ruled across the column.",
    serif: false,
    heading: "rule",
  },
  {
    id: "modern",
    label: "Modern",
    codename: "Aperture",
    description: "Teal accent, marked headings, an underlined name.",
    serif: false,
    heading: "bar",
  },
  {
    id: "minimal",
    label: "Minimal",
    codename: "Quiet",
    description: "Mixed-case headings, no rules, maximum air.",
    serif: false,
    heading: "plain",
  },
  {
    id: "executive",
    label: "Executive",
    codename: "Broadsheet",
    description: "Centered serif name framed by hairlines.",
    serif: true,
    heading: "flanked",
  },
]
