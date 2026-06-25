# Decompose the single-context state monolith into domain contexts with injected adapters

The original `ResumeProvider` in `lib/resume/store.tsx` coupled five concerns (resume data, template selection, review orchestration, applied feedback tracking, localStorage persistence) in a single React Context with a 17-entry `useMemo` dep array. Every consumer subscribed to all state. Three `useEffect` calls on mount mixed hydration, network config checks, and persistence.

We decomposed it into four domain contexts with a nested hierarchy, each receiving its persistence adapter as a prop. Cross-context operations (reset, clear, import) are handled by composite hooks in `hooks/`. This decision was reached through the improve-codebase-architecture grilling process.

**Status:** accepted

**Considered Options:**
- Flat sibling contexts (rejected: review needs resume, feedback needs both)
- Context injection for storage adapters (rejected: props are simpler for MVP with fewer indirections)
- Merging feedback into review context (rejected: orthogonal concern with independent apply/undo lifecycle)
- Module-level import for storage (rejected: makes testing impossible and future cloud swap harder)

**Consequences:**
- Adding a new domain state (e.g. undo history, collaboration) means a new context, not bloating an existing one
- Providers must be composed at the root and their props wired explicitly
- Composite hooks in `hooks/` concentrate cross-context orchestration in one alias-resolved directory
