---
repository: singlepagestartup/singlepagestartup
date: 2026-09-08
status: implemented-and-verified
---

# Base browser PDF export for Studio Presentation

The operator explicitly requested transferring the shared PDF export from the
m2commerce checkout to the framework at `code/singlepagestartup/sps-lite` and
making it a base feature of `06 Presentation`. The directory name is sps-lite;
its configured origin identifies `singlepagestartup/singlepagestartup`. On entry
the target working tree was clean on `codex/issue-222-predevelopment-client-system`.
No issue phase, Project transition, commit, push or publication was requested.

## Decisions and implementation

- Created `libs/shared/frontend/client/pdf` with the installed
  `@nx/react:library` generator after source/help inspection and dry run. Ported
  the complete neutral library, tests, visual fixture and font license from the
  source checkout. The import remains `@sps/shared-frontend-client-pdf`.
- Restored only unrelated generator changes to VSCode recommendations, global
  Nx defaults and a new root Jest config. The original tsconfig formatting was
  retained with only the new path entry. Added exact runtime dependencies
  `html-to-image@1.11.13` and `jspdf@4.2.1` through npm, including its lockfile.
- `apps/studio/workspace/components/PresentationPdfDownload.tsx` provides the
  reusable product-neutral control. `ProductCatalog.tsx` wraps every interactive
  Presentation with it, so downstream product overrides receive the same action.
  Components mark fixed-size pages with the existing `data-slide-id` contract.
- Capture uses the mounted pages in their DOM order, rejects mixed page sizes,
  and does not mount a duplicate hidden deck. Source sizes produce a 2x PNG and
  72/96 point dimensions: the current 1600 x 900 slides become 3200 x 1800 raster
  pixels on 1200 x 675 pt PDF pages. Filename/title come from the selected product.
- Preparation occurs only on **Prepare PDF**. Loading disables the button,
  success exposes **Download PDF**, and errors allow retry. Content/product
  changes and unmount reset the shared hook, revoke URLs and discard stale work.
- The direct `?document=presentation` rendering path stays plain for the existing
  CLI exporter. Presentation content, layer selection and business artifacts
  were not changed. Vite 8's `resolve.tsconfigPaths` enables the new Nx import.
- The Studio README documents the default behavior and page marker contract.

## Font compatibility discovered during transfer

Framework typography uses inline `font-family: var(...)`. The installed
html-to-image font discovery prefers inline font-family over its computed value,
so an unresolved variable can hide a font used only by a heading. The adapter now
collects computed font families from every page/descendant into a detached probe
owned by the source document. It embeds all matching font faces once, without
altering the source DOM. A BDD regression covers variables; the later-page font
case remains covered. This fix, its tests and README were also applied to the
source checkout so both shared library directories remain byte-identical.

## Verification

All checks used Node 24.11.0 where Node is required. Resolved Nx targets were read
with `nx show project ... --json` before execution.

- Library `tsc:build`, `eslint:lint`, `jest:test`: PASS, 19 tests / 3 suites.
- Studio TypeScript and scoped ESLint on the three changed TS/TSX files: PASS.
- Existing `npm run studio:presentation:test`: PASS, 51 tests / 11 files.
- Library `visual:test`: PASS, 0.7572% changed pixels with the existing 2% threshold.
- @Browser on port 4321: `40 Products/default` -> `06 Presentation` exposes
  **Prepare PDF** with 13 mounted pages and idle state. Port 4320's existing
  m2commerce Storybook remained running.
- An isolated Chrome test exercised the actual Storybook button/download, then
  parsed the saved 3,422,269-byte PDF: 13 pages, 1200 x 675 pt, rotation 0, title
  Code Framework, creator SPS Studio. Generation stayed idle while source
  screenshots were collected. Leaving the tab revoked its Blob URL; reopening
  returned to idle. The direct single-slide CLI route remained free of controls.
  No JavaScript errors were observed.
- All 13 PDF pages were independently rendered with Poppler and compared with
  native Chrome screenshots at the export raster's 3200 x 1800 resolution.
  Differences range from 0.0395% to 0.6270%, all below 2% (Pixelmatch threshold
  0.1, antialias edges excluded). An initial comparison after downsampling to
  1600 x 900 reached 2.66%; full-size inspection showed edge/resampling differences,
  and rerunning at matching native resolution passed without changing production
  rendering or the threshold. The first native comparison and its failure were
  retained under `/tmp/sps-pdf-qa/presentation` for traceability.
- `git diff --check`: PASS. The two shared library directories compare identical.

Review derivatives are gitignored under
`apps/studio/output/singlepage/pdf-validation/`: the PDF, reports, native HTML/PDF
comparison and the environment-specific browser verification script. The reusable
visual test remains tracked with the library. The browser PDF is rasterized;
selectable text and arbitrary browser/CSS fidelity remain documented limitations.
