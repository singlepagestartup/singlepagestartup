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
