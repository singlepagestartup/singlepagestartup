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

## Ecommerce scenarios

- `subject-me-ecommerce-module-product-list-default`: catalog with current-Subject purchase actions.
- `subject-me-ecommerce-module-product-overview-default`: one Product selected by `ecommerceModuleProductSlug`.
- `subject-me-ecommerce-module-category-overview-default`: Category products and their Store-specific purchase actions, selected by `ecommerceModuleCategorySlug`.
- `subject-me-ecommerce-module-store-overview-default`: Store products and purchase actions, selected by `ecommerceModuleStoreSlug`.

Each uses the public Widget reader and its own default
widgets-to-website-builder-module-widgets association. The linked
`content-ecommerce-default` Website Builder Widget owns the block layout and
editable copy. Product cards, attributes and media remain in Ecommerce;
Subject variants provide the session and scoped cart operations. Host's Page
render-reader passes explicit resource props to the saved Widget. Each Widget
forwards its required inputs to Content and Subject views. Host holds no
scenario registry.

## Variants

- `subject-me-profile-settings`: account sections composed from separate Subject Profile, avatar, Identity and purchase components.
- `subject-me-social-module-profile-create-ai-chat`: authenticated project chooser and creation flow. Its own `widgets-to-website-builder-module-widgets` link selects the persisted Website Builder creation card. The chooser renders project links; Create project opens the original `content-ai-chat-profile-create` card with its photograph, copy and Subject form. Back to projects returns to the chooser.
- `subject-me-social-module-profile-id-settings-ai-chat`: project settings for the explicitly selected Profile/Chat.
- `subject-me-social-module-profile-id-chat-id-thread-create-ai-chat`: Thread creation within a selected, connected project.
- `subject-me-social-module-profile-id-chat-id-thread-id-ai-chat`: connected-project guard and Social Profile → Chat → Thread composition. Subject components provide messages, composer, Knowledge editors and document export.
- `subject-me-authentication-*-ai-chat`: separate authentication pages whose own Widget relation selects the Website Builder frame, containing the corresponding Subject form.

AI Chat Widgets use the shared model reader. Auth, project list/create and Help
read content links by their own Widget ID; the default relation resolves the exact Website
Builder record and forwards the rendered form slot. Interactive Subject forms
retain their authenticated SDK scope. Route IDs and locale come from Host;
Widgets do not select another instance from URL strings, variants or global
content slugs.

- `subject-me-crm-module-form-support-ai-chat`: Help owns an explicit Website
  Builder content link and an explicit CRM Widget link. The latter's
  `widgets-to-forms` selects the exact `crmModuleFormId` passed to the Subject.
  Form → Step → Input owns the fields; RBAC owns authenticated submission.

The admin-v2 Widget form exposes Website Builder and CRM relation tabs. Missing,
duplicate AI Chat content links report a configuration error.
The project chooser keeps the original creation photograph, copy and form.

Landing's interactive walkthrough belongs to Website Builder and needs no
Social Chat record. Host forwards Navbar presentation flags; RBAC Subject owns
the session, project selector and account controls.

- `default`: placeholder widget view.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.

## Functional and presentation composition

Authentication, registration, recovery, project creation and support use their
own RBAC Widget variants. Each reads its saved Widget links by widgetId and
renders the standard default relation. The linked Website Builder variant owns
its layout and content; the RBAC variant supplies its Subject form as children.
There is no relation-specific business mode. Sign-in, registration, forgot and
reset password have independent Website Builder presentations and may share a
stateless layout inside that model. A stored copy/image change does not add a
new RBAC variant. Shared content is forked before assigning distinct layouts,
so changing registration does not alter sign-in.

### Page context and migrated compositions

AI Chat workspace/settings Widgets accept `socialModuleProfileId`,
`socialModuleChatId` and `socialModuleThreadId`. Subject overview and product
views accept `subjectSlug`; Ecommerce views accept module-qualified slugs.
Host selects these values inside Page's render callback. No Widget, relation,
Content or client view accepts the complete routing map. A missing required
value cannot become an unfiltered collection read. RBAC imports no Host reader.
Standalone callers supply the same explicit resource inputs.
Legacy Subject list/overview, identity settings and product/order compositions
also live here; their functional Content sits beside the owning Widget view.
The saved Widget IDs, localized content and relation records are unchanged.

## Current-Subject chat Widgets

`subject-me-social-module-profile-chat-list-default` and
`subject-me-social-module-profile-chat-overview-default` live under
`singlepage/subject/me/social-module/profile/chat/`. Each accepts explicit
`socialModuleChatId` and `socialModuleThreadId` inputs from Host. Content mounts the Subject me-reader with `isServer={false}`;
public frame configuration can remain server-rendered on cached Host pages.
A missing Chat ID leaves the overview reader unmounted.

Each saved RBAC Widget has its own default
`widgets-to-website-builder-module-widgets` link to a
`content-social-chat-default` frame. The two operations share the renderer,
while independent frame records preserve their original copy and class names.
The frame renders the supplied JSX without adding headings that were absent
from the original Social wrappers. Host contains no chat Subject callbacks.

The list selects one owned acting Profile and requests a single Subject-wide
Chat collection. Shared chats appear once even when several owned Profiles
participate. Participant data is included in the collection response; loaded
rows use `dataSource="props"` instead of individual detail queries.

## CRM contact form

`subject-me-crm-module-form-request-create` owns the Framework contact operation.
Its exact `widgets-to-website-builder-module-widgets` link selects the saved
`content-feature-find-row` frame. Its exact `widgets-to-crm-module-widgets`
link selects the CRM Widget; that Widget's ordered `widgets-to-forms` links
select the real Forms. The default Website Builder relation renders the Subject
form as children. No second CRM presentation wraps that slot.

The current-Subject request operation retains schema-driven Steps, Inputs,
Options, submissionId and separate Request/notification results. Host dispatches
the saved RBAC Widget through its ordinary module bridge. Existing direct CRM
blocks keep the legacy Host CRM composition for compatibility.
