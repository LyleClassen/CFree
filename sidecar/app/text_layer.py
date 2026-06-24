"""Embedded text-layer extraction via PyMuPDF.

This is the preferred, zero-error path for digital PDFs: every character is read
directly from the file with exact word geometry, so no OCR misreads are possible.
Only pages without a usable text layer fall through to the OCR engines.
"""

from __future__ import annotations

import fitz  # PyMuPDF

from .common import Word

# A page is considered to have a usable text layer if its words carry at least
# this many alphanumeric characters in total. Stray watermark glyphs on a scanned
# page shouldn't be mistaken for real, selectable text.
_MIN_TEXT_CHARS = 20


def extract_words(page: "fitz.Page") -> list[Word]:
    """Return the page's embedded words with bounding boxes, or [] if none."""
    words: list[Word] = []
    # get_text("words") -> (x0, y0, x1, y1, word, block_no, line_no, word_no)
    for x0, y0, x1, y1, text, *_ in page.get_text("words"):
        text = text.strip()
        if text:
            words.append(Word(text=text, x0=x0, y0=y0, x1=x1, y1=y1))
    return words


def has_usable_text_layer(words: list[Word]) -> bool:
    chars = sum(len([c for c in w.text if c.isalnum()]) for w in words)
    return chars >= _MIN_TEXT_CHARS
