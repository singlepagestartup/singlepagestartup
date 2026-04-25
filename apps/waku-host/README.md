# Waku Host Parity Spike

This app is the standalone Waku evaluation surface for issue `#163`. It keeps `apps/host` intact and reuses the SPS host page SDK/model/relation tree through a Waku-specific shell plus a narrow `next/*` compatibility layer.

## Commands

- `npm run waku-host:dev`
- `npm run waku-host:build`
- `npm run waku-host:start`

## Node Version

The current Waku docs list this Node requirement for the CLI/runtime: `^24.0.0 || ^22.12.0 || ^20.19.0`.

- `npm run waku-host:dev` should be run under Node `24.x`, `22.12+`, or `20.19+`.
- The installed `waku` package metadata in `node_modules` may still report an older `engines.node` range, so the repo wrapper follows the docs requirement instead of that stale value.
- The dev script fails fast only when Node is below the documented Waku range; `WAKU_ALLOW_UNSUPPORTED_NODE=1` bypasses the check.

For direct Nx runs during verification, the reliable commands were:

- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run waku-host:build`
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run waku-host:start`

## Verified In This Turn

- `apps/waku-host` builds successfully as a standalone app without changing `apps/host`.
- Production start succeeds and serves on `http://localhost:3001/`.
- `/` normalizes to the default language shell (`/en`).
- `/admin` normalizes to `/en/admin`.
- `/en/admin` renders the reused admin shell instead of falling back into public page lookup.
- `/en` and `/ru` render the shared host shell and current not-found fallback when live page data is unavailable.

## Important Compatibility Shims

- Local aliases for `next/link`, `next/navigation`, `next/headers`, `next/image`, `next/script`, `next/constants`, and `next/types` let the existing SPS component tree run on Waku without rewriting module code.
- `waku.config.ts` includes a post-build compatibility step for Waku `0.21.x` so emitted `.mjs` entries can still satisfy the runtime paths that expected `.js`.
- The app reuses `apps/host/public` so existing asset paths continue to resolve.
- Backend repository `dataDirectory` exports were made ESM-safe with `new URL("./data", import.meta.url).pathname`, which was required because the Waku render path imported repository barrels that previously depended on `__dirname`.

## Known Gaps

- `npm run lint` was not run for this spike.
- `npm run waku-host:dev` was not verified in this turn.
- A representative API-backed public page was not proven yet, so page -> layout -> widget ordering and `widgets-to-external-widgets` parity are still unverified with real data.
- Missing-page behavior is only partially proven: the shell and fallback render, but the `/404` database lookup path was not validated end-to-end.
- URL normalization is implemented in the route layer plus client redirect helper, not in middleware.

## Recommendation

Waku is viable enough for follow-on startup and routing evaluation because the standalone app now builds, starts, normalizes language-prefixed routes, and renders the reused admin shell. It is not ready to replace `apps/host` or claim full parity until a follow-up pass proves a real API-backed public page and at least one external-widget render path.
