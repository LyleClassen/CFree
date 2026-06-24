"""OCR for scanned pages: DocTR primary, PaddleOCR ultra-light fallback.

Both engines are imported lazily and their models cached as module-level
singletons, so the heavy torch/paddle stacks and model downloads are only paid
for when a page actually lacks a text layer. Both produce the same
``list[Word]`` shape (pixel coordinates) the layout stage consumes.
"""

from __future__ import annotations

import logging

import numpy as np

from .common import Word

log = logging.getLogger("ocr")

# Below this mean word confidence, DocTR output is treated as unreliable and we
# retry the page with PaddleOCR.
_DOCTR_MIN_CONFIDENCE = 0.5

_doctr_model = None
_paddle_model = None


def ocr_image(image: np.ndarray) -> tuple[list[Word], str]:
    """OCR an RGB image. Returns (words, engine_name).

    Tries DocTR first; on failure or low confidence, falls back to PaddleOCR.
    """
    try:
        words, confidence = _doctr_words(image)
        if words and confidence >= _DOCTR_MIN_CONFIDENCE:
            return words, "doctr"
        log.info("DocTR low confidence (%.2f); trying PaddleOCR", confidence)
    except Exception as exc:  # noqa: BLE001 - degrade to the fallback engine
        log.warning("DocTR failed: %s; trying PaddleOCR", exc)
        words = []

    try:
        paddle_words = _paddle_words(image)
        if paddle_words:
            return paddle_words, "paddleocr"
    except Exception as exc:  # noqa: BLE001
        log.warning("PaddleOCR failed: %s", exc)

    # Nothing better than whatever DocTR managed (possibly empty).
    return words, "doctr"


# --------------------------------------------------------------------------- #
# DocTR
# --------------------------------------------------------------------------- #
def _get_doctr():
    global _doctr_model
    if _doctr_model is None:
        from doctr.models import ocr_predictor

        # db_resnet50 detection + crnn_vgg16_bn recognition: strong word geometry.
        _doctr_model = ocr_predictor(
            det_arch="db_resnet50",
            reco_arch="crnn_vgg16_bn",
            pretrained=True,
        )
    return _doctr_model


def _doctr_words(image: np.ndarray) -> tuple[list[Word], float]:
    model = _get_doctr()
    result = model([image])
    export = result.export()
    h, w = image.shape[0], image.shape[1]

    words: list[Word] = []
    confidences: list[float] = []
    for page in export.get("pages", []):
        for block in page.get("blocks", []):
            for line in block.get("lines", []):
                for word in line.get("words", []):
                    value = (word.get("value") or "").strip()
                    if not value:
                        continue
                    (rx0, ry0), (rx1, ry1) = word["geometry"]
                    words.append(
                        Word(
                            text=value,
                            x0=rx0 * w,
                            y0=ry0 * h,
                            x1=rx1 * w,
                            y1=ry1 * h,
                        )
                    )
                    confidences.append(float(word.get("confidence", 1.0)))

    mean_conf = sum(confidences) / len(confidences) if confidences else 0.0
    return words, mean_conf


# --------------------------------------------------------------------------- #
# PaddleOCR (ultra-light PP-OCR mobile models)
# --------------------------------------------------------------------------- #
def _get_paddle():
    global _paddle_model
    if _paddle_model is None:
        from paddleocr import PaddleOCR

        # Default models are the ultra-light PP-OCR mobile det+rec set.
        _paddle_model = PaddleOCR(lang="en", use_angle_cls=False, show_log=False)
    return _paddle_model


def _paddle_words(image: np.ndarray) -> list[Word]:
    ocr = _get_paddle()
    # PaddleOCR expects BGR; our image is RGB.
    bgr = image[:, :, ::-1]

    try:
        raw = ocr.ocr(bgr, cls=False)
    except TypeError:
        # PaddleOCR 3.x dropped the `cls` kwarg / renamed the entrypoint.
        raw = ocr.ocr(bgr)

    words: list[Word] = []
    # 2.x shape: [ [ [box, (text, conf)], ... ] ]  (outer list is per-image)
    pages = raw or []
    for page in pages:
        if not page:
            continue
        for entry in page:
            try:
                box, (text, _conf) = entry
            except (ValueError, TypeError):
                continue
            text = (text or "").strip()
            if not text:
                continue
            xs = [pt[0] for pt in box]
            ys = [pt[1] for pt in box]
            words.append(
                Word(text=text, x0=min(xs), y0=min(ys), x1=max(xs), y1=max(ys))
            )
    return words
