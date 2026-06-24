"""Pydantic response models for the /ocr endpoint."""

from __future__ import annotations

from pydantic import BaseModel


class Block(BaseModel):
    """A reconstructed block of text in proper reading order."""

    column: str  # "sidebar" | "main" | "single"
    is_heading: bool
    text: str
    bbox: list[float]  # [x0, y0, x1, y1] in page points


class OcrResponse(BaseModel):
    ok: bool
    # Which engine produced the words: "text-layer" | "doctr" | "paddleocr" | "mixed"
    engine: str = ""
    pages: int = 0
    # Layout-aware text with [COLUMN ...] markers and "## HEADING" lines.
    text: str = ""
    blocks: list[Block] = []
    error: str | None = None
