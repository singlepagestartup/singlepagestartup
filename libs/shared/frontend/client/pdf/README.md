# @sps/shared-frontend-client-pdf

Browser-only generation of multipage PDFs from mounted React/HTML elements.
`createPdfFromElements` captures pages in the caller's order and returns a
`Promise<Blob>`. `useElementPdfDownload` optionally owns the asynchronous state
and object URL. Neither API chooses when to export or contains product content.

## Runtime and units

This is an Nx source library, generated with `@nx/react:library`. Imports are
resolved by the workspace's generated `tsconfig.base.json` mapping; it is not a
package-manager workspace. Vite 8 consumers enable `resolve.tsconfigPaths: true`.
Runtime dependencies already supplied by the workspace: React, `html-to-image`
1.11.13 and `jspdf` 4.2.1. The rasterizer and PDF engine load on demand.

| Fields                            | Meaning                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| `sourceWidthPx`, `sourceHeightPx` | Logical layout dimensions in CSS pixels; mount pages at this size    |
| `outputWidthPx`, `outputHeightPx` | Integer raster dimensions, independent of browser/device pixel ratio |
| `pdfWidthPt`, `pdfHeightPt`       | Physical PDF dimensions; 72 points = 1 inch                          |

All three sizes must have the same aspect ratio. At CSS's nominal 96 px/inch,
`pdfWidthPt = sourceWidthPx * 72 / 96`. Increasing raster resolution does not
enlarge the physical page. A landscape geometry selects landscape orientation.
Invalid sizes, aspect ratios, image quality and empty page lists are rejected.

The source elements must remain mounted in the same document for the export.
Give capture containers fixed dimensions and the same inherited typography as
visible content. For responsive previews, uniformly scale the fixed page;
reflowing a narrower preview produces a different layout. Offscreen capture
containers may be inert and outside the viewport, but must participate in layout
(do not use `display: none`). Keep hidden containers in the product component.

## Function example

```ts
import { createPdfFromElements } from "@sps/shared-frontend-client-pdf";

const width = 400;
const height = 600;
const blob = await createPdfFromElements({
  elements: [...document.querySelectorAll<HTMLElement>("[data-print-page]")],
  page: {
    sourceWidthPx: width,
    sourceHeightPx: height,
    outputWidthPx: width * 3,
    outputHeightPx: height * 3,
    pdfWidthPt: width * (72 / 96),
    pdfHeightPt: height * (72 / 96),
  },
  metadata: { title: "Guide", author: "Editorial team", subject: "Learning" },
  // PNG is the default. For photographs: image: { format: "jpeg", quality: 0.94 }
});

const url = URL.createObjectURL(blob);
downloadLink.href = url;
downloadLink.download = "guide.pdf";
// Keep the URL alive while the link is usable. When replacing/removing it:
// URL.revokeObjectURL(url);
```

`metadata` also accepts `creator`; `image` also accepts `backgroundColor`.
`quality` is between 0 and 1 and only affects JPEG. PNG avoids lossy text edges.
No data URL is returned. An internal encoded raster remains an implementation
detail of the capture adapter.

## React hook example

```tsx
"use client";
import { useRef } from "react";
import { useElementPdfDownload } from "@sps/shared-frontend-client-pdf";

export function DownloadableGuide() {
  const pageRef = useRef<HTMLElement>(null);
  const pdf = useElementPdfDownload();
  return (
    <>
      <article ref={pageRef} className="h-[600px] w-[400px] bg-white">
        Guide content
      </article>
      <button
        disabled={pdf.status === "loading"}
        onClick={() =>
          void pdf.generate(() => {
            if (!pageRef.current) {
              throw new Error("Page is not mounted");
            }
            return {
              elements: [pageRef.current],
              page: {
                sourceWidthPx: 400,
                sourceHeightPx: 600,
                outputWidthPx: 1200,
                outputHeightPx: 1800,
                pdfWidthPt: 300,
                pdfHeightPt: 450,
              },
            };
          })
        }
      >
        Prepare PDF
      </button>
      {pdf.url && (
        <a href={pdf.url} download="guide.pdf">
          Download PDF
        </a>
      )}
      {pdf.error && <p role="alert">{pdf.error.message}</p>}
    </>
  );
}
```

