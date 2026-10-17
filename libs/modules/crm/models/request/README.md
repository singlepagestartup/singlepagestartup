# CRM Request Model

## Purpose

Requests store submitted form payloads for CRM processing.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `payload`: submitted request payload (JSON).

## Variants

- `default`: placeholder request view.
- `find`: data-fetch wrapper for querying requests.
- `admin-form`: admin create/edit form for request payload.
- `admin-select-input`: admin select input for choosing a request.
- `admin-table`: admin table listing requests.
- `admin-table-row`: admin row showing request fields.

## Validated submissions

Subject form submissions use the public `IRequestSubmission` contract: a UUID
`submissionId` and Steps/Inputs addressed by their IDs. RBAC loads the selected
Form's Step/Input/Option relations and validates every submitted identifier,
required field and value type before calling Request service. Stored labels,
Form metadata and selected Option records come from those services.

Request service creates the Request and Form–Request relation in one database
transaction. Operation-local service and repository clones retain the effective
startup prototypes and share the transaction without changing singleton
repositories. A transaction-scoped advisory lock serializes a key derived from
Subject, Form and submission ID. The stored digest rejects reuse with different
values; repeated identical submissions return the same Request.

PostgreSQL capture records Request and Form–Request writes in the same
transaction. The shared dispatcher invalidates registered reads and bridges
legacy subscribers. Submissions require no publisher registration in the API
host. Notification delivery remains outside the database transaction.

Notification configuration is checked before the first save; delivery starts
after commit. The response includes `submissionResult.saved`, `requestId`,
`formId`, `notificationStatus` and `replayed`. Status is `sent`, `failed` or
`queued`. A nonempty notification result is `sent` only when every Notification
record has status `sent`. Error records make the receipt `failed`; pending or
unknown statuses keep it `queued`. Failure takes precedence across recipients.
`queued` includes an interrupted delivery/status-write whose result is
unknown. Every returned receipt refers to a saved Request. Retrying a saved
submission does not send its notifications again. Failed or interrupted delivery
requires explicit follow-up rather than automatic resubmission.
