# OpenAPI Documentation

## Directory layout

```
apps/openapi/
├── openapi.yaml              # Root spec that wires every model via $ref
├── components/               # Shared parameters/responses
├── models/                   # layout/page/widget/... folders + requests.http
├── .httpyac.json             # Environments for the request collection
├── requests.http             # Top-level collection when you need everything
├── dist/                     # Generated static Redoc bundle (gitignored)
├── app.ts                    # Hono app that serves the spec + static HTML
└── server.ts                 # Bun entrypoint used by Nx targets
```

## Commands

```bash
# Lint the specification
npx @redocly/cli lint ./apps/openapi/openapi.yaml

# Produce dist/index.html (Redoc bundle)
nx run openapi:build

# Build & launch the Bun dev server on http://localhost:4173
nx run openapi:dev

# Run the Bun server without forcing a rebuild
nx run openapi:start
```

- The Bun service listens on `OPENAPI_SERVICE_PORT` (defaults to 4173 via `@sps/shared-utils`).
- In Codespaces, expose port 4173 and open `https://<codespace>-4173.app.github.dev`, or use the VS Code Simple Browser (`Ctrl+Shift+P → Simple Browser → http://127.0.0.1:4173`).
- To view the static HTML without the server, build once and open `file:///workspaces/singlepagestartup/apps/openapi/dist/index.html` via Simple Browser.
- `nx run openapi:build` pulls the Redoc runtime into `dist/redoc.standalone.js`, so hosted docs stay interactive even when external CDNs are blocked; override the source via `REDOC_CDN_URL` if you need a different version.

## HTTP requests

- Every model folder under `models/` has a matching `requests.http` file for httpYac.
- Shared environments (`{{baseUrl}}`, `{{contentType}}`, tokens, etc.) live in `.httpyac.json`.
- Run `./apps/openapi/create_env.sh` to refresh both `.env` and `.httpyac.json`.

## Updating the spec

1. Change the contract → update `models/<model>/schema.yaml`.
2. Add or adjust endpoints → edit `models/<model>/paths.yaml` (each file is already namespaced under `paths:`).
3. Update sample requests → touch the corresponding `models/<model>/requests.http` (or the root `requests.http`).
4. Modify `openapi.yaml` only when introducing a brand-new model folder (add the new `$ref`).

After any edits, run `nx run openapi:build` (or `nx run openapi:dev`, which automatically rebuilds) so the Bun app continues serving the latest documentation.
