# CFree — Domain Glossary

CFree is a browser-only resume builder. Users import an existing resume (PDF/DOCX/txt) or build from scratch, tune content with LLM-powered suggestions, and export a formatted PDF. No accounts, no database — all data lives in the browser (localStorage for MVP).

## Language

**Resume**:
A canonical structured model (`Resume` interface) holding header, summary, experience, education, and skills. Every feature — import, edit, review, render, export — reads from and writes to this single shape.
_Avoid_: Document, CV, draft

**Review**:
An LLM-powered scoring pass against the 2026 guidelines. Produces a score (0-100), per-category breakdowns, and a list of feedback items. May be unavailable when no API key is configured (falls back to a manual checklist).
_Avoid_: Audit, critique, analysis

**Feedback**:
An individual actionable suggestion within a review result. Carries a `fieldPath`, `suggestedValue`, and `action` (replace/add/remove/advice). Can be applied (mutates the Resume) and undone (reverts via a stored reverse patch). Indices are tied to the current review result and invalidated on re-review.
_Avoid_: Suggestion, hint, recommendation

**Template**:
A named visual theme for PDF export and preview. Exists in two representations: UI metadata (label, codename, description, heading style) for the picker, and rendering config (fonts, colors, spacing) for the PDF renderer — both sourced from the canonical set of template definitions.
_Avoid_: Theme, layout, skin

**Storage Adapter**:
A seam injected into domain contexts to decouple state persistence from the in-memory model. The MVP implementation wraps `localStorage`; swapping to cloud storage means implementing the same interface and injecting it at the root.
_Avoid_: Storage, persistence layer, backend
