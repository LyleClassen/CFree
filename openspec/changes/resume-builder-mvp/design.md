## Context

This is a greenfield app on a freshly scaffolded Next.js 16 (App Router) + React 19 + shadcn/ui + Tailwind CSS 4 template. There is no existing backend, database, or auth — and v1 deliberately keeps it that way: all state lives in the browser. The single piece of server-side logic is an OpenRouter proxy, needed only to keep the API key off the client.

Constraints worth calling out:
- **Next.js 16 is not the Next.js in training data.** Per `AGENTS.md`, APIs/conventions/file structure may differ; the relevant guide under `node_modules/next/dist/docs/` must be read before writing route/server code.
- `@react-pdf/renderer` does the double duty of live preview *and* export, so its capabilities bound what the templates can express.
- PDF/DOCX parsing is inherently lossy; parsed output is a starting point the user corrects, not ground truth.
- The 2026 guidelines (`refs/resume_guide_lines_2026.md`) are the single source of truth for both the LLM system prompt and the no-key manual checklist.

## Goals / Non-Goals

**Goals:**
- One uninterrupted flow: import or create → review → edit with live preview → pick template → export.
- Enforce ATS-safe output by construction (single-column templates, standard fonts).
- Keep the API key server-side; the client never sees it.
- Degrade gracefully when no LLM is configured.
- Zero backend persistence — `localStorage` only, no accounts.

**Non-Goals:**
- Job-description keyword matching, conversational LLM Q&A, accounts/auth, cloud sync, multiple saved versions (all deferred to v2 or unplanned).
- LLM response caching (v1 does a fresh async call each review).
- A landing/marketing page (entry goes straight to the builder).

## Decisions

**Single PDF library for preview and export (`@react-pdf/renderer`).** Using the same renderer for the live right-pane preview and the downloaded file guarantees WYSIWYG — what the user sees is exactly what exports. Alternative considered: HTML/CSS preview + a separate export path (e.g. Puppeteer/print). Rejected because it doubles the styling surface and invites preview-vs-export drift, and a headless browser is backend weight v1 explicitly avoids. Trade-off: `@react-pdf/renderer` uses its own flexbox-ish layout primitives (not DOM/CSS), so templates are authored against its component API.

**LLM calls go through a server route, not the browser.** A Next.js route handler proxies OpenRouter so `OPENROUTER_API_KEY` stays server-side. The client posts structured resume JSON; the server injects the guidelines system prompt and returns the parsed review. Alternative: call OpenRouter directly from the client with a public key — rejected, it leaks the key. This is the *only* server-side component in v1.

**Structured JSON as the single canonical model.** Every stage (import, edit, review, render) reads/writes one `Resume` interface. Import parsers map *into* it; templates render *from* it; the LLM receives it verbatim. This keeps the data contract in one place and makes `localStorage` persistence a trivial serialize/deserialize.

**`mammoth` (DOCX) + `pdf-parse` (PDF), with an OCR fallback for image-based PDFs, then a structuring pass.** These extract raw text; mapping raw text into sections (header/summary/experience/education/skills) is heuristic. Decision: where the LLM is configured, reuse it to structure messy extracted text into the `Resume` shape; where it is not, fall back to best-effort heuristic parsing plus heavy reliance on the user editing. Alternative: a dedicated resume-parsing API — rejected as extra dependency/cost for an MVP.

**Detect text-vs-image PDFs and branch to OCR for scanned resumes.** This follows the approach used by the [MSG `rule` project](https://github.com/MSG-Mutual-Support-to-Grow/rule): first attempt native text extraction; if the extracted text is below a small threshold, treat the PDF as image-based and run OCR instead. A `pdf-parse`-only path silently returns near-empty text for scanned/exported-as-image resumes, which would land the user in a blank editor with no signal. The `rule` project implements this in Python (pdfplumber for native, then pdf2image → OpenCV preprocessing → pytesseract → spaCy/spellcheck cleanup); we adapt the *approach*, not the stack, since this is a browser-first TypeScript app. JS equivalents: rasterize pages with `pdfjs-dist`, OCR with `tesseract.js`. Decision for v1: implement the text-vs-image detection and native path now; gate the OCR path behind the detection so it only loads `tesseract.js` (a heavy WASM dependency) when a scanned PDF is actually encountered. A worthwhile borrowed detail from their cleanup pass is protecting emails and proper nouns from spellcheck "correction" and normalizing common OCR artifacts (e.g. ` egmail.com` → `@gmail.com`) — but with an LLM structuring pass available, much of that cleanup can be delegated to the model rather than hand-coded.

**Request structured JSON output from the LLM.** The review response is parsed JSON (score, category breakdown, feedback array), not free text, so the UI can render scores and inline suggestions deterministically. The server validates/normalizes the shape before returning it.

**No-key fallback is a first-class state, not an error.** When `OPENROUTER_API_KEY` is absent, the review panel shows a manual checklist derived from the same guidelines. The app remains fully usable (create, edit, template, export) without any LLM.

## Risks / Trade-offs

- **Import parsing is lossy / mis-sections content** → Treat parsed output as a draft; land the user directly in the editor to correct it; never block export on parse quality.
- **Scanned/image-based PDFs yield empty native text** → Detect text-vs-image up front (threshold on extracted text length) and branch to an OCR path (`tesseract.js`) for image PDFs, mirroring the `rule` project's native-first / OCR-fallback design.
- **`tesseract.js` is a heavy WASM dependency and OCR is slow** → Load it lazily only when the detection classifies a PDF as image-based; show a clear "running OCR" progress state since it is noticeably slower than native extraction.
- **OCR output contains recognition errors (typos, mangled emails/dates)** → Prefer delegating cleanup to the LLM structuring pass; if needed, add light normalization for known artifacts, while protecting emails and proper nouns from over-correction.
- **`@react-pdf/renderer` layout differs from familiar CSS, slowing template work** → Keep templates single-column and simple (which is also the ATS requirement), reducing layout complexity.
- **Live preview re-rendering the PDF on every keystroke is expensive** → Debounce edits before re-rendering the preview; render export only on demand.
- **LLM returns malformed or non-JSON output** → Server validates/normalizes; on failure, surface a graceful "review unavailable, try again" state rather than crashing the editor.
- **Next.js 16 API drift from training assumptions** → Consult `node_modules/next/dist/docs/` before writing route handlers / server code; do not assume prior-version conventions.
- **`localStorage` only = data loss on cache clear / no cross-device** → Acceptable and documented for v1; sync is an explicit non-goal.
- **OpenRouter cost/latency per review** → No caching in v1 is accepted; reviews are user-initiated and async with a loading state.

## Open Questions

- Exact OpenRouter response schema and the prompt wording that reliably yields valid JSON — to be pinned down during `llm-review` implementation.
- Whether DOCX/PDF text extraction runs in the server route (alongside the LLM structuring pass) or client-side; leaning server-side to colocate with the structuring LLM call. Note OCR adds a wrinkle: `tesseract.js` can run in-browser (offloading CPU from the server) or server-side; pick per where the rest of extraction lands and the size/perf trade-off.
- Default model (`openai/gpt-4o-mini` is the proposed default) pending a quick quality/cost check.
