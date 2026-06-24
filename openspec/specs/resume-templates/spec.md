# resume-templates Specification

## Purpose
TBD - created by archiving change resume-builder-mvp. Update Purpose after archive.
## Requirements
### Requirement: ATS-safe single-column templates

The system SHALL provide 3 to 4 templates — Professional, Modern, Minimal, and Executive — that are all single-column and use standard fonts only, so that output remains ATS-compatible. Every template SHALL render from the canonical resume data model.

#### Scenario: Template renders all sections

- **WHEN** a template is applied to a populated resume
- **THEN** the rendered output shows all populated sections in a single-column, ATS-safe layout

### Requirement: Template selection

The system SHALL allow the user to choose a template, offering selection after the LLM review when the user chooses to update their resume. Changing the template SHALL re-render the preview using the selected template without altering the resume content.

#### Scenario: Switch template

- **WHEN** a user selects a different template
- **THEN** the preview re-renders in the chosen template and the resume content is unchanged

#### Scenario: Selection offered after review

- **WHEN** an LLM review completes and the user chooses to update their resume
- **THEN** the user is offered the template selection

