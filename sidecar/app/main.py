"""FastAPI OCR sidecar for layout-aware resume parsing.

POST /ocr   multipart file=<pdf>  ->  layout-aware text + blocks
GET  /health
"""

from __future__ import annotations

import logging

import fitz  # PyMuPDF
import numpy as np
from fastapi import FastAPI, File, UploadFile

from . import layout, text_layer
from .schema import Block, OcrResponse

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("sidecar")

app = FastAPI(title="Resume OCR Sidecar")

# DPI used when rasterizing a page for OCR. ~200 balances accuracy and speed.
_OCR_DPI = 200


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/ocr", response_model=OcrResponse)
async def ocr(file: UploadFile = File(...)) -> OcrResponse:
    data = await file.read()
    if not data:
        return OcrResponse(ok=False, error="Empty file.")

    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:  # noqa: BLE001
        log.warning("Failed to open PDF: %s", exc)
        return OcrResponse(ok=False, error="Could not open the PDF.")

    all_blocks: list[Block] = []
    engines: set[str] = set()
    try:
        for page in doc:
            words = text_layer.extract_words(page)
            if text_layer.has_usable_text_layer(words):
                engines.add("text-layer")
            else:
                words, engine = _ocr_page(page)
                engines.add(engine)
            page_width = float(page.rect.width)
            all_blocks.extend(layout.reconstruct_page(words, page_width))
        pages = doc.page_count
    finally:
        doc.close()

    text = layout.blocks_to_text(all_blocks)
    engine = engines.pop() if len(engines) == 1 else "mixed" if engines else ""
    return OcrResponse(
        ok=True, engine=engine, pages=pages, text=text, blocks=all_blocks
    )


def _ocr_page(page: "fitz.Page"):
    """Rasterize a page and OCR it. Imports the heavy OCR stack lazily."""
    from . import ocr_engines

    pix = page.get_pixmap(dpi=_OCR_DPI, alpha=False)
    image = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
        pix.height, pix.width, pix.n
    )
    if pix.n == 4:  # RGBA -> RGB
        image = image[:, :, :3]
    elif pix.n == 1:  # gray -> RGB
        image = np.repeat(image, 3, axis=2)

    words, engine = ocr_engines.ocr_image(np.ascontiguousarray(image))
    # OCR words are in pixel space; reconstruct uses relative geometry so that
    # is fine, but pass the image width as the page width for split detection.
    return words, engine
