# Resume Builder - MVP Proposal

## What

A web-based resume builder that helps users create ATS-optimized resumes. Users can upload an existing resume (PDF/DOCX) or create one from scratch, get AI-powered feedback against 2026 resume guidelines, choose from professional templates, and export to PDF.

## Why

- Most resume builders don't enforce ATS compatibility — users unknowingly create resumes that get filtered out
- LLM-powered review against established guidelines gives users actionable feedback, not just a template
- Existing tools either focus on templates OR analysis, not both in one workflow

## MVP Scope (v1)

### Core User Flow

1. **Upload or Create** — User uploads a PDF/DOCX resume OR starts from scratch with a form
2. **Parse & Structure** — Uploaded resume is parsed into structured JSON (sections: header, summary, experience, education, skills)
3. **LLM Review** — Resume is sent to OpenRouter LLM with the 2026 guidelines as system prompt; returns a score (0-100) + category breakdown + bullet-point feedback
4. **Edit & Improve** — Split-pane editor: structured form on left, live PDF preview on right. Edits update the preview in real-time. LLM suggestions shown inline.
5. **Pick Template** — User chooses from 3-4 professional single-column templates (if updating after review)
6. **Export PDF** — Resume is rendered via react-pdf and downloaded as `FirstName_LastName_Resume.pdf`

### Features

| Feature | Description |
|---------|-------------|
| Resume upload | PDF + DOCX parsing into structured JSON |
| Resume creation | Form-based entry for each section (header, summary, experience, education, skills) |
| LLM review | Score + category feedback (ATS compatibility, achievement impact, content clarity, format) |
| Structured editor | Edit resume sections with live PDF preview alongside |
| Template selection | 3-4 ATS-safe single-column templates (Professional, Modern, Clean, Executive) |
| PDF export | react-pdf renderer, proper formatting, correct file naming |
| Local storage | All data persisted in browser localStorage (no accounts, no backend DB) |

### What's NOT in v1

- Job description matching / keyword optimization (v2)
- Interactive LLM Q&A / conversational suggestions (v2)
- User accounts / authentication (not planned)
- Cloud storage / syncing (not planned)
- Multiple resume versions (v2)

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Already scaffolded, React Server Components |
| UI | shadcn/ui + Tailwind CSS 4 | Already installed, consistent design system |
| PDF generation | `@react-pdf/renderer` | React-native PDF rendering, good template control |
| Live preview | `@react-pdf/renderer` + iframe/blob URL | Render PDF in real-time alongside editor, same library used for export |
| LLM provider | OpenRouter | User-configurable via env vars, supports multiple models |
| Resume parsing | `mammoth` (DOCX) + `pdf-parse` (PDF) | Mature libraries for document parsing |
| State management | React state + localStorage | No backend needed, simple persistence |
| Language | TypeScript | Type safety for resume data model |

## Data Model (Structured JSON)

```typescript
interface Resume {
  header: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
  }
  summary: string
  experience: Array<{
    company: string
    role: string
    startDate: string
    endDate: string | "Present"
    location: string
    bullets: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    graduationDate: string
    gpa?: string
  }>
  skills: string[]
}
```

## LLM Integration

- **Endpoint**: OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)
- **Config**: `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in `.env.local`
- **Prompt strategy**: System prompt contains the 2026 resume guidelines (`refs/resume_guide_lines_2026.md`). User message contains the structured resume JSON. Response is structured JSON with score + category feedback.
- **Fallback**: If no API key configured, show a "LLM review unavailable" state with manual checklist from guidelines

## Templates

All templates are single-column, ATS-safe, standard fonts only:

1. **Professional** — Clean, traditional, reverse-chronological emphasis
2. **Modern** — Subtle accent colors, slightly more visual hierarchy
3. **Minimal** — Ultra-clean, lots of whitespace, typography-focused
4. **Executive** — Two-page capable, leadership narrative focus

## Environment Variables

```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## Resolved Decisions

- **LLM review**: Async loading state (no caching in v1)
- **Entry point**: Straight to builder, no landing/marketing page
- **Template selection**: After LLM review, only if user chooses to update their resume