The initial state is `idle`. Explicit `generate(options)` or
`generate(() => options)` moves through `loading` to `ready` or `error` and can
be retried after failure. The factory collects current refs inside error
handling. The hook never starts on mount or automatically detects content changes.
The product may call `generate` in an effect and `reset` when its content changes.

A new run revokes the old URL and aborts the preceding run. `reset()` returns to
`idle` and frees the URL. Unmount does the same cleanup. Stale successes and
failures cannot update state or allocate an object URL, even when an adapter
ignores cancellation. Do not persist/share a Blob URL: it is scoped to the
browser document. Do not revoke it immediately after assigning a download link.
Callers using the function without the hook own this cleanup themselves.

## Styles, Tailwind and fonts

The caller loads its normal stylesheet, including compiled Tailwind utilities,
in the document containing the mounted pages. The PDF library does not compile
Tailwind or import a separate theme. During cloning, `html-to-image` reads each
element's computed CSS and copies it to the clone: layout, spacing, colors,
typography and other properties already resolved by the browser. Responsive
utilities and dark mode use the source document's current viewport and state;
they are not reevaluated for the raster's higher pixel resolution. Ensure that
Tailwind discovers the source files containing the export layout's class names.

Fonts follow a separate path. After `ownerDocument.fonts.ready`, the adapter
collects computed font families from every page and descendant. A detached probe
in the source document passes those resolved families to `getFontEmbedCSS` once;
this includes later-page fonts and inline `font-family: var(...)` declarations
without changing the live DOM. The function finds accessible `@font-face` rules
and embeds their font files as data URLs. The adapter passes the resulting
`fontEmbedCSS` to each capture. `html-to-image` inserts these rules in the cloned DOM,
renders it through SVG/canvas, and produces the PNG/JPEG placed in the PDF.
`fontEmbedCSS` contains font rules; the rest of the styling comes from computed CSS.

Declare custom fonts with readable `@font-face` rules and reachable font URLs.
`fonts.ready` alone does not supply font bytes: faces registered only through the
JavaScript `FontFace` API without stylesheet rules are not discovered by this
adapter. System fonts depend on the browser environment. The local visual fixture
uses Tailwind utilities and a bundled variable TTF font to exercise both paths.

## Resources, fidelity and limitations

- Works only in a browser with DOM, FontFaceSet, image decoding and canvas support.
  There is no server-side renderer or backend endpoint in this library.
- Waits for the owning document's `fonts.ready` and successful `decode()` of all
  descendant/root `<img>` elements, including already complete images. An unloaded
  image fails with its source in the error. Each resource has a 30-second timeout,
  configurable with `resourceTimeoutMs`. `signal` supports explicit cancellation.
- Captures sequentially to preserve order and limit peak raster memory. Cancellation
  stops resource waits and subsequent pages; an in-flight html-to-image capture
  itself cannot be interrupted. PNG/photo-heavy decks can still consume substantial
  browser memory; choose resolution and JPEG intentionally for the format.
- The default adapter embeds available TTF/OTF/WOFF fonts without a WOFF2-only
  filter. It copies the exact computed `font` shorthand before other longhands to
  avoid html-to-image 1.11.x's font-size rounding/reduction. Re-run the visual test
  when upgrading the capture engine or changing font/layout features.
- Pages are raster images, so text is visually preserved but is not selectable,
  searchable or an embedded PDF text font. Hyperlinks and accessibility structure
  inside source pages do not become interactive PDF annotations.
- `html-to-image` uses SVG foreignObject. Cross-origin styles/fonts/images require
  accessible resources and appropriate CORS; CSS backgrounds, pseudo-elements,
  video, canvas, shadow roots, complex filters, animations and browser-specific
  typography can have capture limitations. Freeze animations and use local static
  resources for reproducible results. Readiness validation targets `<img>`;
  it is not a general crawler of CSS/video/shadow-DOM resources.
