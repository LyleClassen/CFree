# llm-review Specification

## Purpose
TBD - created by archiving change resume-builder-mvp. Update Purpose after archive.
## Requirements
### Requirement: Server-side OpenRouter review

The system SHALL send the structured resume to OpenRouter through a server-side route so that the API key is never exposed to the browser. The server SHALL use the 2026 resume guidelines as the system prompt and the structured resume JSON as the user message, and SHALL configure the model via `OPENROUTER_MODEL`.

#### Scenario: Review request keeps key server-side

- **WHEN** the client requests a review
- **THEN** the request is proxied through the server route and `OPENROUTER_API_KEY` is not present in any client-visible code or response

### Requirement: Structured review response

The system SHALL return the review as structured data containing an overall score from 0 to 100, a per-category breakdown covering ATS compatibility, achievement impact, content clarity, and format, and a list of bullet-point feedback items. The server SHALL validate and normalize the response shape before returning it to the client.

#### Scenario: Successful review

- **WHEN** a review completes successfully
- **THEN** the client receives an overall 0-100 score, the four category scores, and feedback items

#### Scenario: Malformed LLM output

- **WHEN** the LLM returns output that does not match the expected structure
- **THEN** the server surfaces a graceful "review unavailable, try again" state instead of crashing the editor

### Requirement: Asynchronous review with loading state

The system SHALL perform reviews asynchronously, showing a loading state while the review is in progress. The system SHALL NOT cache review results in v1.

#### Scenario: Loading indicator during review

- **WHEN** a review is in progress
- **THEN** the UI shows a loading state until the result or error returns

### Requirement: No-API-key fallback

WHEN no `OPENROUTER_API_KEY` is configured, the system SHALL present a manual checklist derived from the 2026 guidelines instead of an automated score, and the rest of the app (create, edit, template, export) SHALL remain fully usable.

#### Scenario: Missing API key

- **WHEN** the app is used without an OpenRouter API key configured
- **THEN** the review panel shows a guidelines-derived manual checklist and no automated score, and all other features still work

