"""Shared primitives used across extraction, OCR, and layout reconstruction."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Word:
    """A single recognized/extracted word with its bounding box.

    Coordinates are in PDF/image points with the origin at the top-left,
    x increasing right and y increasing down — the convention PyMuPDF uses,
    which the OCR path normalizes to as well.
    """

    text: str
    x0: float
    y0: float
    x1: float
    y1: float

    @property
    def cx(self) -> float:
        return (self.x0 + self.x1) / 2.0

    @property
    def cy(self) -> float:
        return (self.y0 + self.y1) / 2.0

    @property
    def height(self) -> float:
        return max(self.y1 - self.y0, 0.0)