- Fonts with computed shorthand that a browser cannot serialize and render may
  require a different adapter. One tested fixture cannot guarantee every CSS
  feature or browser. Minor raster antialias differences are expected; a change
  in line breaks, crop or block geometry is a regression.

## Adding a format or capture adapter

1. Define one logical width/height and derive raster and point sizes from them.
2. Mount fixed-size pages with stable refs in the desired order. Pass metadata and
   filename from the product; keep export timing there as well.
3. Use the function or hook through the single public import. Verify a text-heavy
   page and a photo/crop page at both full and narrow preview widths.
4. Add a deterministic fixture when the format uses a new layout/typography feature.

`captureAdapter?: IPdfCaptureAdapter` is the replacement seam. Its asynchronous
`prepare({ elements, page, image, signal })` returns a per-export session with
`capture(element): Promise<string>`. Return a PNG/JPEG encoded image in the
requested format and raster dimensions, without mutating source DOM. PDF
geometry, metadata, page order, Blob creation and download state remain shared.
A future Chromium/Playwright service adapter can serialize a product's mounted
pages and return screenshots behind this interface. That service and transport
are future work; the product's `createPdfFromElements`/hook API need not change.

## Verification

Discover the resolved targets first:

```sh
npx nx show project @sps/shared-frontend-client-pdf --json
npx nx run-many -p @sps/shared-frontend-client-pdf -t tsc:build eslint:lint jest:test
```

The scoped ESLint config retains repository rules while restricting its TypeScript
program to this library; loading the whole monorepo for one utility exhausts the
default Node heap. Unit tests use the repository's BDD headers and cover resources,
order/count, metadata, dimensions, Blob output and hook lifecycle races.

The separate visual test needs `playwright`, `pngjs`, `pixelmatch`, a Chromium
binary, and Poppler's `pdfinfo`/`pdftoppm` on the QA machine. These are test tools,
not client runtime dependencies. Install them in your QA tool environment, or use
Codex's bundled Node dependencies with `PDF_VISUAL_NODE_MODULES`. Set
`PDF_VISUAL_BROWSER` to an existing Chrome/Chromium executable if Playwright's
bundled browser is unavailable.

```sh
# Terminal 1: local deterministic React fixture (no product dependencies)
npx nx run @sps/shared-frontend-client-pdf:visual:serve
# Terminal 2: independent native browser screenshot -> actual Blob download -> Poppler
npx nx run @sps/shared-frontend-client-pdf:visual:test
```

Optional environment variables: `PDF_VISUAL_URL` (default `http://127.0.0.1:4330`),
`PDF_VISUAL_OUTPUT` (default `tmp/pdf-visual`), `PDF_VISUAL_NODE_MODULES`,
`PDF_VISUAL_BROWSER`. The runner uses its own temporary browser profile.

The test writes `source.png`, `fixture.pdf`, `pdf-page.png`, `difference.png`, and
`report.json`. It checks metadata, one 300 × 450 pt page and an 800 × 1200 native
HTML screenshot. Pixelmatch uses its standard color threshold 0.1 and excludes
antialias edge differences; at most 2% changed pixels are allowed. Images are not
blurred, aligned or corrected to pass. Manrope is included solely for this
neutral fixture under the adjacent SIL Open Font License.

## Transfer to singlepagestartup/sps-lite

Copy the complete library (including tests, local fixture assets/license and
README), preserve the Nx project name, and regenerate/register the public import
mapping using the target workspace's normal Nx setup. Ensure compatible React,
html-to-image, jsPDF and Nx Jest/TypeScript/ESLint tooling are present. No product
components, content, workspace asset paths or repository configuration are
required. Run the unit and visual targets in the receiving repository before
migrating any consumers. Product adoption and its filenames, metadata, page
geometry and export timing remain downstream responsibilities.
