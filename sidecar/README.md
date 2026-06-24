# Resume OCR Sidecar

A small [`uv`](https://docs.astral.sh/uv/)-managed FastAPI service that turns a
resume PDF into **layout-aware text** for the CFree builder. It reconstructs
columns and reading order from word geometry, so a two-column resume's sidebar
(SKILLS, LANGUAGES, …) stays separate from the main column (EMPLOYMENT HISTORY,
…) instead of being flattened into one jumbled stream — which is what caused
experience content to bleed into skills.

## How it works

For each PDF page:

1. **Text layer first** — if the page has an embedded text layer, words and their
   bounding boxes are read directly with PyMuPDF (zero OCR error).
2. **OCR fallback** — scanned/image-only pages are rasterized and OCR'd with
   **DocTR** (primary); if DocTR is unavailable or low-confidence, **PaddleOCR**
   (ultra-light PP-OCR mobile models) is used.
3. Both paths produce words + boxes, which are clustered into columns, ordered
   top-to-bottom within each column, and tagged with `[COLUMN sidebar|main]`
   markers and `## HEADING` lines.

The Next.js app's `/api/structure` LLM then maps this clean text to the resume
model. OCR model weights download to `~/.cache/doctr` on first use.

## Run

```bash
# from the repo root
npm run sidecar
# or directly
cd sidecar && uv run uvicorn app.main:app --reload --port 8000
```

The first `uv run` resolves and installs dependencies (torch via DocTR and
paddlepaddle via PaddleOCR are large). Point the Next.js app at it with
`OCR_SIDECAR_URL=http://127.0.0.1:8000` in `.env.local`.

## API

- `GET /health` → `{ "ok": true }`
- `POST /ocr` (multipart `file=<pdf>`) →
  `{ ok, engine, pages, text, blocks: [{ column, is_heading, text, bbox }] }`
  where `engine` is `text-layer` | `doctr` | `paddleocr` | `mixed`.

```bash
curl -F "file=@../refs/your-resume.pdf" http://127.0.0.1:8000/ocr
```
