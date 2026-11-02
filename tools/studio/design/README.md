# Design extension verification

Run `npm run studio:presentation:test` for layout parsing, atomic inheritance,
source ownership, custom rendering, and filesystem checks.

For isolated browser verification:

```sh
npx storybook dev -c tools/studio/design/.storybook --port 4321 --host 127.0.0.1 --ci
```

`Verification / Design extensions` provides:

- **Custom Template**: a project shell with selected default Colors, interactive
  TSX Icons, nested Markdown/relative SVG, and isolated HTML with a nested link.
- **Custom Sections**: the same declared blocks inside the standard shell.
- **Entirely Custom**: a standalone template without legacy Design data/blocks.
- **Inherited**: the effective layout from the real workspace.

Check icon-size interaction, relative images and HTML navigation, selected block
order, visible document status, and narrow-screen layout. Custom fixtures live
outside workspace and do not change client documents or the live layout.

Build with `storybook build -c tools/studio/design/.storybook -o <temporary-dir>`
to verify compiled components and copied static sources. This config supplies
its own Tailwind source path and reuses the Studio runtime and build settings.

The framework Interface kit is grouped in the selected Design layout. Its
canonical catalogue is `specimens.ts`; keep titles, categories and required
coverage there. TSX/JSX declarations are read as syntax nodes, and HTML fragments
use `data-specimen` and H3 headings. Only files reachable from the resolved
layout count. Nested groups preserve atomic layer ownership.

Browser verification includes category keyboard navigation and state retention,
form errors, table filters/sorting/pagination, modal focus/Escape, local file
validation, chat send/stop/retry, and the all-category HTML snapshot. Component
examples identify local simulations; they do not establish backend integration.
