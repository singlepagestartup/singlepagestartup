# Studio model inspection

Every Studio model variant exposes `data-module`, `data-model` and `data-variant`
on its highest rendered element. The public model dispatcher supplies the selected
variant; direct variant stories use a local default. Delegated render helpers and
startup overrides preserve that selected value.

## Rendering

- Existing sections, forms, articles, links, buttons and SVGs carry the attributes
  directly. Empty and missing-record states carry the same model identity.
- A Page has its own marked root above the separately marked Host Layout. Composed
  views keep each nested model's attributes.
- Provider-only roots pass the selected variant to their rendered child. Host
  record helpers mark their existing roots and preserve embedded form layout. Sidebar
  and settings fragments have marked containers; Message List keeps its existing
  log element and separate Profile portal.
- Dropdown triggers and portaled content identify the same variant. Dialog content
  and overlays carry the owning model identity. Button `control` keeps its native
  button root and forwarded ref.
- Catalog scaffolding emits the same attributes and variant defaults. Workspace
  implementation, fixtures and visual assets remain independent of Modules.

## Verification

- The root audit covers all 400 local variant implementations. Rendered checks cover
  every model entry's available catalog/button views, empty and missing-record
  states, delegated Subject forms, startup overrides, native controls and glyphs.
- All 368 Studio tests across 42 files pass. TypeScript, design-system validation,
  inventory, content freshness, code placement, whitespace checks and Storybook
  production build pass.
- Browser DOM checks verify a 20-card Page list, its empty state, the composed AI
  Chat Page/Layout/Profile/Chat/Thread/Message/Subject/Source tree and the portaled
  Profile menu and Host Metadata Select. The verification tab has no console errors.

The existing composition tests identify the intended overview through its block
marker; counting every `data-model` occurrence would also count its newly marked
child variants. Unrelated working changes remain outside this implementation.
