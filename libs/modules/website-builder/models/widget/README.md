# Website Builder Widget Model

## Purpose

Widgets store reusable content blocks (text, media, structured sections) for building UI sections.

## Fields

- `title`: widget title (localized).
- `subtitle`: widget subtitle (localized).
- `description`: widget description/content (localized, rich text).
- `anchor`: HTML anchor for in-page navigation.
- `className`: custom CSS classes.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `content-ai-chat-profile-create`: project creation card with a form slot and project-start image.
- `content-ai-chat-materials-processing`: expandable materials-processing disclosure.
- `content-ai-chat-help`: support-page heading, support card with its own title and icon, form slot and response information. The Widget receives its persisted data through the owning RBAC Widget relation and renders the Subject/CRM form supplied as children.
- `content-ai-chat-authentication`: sign-in introduction, imagery and aside with an RBAC form slot.
- `content-ai-chat-registration`: registration presentation with two images and its own RBAC form slot.
- `content-ai-chat-forgot-password`: password recovery presentation with its own RBAC form slot.
- `content-ai-chat-reset-password`: password reset presentation with its own RBAC form slot.
- `navbar-ai-chat`: server navigation presentation with children for project and account controls composed by Host. Host supplies `language` and `helpSelected`; the Widget does not receive or parse the current Page URL.
- `footer-ai-chat`: server footer presentation with locale-aware destinations.
- `landing-ai-chat`: landing presentation with its own local interactive demonstration. The walkthrough uses prepared copy and local state without a Social Chat record, API writes or AI calls. It imports no Social or RBAC components.

- `default`: sample component, for debugging.
- `content-default`: saved hero copy, ordered media, sliders, features and CTA groups.
- `content-hero`: saved localized hero heading, subtitle and description with ordered media and CTA groups.
- `content-page-header`: a compact full-width page introduction with saved subtitle as eyebrow, title as h1, rich description and exact ordered action groups. The default semantic classes set its compact spacing; saved `className` and explicit view classes can adjust the presentation. Its child slot renders separately, with no media column or Feature association payload.
- `content-feature-split`: a two-column h2 section. Saved subtitle, title and rich description supply its copy; exact media, Feature and action associations supply its content. Without linked media, the heading and body occupy separate columns.
- `content-feature-split-reverse`: the same section with a left illustration using `object-contain`.
- `content-definition-grid`: an h2 capability collection with ordered saved Features and action groups. The Widget's `className` controls its grid.
- `content-definition-grid-page`: an h1 page-level collection using the same saved fields and associations.
- `content-steps`: a numbered process. Ordered `step` Features and a `copy-request` Feature share the grid; the copy request spans all columns through presentation CSS.
- `content-offer`: a dark h2 panel with saved subtitle, title, description, Feature content and actions.
- `content-offer-card`: a light offer panel over the same persisted fields.
- `content-faq`: saved introduction and actions on the left, ordered `dropdown` Features on the right. The generic questions heading is localized for English and Russian.
- `content-feature-find-card`: saved section heading and description with ordered Feature cards and CTA groups.
- `content-form`: saved heading and description around a rendered domain form slot.
- `content-collection`: saved h2 heading, subtitle, description, exact action groups and ordered linked Sliders around rendered collection rows and an optional footer slot. The saved `className` controls the content grid; a detail frame may leave its heading empty when the model supplies one.
- `content-feature-find-row`: two-column saved contact introduction and features with a rendered form slot. The owning domain Widget supplies its form as children or contactForm.
- `footer-default`: saved brand description, Logotype, ordered navigation groups and copyright. A `footer-column` ButtonsArray supplies each group's heading; other arrays retain their existing presentations.
- `navbar-default`: site header/navigation bar (menus, branding).
- `find`: internal data-fetch wrapper for queries; not used directly on pages.
- `admin-select-input`: admin UI select input for linking widgets.
- `admin-table-row`: admin UI row for widget listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing widgets.

## Presentation ownership

These variants render content and JSX slots without loading a Subject, choosing
its form or receiving a business mode. Domain Widgets own those operations and
select an exact presentation through their default Widget relation. RBAC owns
authenticated operations; Blog and Social own their public collections. The authentication
family shares a stateless layout within Website Builder. Localized title,
subtitle and description override its default heading, introduction and aside
body. Default images and supplementary copy remain variant-owned presentation;
CMS migration of those defaults to linked media/content is a separate follow-up.

## Ecommerce presentation

`content-ecommerce-default` renders the saved localized title, subtitle,
description, anchor and className around a rendered children slot. RBAC Widget
variants own catalog and purchase composition and select this exact record
through their default Widget relation. This presentation imports no RBAC or
Ecommerce models and performs no session, cart or order reads.

## Framework presentation

Content sections, navbar and footer share a `max-w-7xl` grid with responsive
horizontal padding. Ecommerce children occupy that grid without a second card
container. Saved relation order and IDs determine content order and React keys.
The navbar uses the standard record reader; its client boundary receives only
loaded display data and rendered logo/navigation slots. Mobile navigation closes
after following a saved link or pressing Escape.

`content-hero` uses a light split layout with an h1 and square cover media.
Supplementary Feature records render only when linked. Notes belong in the
saved rich description. These presentation variants read their saved record
through the standard Widget SDK template; associations are scoped by Widget ID,
sorted by order and association ID, and rendered through their default renderer.
They contain no Framework route dispatch or domain operations. Saved Feature
associations render independently of the `children` slot. Domain consumers can
append rendered content without replacing the Widget's own Features, including
when an opaque child component eventually renders nothing.

### Icons

Content Features use the shared Phosphor Icon adapter: `file-text` ▤,
`check` ✓, `check-circle` ✓ and `plus` +. Clipboard controls keep their browser
interaction inside `ClientComponent.tsx`; the saved-record reader stays outside
that client boundary.

Lucide React supplies the navigation glyphs: Menu ☰ and X ×. They are decorative
inside buttons with localized accessible names. Slider arrows use the same
library, ArrowLeft ← and ArrowRight →. No new photographic assets are bundled.
