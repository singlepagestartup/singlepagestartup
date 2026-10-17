# RBAC Widget Model

## Purpose

RBAC widgets provide reusable content blocks for access and account flows.

## Fields

- `id`: unique identifier (UUID).
- `className`: optional CSS class name.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `subject-me-profile-settings`: account sections composed from separate Subject Profile, avatar, Identity and purchase components.
- `subject-me-social-module-profile-create-ai-chat`: authenticated project chooser and creation flow. Its own `widgets-to-website-builder-module-widgets` link selects the persisted Website Builder creation card. The chooser renders project links; Create project opens the original `content-ai-chat-profile-create` card with its photograph, copy and Subject form. Back to projects returns to the chooser.
- `subject-me-social-module-profile-id-settings-ai-chat`: project settings for explicit Profile/Chat IDs supplied by Host.
- `subject-me-social-module-profile-id-chat-id-thread-create-ai-chat`: Thread creation within a selected, connected project.
- `subject-me-social-module-profile-id-chat-id-thread-id-ai-chat`: connected-project guard and Social Profile → Chat → Thread composition. Subject components provide messages, composer, Knowledge editors and document export.
- `subject-me-authentication-*-ai-chat`: separate authentication pages whose own Widget relation selects the Website Builder frame, containing the corresponding Subject form.

AI Chat Widgets use the shared model reader. Auth, project list/create and Help
read content links by their own Widget ID; the relation resolves the exact Website
Builder record and validates its presentation variant. Interactive Subject forms
retain their authenticated SDK scope. Route IDs and locale come from Host;
Widgets do not select another instance from URL strings, variants or global
content slugs.

- `subject-me-crm-module-form-support-ai-chat`: Help owns an explicit Website
  Builder content link and an explicit CRM Widget link. The latter's
  `widgets-to-forms` selects the exact `crmModuleFormId` passed to the Subject.
  Form → Step → Input owns the fields; RBAC owns authenticated submission.

The admin-v2 Widget form exposes Website Builder and CRM relation tabs. Missing,
duplicate or mismatched AI Chat content slots report a configuration error.
The project chooser keeps the original creation photograph, copy and form.

Landing's interactive walkthrough belongs to Website Builder and needs no
Social Chat record. Host still composes Navbar account controls and route flags.

- `default`: placeholder widget view.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.
