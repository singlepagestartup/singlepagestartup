# Product extension verification

Run `npm run studio:presentation:test` for catalog, ownership, nested-source,
filesystem-validation, Sales, Research and Markdown rendering checks.

For the isolated browser fixture:

```sh
npx storybook dev -c tools/studio/products/.storybook -p 4321 --ci
```

`Verification / Product extensions` owns a complete local course fixture under
`fixtures/startup/`. It imports the shared Studio components and its own data;
it does not borrow a framework product or load the framework business catalog.
The fixture's virtual `/workspace-products/startup/` URL maps to its local sources.
Actual client catalogs and workspace business documents remain untouched.

- **Nested Pages**: independent Product/economics documents, Sales segment pages
  and Markdown exports, Research pages and links, HTML/JSX website pages, PNG and
  MP4 material exports. The core Presentation retains raw fixed-size slide markup
  and must export two PDF pages. Academy also includes nested Markdown and an
  additional deck using `export: pdf`.
- **Shared Slides**: the same startup with its own copy and the shared slide
  adapter. Select either slide, switch Text/Layout and export that slide as PNG.
  PDF must contain exactly two pages regardless of the selected visible preview.

Expected media: 640×360 cover/slide PNG, silent 640×360 H.264 MP4 at 30fps with
30 frames, raw-deck PDF with two 240×135pt pages, shared-deck PDF with two
480×270pt pages. Exports belong in temporary output/download folders, not beside
the editable fixture sources. Check 375px review layout without document overflow.

The fixture explicitly adds its Tailwind sources; the production stylesheet
already scans workspace pages. Build this isolated configuration with the usual
`storybook build -c` command to verify JSX and static HTML/assets in production
output as well. These are synthetic verification examples, not reusable client
business facts or a preconfigured product to copy into a downstream project.
