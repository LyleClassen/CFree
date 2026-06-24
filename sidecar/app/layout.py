"""Reconstruct columns and reading order from word geometry.

This is the part that actually fixes the "experience lands in skills" bug: a
two-column resume's sidebar (SKILLS, LANGUAGES, …) is kept contiguous and
separate from the main column (EMPLOYMENT HISTORY, …), instead of the two being
interleaved into one jumbled stream the way a naive top-to-bottom text dump is.
"""

from __future__ import annotations

from .common import Word
from .schema import Block

# Section names we recognize as headings regardless of casing.
_SECTION_KEYWORDS = {
    "details",
    "contact",
    "contact details",
    "links",
    "link",
    "skills",
    "technical skills",
    "competencies",
    "technologies",
    "languages",
    "language",
    "hobbies",
    "interests",
    "profile",
    "summary",
    "professional summary",
    "objective",
    "about",
    "about me",
    "employment history",
    "employment",
    "experience",
    "work experience",
    "professional experience",
    "work history",
    "education",
    "references",
    "courses",
    "certifications",
    "certificates",
    "projects",
    "awards",
    "publications",
    "volunteer",
}


def reconstruct_page(words: list[Word], page_width: float) -> list[Block]:
    """Reconstruct one page's words into reading-ordered, column-tagged blocks."""
    if not words:
        return []

    split = _detect_split(words, page_width)
    if split is None:
        columns = [("single", words)]
    else:
        left = [w for w in words if w.cx < split]
        right = [w for w in words if w.cx >= split]
        left_w = _column_width(left)
        right_w = _column_width(right)
        # The narrower column is the sidebar; emit columns left-to-right.
        if left_w <= right_w:
            columns = [("sidebar", left), ("main", right)]
        else:
            columns = [("main", left), ("sidebar", right)]

    blocks: list[Block] = []
    for label, col_words in columns:
        for line in _group_lines(col_words):
            text = " ".join(w.text for w in line).strip()
            if not text:
                continue
            blocks.append(
                Block(
                    column=label,
                    is_heading=_is_heading(text),
                    text=text,
                    bbox=_union_bbox(line),
                )
            )
    return blocks


def blocks_to_text(blocks: list[Block]) -> str:
    """Render blocks into layout-aware text with column + heading markers."""
    parts: list[str] = []
    current_column: str | None = None
    for b in blocks:
        if b.column in ("sidebar", "main") and b.column != current_column:
            parts.append(f"[COLUMN {b.column}]")
            current_column = b.column
        elif b.column == "single":
            current_column = None
        parts.append(f"## {b.text}" if b.is_heading else b.text)
    return "\n".join(parts).strip()


# --------------------------------------------------------------------------- #
# Column detection
# --------------------------------------------------------------------------- #
def _detect_split(words: list[Word], page_width: float) -> float | None:
    """Find the x of a column gutter, or None for a single-column page.

    Scores candidate vertical splits by how few words *straddle* them (i.e. have
    a box crossing the line). A real gutter has near-zero straddlers even when a
    full-width header line sits above the columns, because that header is made of
    separate words none of which individually crosses the gutter x.
    """
    n = len(words)
    if n < 6:
        return None

    left_edge = min(w.x0 for w in words)
    right_edge = max(w.x1 for w in words)
    span = right_edge - left_edge
    if span <= 0:
        return None

    lo = left_edge + 0.10 * span
    hi = left_edge + 0.90 * span
    steps = 100
    best: tuple[tuple[int, int], float] | None = None
    for i in range(steps + 1):
        s = lo + (hi - lo) * i / steps
        straddle = sum(1 for w in words if w.x0 < s < w.x1)
        left = sum(1 for w in words if w.x1 <= s)
        right = sum(1 for w in words if w.x0 >= s)
        # Require a substantial column on each side so a few stray glyphs (e.g.
        # timeline markers or wrapped lines on an otherwise single-column page)
        # don't get mistaken for a sidebar.
        min_side = max(8, int(0.12 * n))
        if left < min_side or right < min_side:
            continue
        score = (straddle, -min(left, right))
        if best is None or score < best[0]:
            best = (score, s)

    if best is None:
        return None
    (straddle, _), split = best
    if straddle > max(2, int(0.03 * n)):
        return None
    return split


def _column_width(words: list[Word]) -> float:
    if not words:
        return 0.0
    return max(w.x1 for w in words) - min(w.x0 for w in words)


# --------------------------------------------------------------------------- #
# Line grouping
# --------------------------------------------------------------------------- #
def _group_lines(words: list[Word]) -> list[list[Word]]:
    if not words:
        return []
    ws = sorted(words, key=lambda w: (w.cy, w.x0))
    heights = sorted(w.height for w in ws if w.height > 0)
    med_h = heights[len(heights) // 2] if heights else 10.0
    tol = max(0.6 * med_h, 2.0)

    lines: list[list[Word]] = []
    current = [ws[0]]
    current_cy = ws[0].cy
    for w in ws[1:]:
        if abs(w.cy - current_cy) <= tol:
            current.append(w)
            current_cy = sum(x.cy for x in current) / len(current)
        else:
            lines.append(current)
            current = [w]
            current_cy = w.cy
    lines.append(current)

    for line in lines:
        line.sort(key=lambda w: w.x0)
    return lines


def _union_bbox(words: list[Word]) -> list[float]:
    return [
        min(w.x0 for w in words),
        min(w.y0 for w in words),
        max(w.x1 for w in words),
        max(w.y1 for w in words),
    ]


# --------------------------------------------------------------------------- #
# Heading detection
# --------------------------------------------------------------------------- #
_BULLET_CHARS = "•-*–—·●◦‣"


def _is_heading(text: str) -> bool:
    t = text.strip()
    if not t or len(t) > 40:
        return False
    # A line that starts with a bullet is a list item, never a heading
    # (kills false positives like "• WPF", "• ASP.NET").
    if t[0] in _BULLET_CHARS:
        return False
    normalized = t.lower().rstrip(":").strip()
    if normalized in _SECTION_KEYWORDS:
        return True
    # All-caps short label (e.g. "EMPLOYMENT HISTORY"). The >=4 letter floor
    # avoids treating skills/acronyms like "AWS" or "WPF" as section headings.
    letters = [c for c in t if c.isalpha()]
    if len(letters) >= 4 and all(c.isupper() for c in letters) and len(t.split()) <= 4:
        return True
    return False
