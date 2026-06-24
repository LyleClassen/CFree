## 1. Setup & Dependencies

- [x] 1.1 Read the relevant Next.js 16 guides under `node_modules/next/dist/docs/` for App Router routes/route handlers before writing any route or server code
- [x] 1.2 Add dependencies: `@react-pdf/renderer`, `mammoth`, `pdf-parse`, plus `pdfjs-dist` + `tesseract.js` for the OCR fallback (load `tesseract.js` lazily)
- [x] 1.3 Add `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` to `.env.local` and document them in the README; default model `openai/gpt-4o-mini`
- [x] 1.4 Add any needed shadcn/ui components (e.g. `npx shadcn@latest add ...`) used by the editor and template picker

## 2. Resume Data Model & Persistence (capability: resume-data-model)

- [x] 2.1 Define the canonical `Resume` TypeScript interface (header, summary, experience, education, skills) in `lib/`
- [x] 2.2 Provide an empty-resume factory conforming to the model for fresh starts
- [x] 2.3 Implement `localStorage` load/save with serialize/deserialize and restore-on-mount
- [x] 2.4 Wire a top-level resume state/store the editor, preview, review, and export all read from

## 3. Resume Import (capability: resume-import)

- [x] 3.1 Build the upload UI accepting `.pdf` and `.docx`, rejecting other types with a clear message
- [x] 3.2 Extract DOCX text with `mammoth`; for PDF, attempt native text extraction with `pdf-parse`
- [x] 3.3 Detect text-vs-image PDFs: if native extraction is below a minimum-length threshold, classify as image-based and branch to the OCR path
- [x] 3.4 Implement the OCR fallback: rasterize pages with `pdfjs-dist`, OCR with lazily-loaded `tesseract.js`, surfacing a progress/loading state
- [x] 3.5 Map extracted text into the `Resume` model (LLM-assisted structuring when configured; heuristic fallback otherwise), delegating OCR-noise cleanup to the LLM where possible
- [x] 3.6 Handle the empty-extraction case (native + OCR both yield no text): inform the user and offer a blank-resume start instead of failing silently
- [x] 3.7 After import, populate the editor as a correctable draft and route the user into the editor without blocking on parse quality

## 4. PDF Templates & Renderer (capability: resume-templates, pdf-export)

- [x] 4.1 Create a `@react-pdf/renderer` document component that renders the `Resume` model
- [x] 4.2 Implement the Professional, Modern, Minimal, and Executive single-column templates with standard fonts only
- [x] 4.3 Build the template picker UI and wire template selection into state (re-render without altering content)

## 5. Split-Pane Editor & Live Preview (capability: resume-editor)

- [x] 5.1 Build the split-pane layout (section forms left, live PDF preview right)
- [x] 5.2 Implement section form editors with add/edit/reorder/remove for repeatable entries (experience, education, bullets, skills); support `endDate = "Present"`
- [x] 5.3 Wire the live preview to re-render from state, debounced on edits
- [x] 5.4 Render inline LLM suggestions near the relevant sections when a review is available; show nothing when unavailable

## 6. LLM Review (capability: llm-review)

- [x] 6.1 Create the server route that proxies OpenRouter, injecting `refs/resume_guide_lines_2026.md` as the system prompt and the resume JSON as the user message
- [x] 6.2 Request and validate/normalize a structured response (0-100 score, four category scores, feedback items); on malformed output return a graceful "review unavailable" state
- [x] 6.3 Build the client review trigger with an async loading state (no caching)
- [x] 6.4 Implement the no-API-key fallback: a guidelines-derived manual checklist, keeping all other features usable

## 7. Export Flow (capability: pdf-export)

- [x] 7.1 Implement on-demand PDF export using the selected template (WYSIWYG with the preview)
- [x] 7.2 Name the download `FirstName_LastName_Resume.pdf` from the header full name, with a sensible default when the name is missing

## 8. Wire-up & Verification

- [x] 8.1 Set the app entry point to go straight into the builder (no landing page)
- [x] 8.2 Connect the end-to-end flow: import/create → review → edit with live preview → pick template → export
- [x] 8.3 Run `bun run typecheck` and `bun run lint`; fix issues
- [x] 8.4 Manually verify each capability's primary scenarios (import PDF & DOCX, edit with live preview, review with and without API key, switch templates, export with correct file name)
