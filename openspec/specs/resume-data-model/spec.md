# resume-data-model Specification

## Purpose
TBD - created by archiving change resume-builder-mvp. Update Purpose after archive.
## Requirements
### Requirement: Canonical resume data shape

The system SHALL represent every resume as a single structured object with the following sections: `header` (fullName, email, phone, location, optional linkedin), `summary` (string), `experience` (array of company, role, startDate, endDate where endDate may be the literal "Present", location, bullets array), `education` (array of institution, degree, field, graduationDate, optional gpa), and `skills` (array of strings). All import, editing, review, and rendering features SHALL read from and write to this single shape.

#### Scenario: Created resume conforms to the model

- **WHEN** a user creates a resume from scratch and fills in any section
- **THEN** the stored data matches the canonical structure with the edited section populated and other sections present (possibly empty)

#### Scenario: Ongoing role uses "Present"

- **WHEN** an experience entry has no end date because the role is ongoing
- **THEN** its `endDate` is stored as the literal value "Present"

### Requirement: Browser persistence in localStorage

The system SHALL persist the current resume to the browser's `localStorage` and SHALL restore it on next visit. The system SHALL NOT use any server-side database or user account for persistence in v1.

#### Scenario: Edits survive reload

- **WHEN** a user edits the resume and reloads the page
- **THEN** the previously edited resume is restored from `localStorage`

#### Scenario: First visit with no stored data

- **WHEN** a user opens the app and no resume exists in `localStorage`
- **THEN** the app starts with an empty resume conforming to the canonical model

