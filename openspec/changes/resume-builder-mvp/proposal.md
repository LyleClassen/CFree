## Why

Most resume builders force a choice: they either give you templates OR they analyze your content, never both in one workflow — and almost none enforce ATS (Applicant Tracking System) compatibility, so users unknowingly produce resumes that get filtered out before a human ever reads them. An LLM reviewing a resume against established 2026 guidelines turns generic templating into actionable, personalized feedback. This change delivers the v1 MVP of that combined workflow.

## What Changes

- Add a browser-only resume builder app (Next.js App Router) with no backend database and no user accounts — all resume data persists in `localStorage`.
- Users can **upload** an existing resume (PDF/DOCX) which is parsed into a structured JSON model, **or create** one from scratch via a form.
- Add an **LLM review** capability: the structured resume is sent to OpenRouter with the 2026 resume guidelines as the system prompt, returning a 0-100 score, per-category breakdown (ATS compatibility, achievement impact, content clarity, format), and bullet-point feedback.
- Add a **split-pane editor**: structured section forms on the left, a live `@react-pdf/renderer` preview on the right that updates as the user edits, with LLM suggestions shown inline.
- Add **template selection** across 3-4 ATS-safe, single-column templates (Professional, Modern, Minimal, Executive), offered after review if the user chooses to update.
- Add **PDF export** via `@react-pdf/renderer`, downloaded as `FirstName_LastName_Resume.pdf`.
- Graceful fallback: if no OpenRouter API key is configured, show a manual checklist derived from the guidelines instead of an automated score.
- Entry point goes straight to the builder — no landing/marketing page.

Out of scope for v1: job-description keyword matching, conversational LLM Q&A, user accounts/auth, cloud sync, and multiple saved resume versions.

## Capabilities

### New Capabilities
- `resume-data-model`: The canonical structured resume JSON shape (header, summary, experience, education, skills) and its `localStorage` persistence/serialization rules.
- `resume-import`: Uploading and parsing PDF/DOCX files into the structured resume model.
- `resume-editor`: Form-based section editing with a live PDF preview and inline LLM suggestions.
- `llm-review`: Sending the structured resume to OpenRouter, the prompt/response contract, scoring/categories, and the no-API-key fallback.
- `resume-templates`: The set of ATS-safe single-column templates and template selection behavior.
- `pdf-export`: Rendering the chosen template to a downloadable PDF with correct file naming.

### Modified Capabilities
<!-- None — this is a greenfield app with no existing specs. -->

## Impact

- **App routes/UI**: New builder route(s) under `app/`, new components under `components/` (section forms, split-pane layout, template picker, PDF document components).
- **Libraries**: Adds `@react-pdf/renderer`, `mammoth` (DOCX parsing), and `pdf-parse` (PDF parsing). Uses existing shadcn/ui + Tailwind CSS 4.
- **Server/API**: A server route to proxy OpenRouter calls (keeps the API key server-side); reads `refs/resume_guide_lines_2026.md` as the system prompt source.
- **Environment**: New `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in `.env.local`.
- **Persistence**: Browser `localStorage` only — no database, no auth, no migrations.
