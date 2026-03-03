# Drafts Runtime and Manifest Init Handoff

Date: 2026-03-02  
Workspace: `singlepagestartup/sps-lite`  
Scope: `apps/drafts` tooling and workflow

## 1) Why this work was done

The user requested a practical way to run draft prototypes from `apps/drafts` where each incoming example may include:

1. Plain HTML/JS/CSS prototypes.
2. React/Next prototypes with their own local app setup.
3. Potentially nested folders (double nesting and beyond).

The user goal was to quickly preview templates before integration work, using simple commands and draft selection variables, without coupling to production apps.

## 2) What the user explicitly asked for (and why it matters)

The user asked for all of the following, in sequence:

1. A unified launch system for draft apps where HTML and React/Next can be run independently.
2. Support for nested draft directories under `incoming` (for grouped archives/examples).
3. Simple commands, including variable-driven selection of which draft to run.
4. Migration from `.mjs` scripts to Bun + TypeScript.
5. Better runtime behavior for static HTML assets (`/app.js` should resolve correctly).
6. Automatic local dependency install for draft apps with `package.json` (inside draft dir, not whole monorepo).
7. Automatic `manifest.json` generation for new draft folders.
8. Documentation that clearly states the simple HTML + CSS (+ JS) flow.

Why this matters:

1. Keeps drafts isolated from production runtime.
2. Reduces manual setup friction when evaluating many prototype folders.
3. Standardizes onboarding for new incoming drafts.

## 3) Final result

Implemented a complete drafts workflow with these commands:

1. `npm run drafts:init -- <draft-path>`: generate `manifest.json` from folder content.
2. `npm run drafts:list`: discover and list drafts recursively.
3. `npm run drafts:validate`: validate manifests and runtime assumptions.
4. `npm run drafts:dev -- <draft-id-or-path>`: run selected draft.

Key behavior:

1. Recursive manifest discovery supports nested folders.
2. HTML drafts are served by built-in static server.
3. React/Next drafts run their own dev commands from manifest.
4. Missing draft `node_modules` triggers local auto-install (`bun install`) by default.

## 4) Architecture and behavior details

### 4.1 Discovery model

File: `tools/drafts/lib/discovery.ts`

1. Recursively scans `apps/drafts/incoming`, `approved`, `archived`, `examples`.
2. Collects every `manifest.json` regardless of nesting depth.
3. Normalizes draft references for CLI usage.

### 4.2 Runtime command (`drafts:dev`)

File: `tools/drafts/dev.ts`

Draft resolution:

1. Accepts id, slug, or full relative path.
2. Supports filters by `status` and `type`.

HTML runtime:

1. Serves manifest `entry` at `/`.
2. Resolves static files from draft root.
3. Includes fallback resolution relative to `entry` directory (fix for `/app.js` when entry is under `src/`).

React/Next runtime:

1. Uses `run.dev` if provided; otherwise fallback to `npm run dev`.
2. Uses `run.cwd` (default `.`).
3. If `package.json` exists but `node_modules` is missing, auto-runs install command:
   - `run.install` if provided.
   - otherwise `bun install`.
4. Auto-install can be disabled with `run.autoInstall: false`.

### 4.3 Manifest validator (`drafts:validate`)

File: `tools/drafts/validate-manifests.ts`

Validates:

1. Required fields.
2. `type`, `status`, `entry` types.
3. `status` consistency with folder collection.
4. `entry` file existence.
5. `run` fields: `dev`, `install`, `autoInstall`, `cwd`, `port`, `host`.
6. React/Next run prerequisites (`run.dev` or `package.json` in expected cwd).

### 4.4 Manifest initializer (`drafts:init`)

File: `tools/drafts/init.ts`

Auto-detects:

1. Type:
   - `next` if `next` dependency or next-like dev script.
   - `react` if react deps/package exists.
   - `html` for static-only folders with HTML entry candidates.
2. Entry:
   - HTML: `index.html`, `src/index.html`, `public/index.html`.
   - React: html candidates or `package.json`.
   - Next: `src/app/page.tsx`, `app/page.tsx`, `pages/index.*`, or `package.json`.
3. Status from folder (`incoming|approved|archived`), with override support.
4. ID and title from folder slug unless overridden.

For React/Next it also writes default `run` config:

1. `install: "bun install"`
2. `autoInstall: true`
3. `dev: "bun run dev"`
4. `cwd: "."`
5. `host: "127.0.0.1"`

## 5) Manifest contract updates

File: `apps/drafts/manifest.schema.json`

Extended `run` object now supports:

1. `dev` (string)
2. `install` (string)
3. `autoInstall` (boolean)
4. `cwd` (string)
5. `port` (integer)
6. `host` (string)

## 6) Wiring in Nx and npm scripts

Files:

1. `project.json`
2. `package.json`

Added targets/scripts:

1. `drafts:list`
2. `drafts:dev`
3. `drafts:init`
4. `drafts:validate`

All runtime scripts use Bun + TypeScript via Nx run-commands.

## 7) Documentation updates

File: `apps/drafts/README.md`

Added/updated:

1. Command list including `drafts:init`.
2. `run` contract including install and auto-install behavior.
3. Explicit "Quick Start For Simple HTML + CSS (+ JS)" section.

## 8) Example usage

### 8.1 Minimal static draft (HTML + CSS + optional JS)

Folder example:

1. `apps/drafts/incoming/my-html-draft/index.html`
2. `apps/drafts/incoming/my-html-draft/styles.css`
3. `apps/drafts/incoming/my-html-draft/app.js` (optional)

Commands:

1. `npm run drafts:init -- incoming/my-html-draft`
2. `npm run drafts:validate`
3. `npm run drafts:dev -- my-html-draft`

### 8.2 React/Next draft with local deps

Folder example:

1. `apps/drafts/incoming/admin-v2/package.json`
2. source files for app runtime

Manifest can contain:

```json
{
  "run": {
    "cwd": ".",
    "install": "bun install",
    "autoInstall": true,
    "dev": "bun run dev -- --host 127.0.0.1 --port 5173",
    "port": 5173,
    "host": "127.0.0.1"
  }
}
```

Run:

1. `npm run drafts:dev -- admin-v2`

If local `node_modules` is absent, dependencies are installed in that draft directory first.

## 9) User-driven decision log (important)

This section records exactly how user feedback shaped implementation:

1. Initial request required independent runnable HTML and React templates with nested-folder support, so recursive discovery + runtime resolver were introduced.
2. User asked to use Bun/TypeScript instead of `.mjs`, so tooling was migrated from Node `.mjs` to Bun `.ts`.
3. User reported `GET /app.js 404`, so static server resolution was fixed to include entry-dir fallback.
4. User asked for auto dependency setup per draft (not global project), so auto-install in draft cwd was added.
5. User asked "who creates manifest for simple html/css/js", so `drafts:init` was built.
6. User asked to document simple HTML+CSS flow specifically, so README now has dedicated quick-start steps.

## 10) Current known limitation

`bun install` auto-run requires filesystem/temp/network permissions in runtime environment. In restricted sandboxes it can fail, but the flow and messaging are now explicit, and local execution on developer machine works as intended.

## 11) Files involved

Core scripts:

1. `tools/drafts/lib/discovery.ts`
2. `tools/drafts/list.ts`
3. `tools/drafts/dev.ts`
4. `tools/drafts/init.ts`
5. `tools/drafts/validate-manifests.ts`

Config/docs:

1. `project.json`
2. `package.json`
3. `apps/drafts/manifest.schema.json`
4. `apps/drafts/README.md`
5. `apps/drafts/incoming/admin-v2/manifest.json`
