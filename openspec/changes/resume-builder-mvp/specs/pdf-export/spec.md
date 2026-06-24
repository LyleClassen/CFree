## ADDED Requirements

### Requirement: Export to PDF with WYSIWYG fidelity

The system SHALL export the resume to a downloadable PDF rendered from the selected template using the same renderer as the live preview, so that the exported file matches what the user sees in the preview.

#### Scenario: Export matches preview

- **WHEN** a user exports the resume
- **THEN** a PDF is downloaded that matches the previewed template and content

### Requirement: Export file naming

The system SHALL name the exported file `FirstName_LastName_Resume.pdf`, deriving the name from the resume header's full name.

#### Scenario: File name from full name

- **WHEN** a user with full name "Jane Doe" exports the resume
- **THEN** the downloaded file is named `Jane_Doe_Resume.pdf`

#### Scenario: Missing name fallback

- **WHEN** the resume header has no full name
- **THEN** the export still produces a downloadable PDF with a sensible default file name
