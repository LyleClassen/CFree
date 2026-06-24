# Resume Builder (MVP)

A browser-only resume builder: import an existing resume (PDF/DOCX) or start from
scratch, edit it in a split-pane editor with a live PDF preview, get an LLM-powered
review against the 2026 resume guidelines, pick an ATS-safe template, and export to PDF.

All resume data lives in the browser's `localStorage` — there is no database and no
account. The only server-side code is a thin proxy that keeps the OpenRouter API key
off the client.

## Getting started

```bash
bun install
bun run dev
```

The app opens straight into the builder.

## Environment

Copy `.env.example` to `.env.local` and fill in the values:

| Variable             | Required | Default              | Purpose                                            |
| -------------------- | -------- | -------------------- | -------------------------------------------------- |
| `OPENROUTER_API_KEY` | No       | _(empty)_            | Enables automated LLM review via OpenRouter.       |
| `OPENROUTER_MODEL`   | No       | `openai/gpt-4o-mini` | Model used for the review and import structuring.  |

Without `OPENROUTER_API_KEY` the app stays fully usable: review falls back to a manual
checklist derived from the guidelines, and resume import uses heuristic parsing instead
of LLM-assisted structuring.

## Scripts

```bash
bun run dev        # start the dev server
bun run build      # production build
bun run typecheck  # tsc --noEmit
bun run lint       # eslint
```
