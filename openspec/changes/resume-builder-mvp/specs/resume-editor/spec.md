## ADDED Requirements

### Requirement: Structured section editing

The system SHALL provide form-based editing for each resume section (header, summary, experience, education, skills), including adding, editing, reordering where applicable, and removing repeatable entries (experience items, education items, bullets, skills).

#### Scenario: Add an experience entry

- **WHEN** a user adds a new experience entry and fills in its fields
- **THEN** the new entry is added to the resume model and appears in the editor

#### Scenario: Remove a bullet

- **WHEN** a user removes a bullet from an experience entry
- **THEN** that bullet is removed from the resume model

### Requirement: Live PDF preview alongside the editor

The system SHALL display the resume as a live PDF preview next to the editing forms, and SHALL update the preview to reflect edits without requiring an explicit save or re-render action by the user.

#### Scenario: Preview reflects edits

- **WHEN** a user changes a field in the editor
- **THEN** the live PDF preview updates to show the changed content

### Requirement: Inline LLM suggestions

The system SHALL display LLM review suggestions inline within the editor when a review is available, associated with the relevant section or field.

#### Scenario: Suggestions shown after review

- **WHEN** an LLM review has returned feedback for a section
- **THEN** the relevant suggestions are shown inline near that section in the editor

#### Scenario: No suggestions when review unavailable

- **WHEN** no LLM review has been performed or the LLM is unavailable
- **THEN** the editor displays no inline suggestions and remains fully usable
