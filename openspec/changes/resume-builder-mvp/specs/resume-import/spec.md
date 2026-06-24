## ADDED Requirements

### Requirement: Upload and parse PDF and DOCX resumes

The system SHALL allow a user to upload an existing resume in PDF or DOCX format and SHALL parse it into the canonical resume data model. The system SHALL use the parsed result to populate the editor.

#### Scenario: Upload a DOCX resume

- **WHEN** a user uploads a `.docx` resume
- **THEN** the file is parsed into the structured resume model and the editor is populated with the extracted sections

#### Scenario: Upload a text-based PDF resume

- **WHEN** a user uploads a `.pdf` resume that contains extractable text
- **THEN** the system extracts text natively and parses it into the structured resume model, populating the editor

#### Scenario: Unsupported file type

- **WHEN** a user uploads a file that is neither PDF nor DOCX
- **THEN** the system rejects the upload and shows a message that only PDF and DOCX are supported

### Requirement: OCR fallback for image-based PDFs

The system SHALL detect whether an uploaded PDF is text-based or image-based by attempting native text extraction and checking whether the extracted text meets a minimum length threshold. WHEN a PDF is image-based (native extraction yields below-threshold text), the system SHALL fall back to an OCR path to extract the text before structuring it into the resume model.

#### Scenario: Scanned PDF triggers OCR

- **WHEN** a user uploads a scanned or image-based PDF whose native text extraction is below the threshold
- **THEN** the system runs OCR on the rasterized pages to extract text and populates the editor from the OCR result

#### Scenario: OCR progress is visible

- **WHEN** the OCR path is running on an image-based PDF
- **THEN** the system shows a progress/loading state because OCR is slower than native extraction

#### Scenario: Empty extraction after OCR

- **WHEN** both native extraction and OCR yield effectively no text
- **THEN** the system informs the user that text could not be extracted and offers to start from a blank resume rather than failing silently

### Requirement: Parsed content is editable, not authoritative

The system SHALL treat parsed import output as a draft that the user can correct, and SHALL land the user in the editor after import rather than blocking on parse quality.

#### Scenario: Imperfect parse is correctable

- **WHEN** import mis-sections or omits content
- **THEN** the user can edit any field in the editor to correct it, and export is not blocked by parse imperfections
