# Product material utilities

Use these shared components in Website, Marketing Creative, Presentation and
free-form Product Content. Keep copy, images, scenes and project-specific TSX
under `products/<source-layer>/<product-id>/`; never import another checkout.
Agents generate and edit those sources in the same project conversation. Studio
previews them; it does not require another chat or a hosted generation service.

## Artboards and PNG

```tsx
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";

<ArtifactFrame width={1280} height={720} fileName="project-cover.png">
  <YourEditableComposition />
</ArtifactFrame>;
```

Author at the specified fixed dimensions. Compose real HTML text and graphic
layers over registered images, rather than baking every label into a bitmap.
The frame scales for viewing and exports original dimensions, embedding fonts
and images through the same capture adapter as PDF. The controls are outside the
capture. `download={false}` retains the artboard without controls. Use the
project's fonts, styles and original image backgrounds; do not damage image
masters to fit a capture.

## Motion and MP4

```tsx
import { MotionPreview } from "../../../../utils/media/MotionPreview";

<MotionPreview title="Animated cover" fileName="project-cover.mp4" composition={{ id: "project-cover", component: YourFrameComponent, width: 1280, height: 720, fps: 30, durationInFrames: 90 }} />;
```

Memoize the composition and component when its text changes. Use Remotion
`useCurrentFrame`, `interpolate`, `Img`, and `AbsoluteFill` for deterministic
frames; keep the composition's fonts, colors and media explicit. The default
workflow uses no external editor or rendering server. Remotion Player provides
playback and seeking; the web renderer makes a silent H.264 MP4 in the browser,
with progress, cancellation, retry and download. Browser WebCodecs/codec support
is checked before rendering; an unsupported browser receives an actionable
message. Audio or full timeline editing can be added by a project when needed.

Installed Remotion packages share the exact version 4.0.505, matching the adopted
browser-rendering approach. Package licensing is separate from the framework's
license: consult https://www.remotion.dev/license before distribution or paid
usage. API reference: https://www.remotion.dev/docs/web-renderer/render-media-on-web.

## Text and layout

Use catalog `representations: { text: "product/copy.md", preview:
"product/Layout.tsx" }` for a cover, article, storyboard, post or README. Group
related outputs in the catalog tree. Text is the canonical wording; the layout
receives it as `text?: string`. Read only that document's own content. If a static
and animated cover share wording, both consume the same Markdown. Controls and
confirmation belong to the review header, never inside the exported artboard.
Download Markdown strips review frontmatter from customer-facing output.

Presentation follows the shared slide browser. Its YAML remains its own copy
source; per-slide Markdown is a view of that data. Custom decks may supply explicit
slide text without extracting prose from rendered HTML or other business documents.
A slide's PNG contains that slide; full-deck PDF contains every slide. Product
Content remains optional and project-defined; a repository README is an example,
not a universal downstream requirement.
