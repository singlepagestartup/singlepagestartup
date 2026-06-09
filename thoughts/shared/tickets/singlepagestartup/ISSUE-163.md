# Issue: Create standalone Waku app to validate apps/host frontend startup behavior

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/163
**Status**: Research Needed
**Created**: 2026-04-25
**Priority**: medium
**Size**: large
**Type**: research

---

## Problem to Solve

The current path of keeping the frontend on modern Next.js is blocked by the unresolved runtime and startup problems captured in issue `#162` and the related issue-162 artifacts. We need a separate application dedicated to testing Waku as an alternative frontend runtime for SPS.

This app must not be a throwaway demo. It should reproduce the same core behavior contract currently implemented by `apps/host` well enough to answer a practical engineering question: can SPS boot, route, fetch data, and render host-driven pages/widgets on Waku with stable developer and production startup flows?

The goal is to validate Waku through a real runnable app before considering any wider migration away from the current Next.js-based host.

## Key Details

- Create a new standalone application under `apps/` for the spike instead of modifying or replacing `apps/host` in place.
- Treat `apps/host` as the behavioral reference:
  - preserve the current catch-all URL resolution flow from `apps/host/app/[[...url]]/page.tsx`;
  - preserve language-prefix handling;
  - preserve `/admin` routing behavior;
  - preserve public page lookup by URL through the host page model;
  - preserve metadata generation and `notFound` behavior for missing pages.
- Reuse the existing SPS module/frontend contracts instead of bypassing them:
  - shared SDK access patterns;
  - host page/layout/widget rendering flow;
  - the current server/client component split where data-fetching is hidden behind shared component APIs.
- Explicitly cover the high-risk rendering path that previously surfaced problems during the Next.js work:
  - host layouts/pages/widgets;
  - external module widget rendering through `widgets-to-external-widgets`.
- This issue is directly related to issue `#162` and should use these artifacts as required context:
  - `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`
  - `thoughts/shared/processes/singlepagestartup/ISSUE-162.md`
  - `thoughts/shared/retrospectives/singlepagestartup/ISSUE-162/2026-04-19_02-56-44.md`
- The local `deep-research-report.md` concluded that Waku is the closest architectural fit for SPS because it preserves React server/client composition and programmatic routing while avoiding the current Next.js/Turbopack constraints. If Waku exposes blocking limitations during the spike, capture them explicitly and treat Vike as the fallback comparison candidate rather than silently expanding scope.
- The user has already attempted to get a properly working project on the current Next.js line and was not able to reach a stable result. This issue exists to test a concrete alternative path, not to reopen the same migration effort under a different title.

## Implementation Notes

- Keep the Waku spike isolated from `apps/host`. Shared code extraction is allowed when necessary, but the spike should remain a separate app with its own startup/build flow.
- Prefer naming and structure that make the intent obvious, for example `apps/waku-host`, unless the implementation phase finds a better repo-consistent name.
- Define a minimum parity slice up front and treat it as required acceptance scope:
  - frontend dev startup works;
  - production build works;
  - production start works;
  - a representative public page resolves by database-driven URL;
  - `/admin` routing still works;
  - at least one external widget path renders through `widgets-to-external-widgets`.
- Do not shortcut around SPS architecture. The spike should prove whether the existing host model can run on Waku with limited adaptation, not whether a simplified demo can be made to render.
- Record any framework mismatches explicitly:
  - routing gaps;
  - server/client boundary limitations;
  - metadata/SEO differences;
  - build/start/runtime instability;
  - integration friction with Nx or the current app structure.
- The implementation phase should end with a runnable comparison artifact describing:
  - what behavior already matches `apps/host`;
  - what still differs;
  - which changes would be required for broader adoption;
  - whether Waku is viable enough to continue beyond the spike.
