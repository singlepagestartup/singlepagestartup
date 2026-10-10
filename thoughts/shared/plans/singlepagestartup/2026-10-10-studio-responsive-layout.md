# Studio responsive layout

Status: complete

## Scope

Studio model views use Tailwind container queries for responsive layout. Width
measurements and mobile/desktop render branches do not select project navigation.
The registration form uses a fixed gap between fields, independent of its card's
height. Production modules remain outside this change.

## Implementation

- [x] Replace the Profile overview's width observer and two sidebar trees with
      one sidebar. CSS controls its position, visibility and the frame's columns.
      JavaScript controls user actions, dismissal and keyboard focus.
- [x] Remove the Sidebar's `mobile` prop; use container queries for title padding.
- [x] Align registration fields at the start of the form with a consistent gap.
- [x] Verify project navigation, resizing and registration at narrow,
      intermediate and wide widths. Run Studio tests, type checking and a build.
- [x] Publish the scoped changes to PR #371 and record the verified commit.

## Audit boundary

The active Studio model views contain one width-driven layout branch, in Profile
`ai-chat-project-overview`. The imported runnable prototypes contain unused
shadcn sidebar copies; no application imports them. Their source bundles are
outside this Storybook change. ArtifactFrame measures a fixed export artboard
for proportional scaling. The rich editor's Mobile/Desktop control selects a
preview width explicitly. Neither chooses layout from a viewport breakpoint.

## Continuation

See `thoughts/shared/handoffs/singlepagestartup/studio-responsive-layout-2026-10-10.md`.

## Verification

All 285 Studio tests in 40 files pass. TypeScript, metadata validation, inventory,
content freshness, code placement and diff checks pass. Storybook builds.

Browser checks cover widths 320, 799, 800 and 1200 px. The sidebar is a single
DOM tree; a collapsed document list survives resizing. The 760px content-box
boundary changes the panel from an overlay to a grid column and hides its
backdrop. Close, backdrop, Escape/focus return, project settings and New thread
navigation work. No horizontal overflow or browser errors occurred.

Registration has 20px between field groups at widths 320, 767, 1000 and 1192 px.
Empty-submit validation reports each missing value and focuses Email. Screenshot:
`/private/tmp/studio-registration-responsive.png`.

## Published result

Implementation commit in the local branch:
`94fb6c6a40eecfa02859d287acfb01fe5712aa91`.
Published implementation in PR #371:
`3dcd4f2569e967be6b479d797b0776062572741e`.
PR head and description are verified. All six owned files match between the
local checkout and the publication checkout. The unrelated production commit
`94f63c6a75` is excluded. Existing dirty files remain outside the commit.
