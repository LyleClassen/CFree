// Manual checklist derived from refs/resume_guide_lines_2026.md, shown when no
// OpenRouter API key is configured (the no-key fallback for the review panel).

export interface ChecklistGroup {
  category: string
  items: string[]
}

export const MANUAL_CHECKLIST: ChecklistGroup[] = [
  {
    category: "ATS Compatibility",
    items: [
      "Single-column layout, standard fonts, no tables/graphics/columns.",
      "Standard section headings (Work Experience, Education, Skills).",
      "Contact info in the document body, not a header/footer.",
      "Consistent date formatting throughout (e.g. “June 2022 – Present”).",
    ],
  },
  {
    category: "Achievement Impact",
    items: [
      "Bullets start with a strong verb (Led, Built, Shipped — not “Responsible for”).",
      "≥70% of experience bullets include a measurable outcome (%, $, time, team size).",
      "Each bullet answers “so what?” with a result, not a duty.",
    ],
  },
  {
    category: "Content Clarity",
    items: [
      "Professional summary opens with the target role and one quantified achievement.",
      "No buzzword stuffing or vague responsibilities.",
      "Skills mirror job-description language, grouped logically, with no rating scales.",
    ],
  },
  {
    category: "Professional Format",
    items: [
      "Length appropriate for experience level (1–2 pages max).",
      "Professional email address; clean custom LinkedIn URL.",
      "Zero spelling/grammar errors.",
      "Export as FirstName_LastName_Resume.pdf.",
    ],
  },
]
