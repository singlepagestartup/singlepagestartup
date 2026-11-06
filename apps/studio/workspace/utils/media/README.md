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

A catalog page has one `source`. Use Markdown for an article or business context,
and a React/HTML source for a finished website, ad or presentation. Edit copy and
layout together in that source. When a static and animated composition share
wording, keep it in their own shared data module.

Group related outputs under the product. Each article is one Storybook story
with its brief, SEO, article, video, social posts and publication results.
Export controls stay outside the artboard.

Presentation content belongs to its product's React source. A slide's PNG
contains that slide; full-deck PDF contains every slide. Shared utilities supply
the frame and export, while the product supplies the content and layout.
