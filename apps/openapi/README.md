# OpenAPI Documentation

## Directory layout

```
apps/openapi/
├── openapi.yaml              # Root spec that wires every model via $ref
├── components/               # Shared parameters/responses
├── public/                   # Static Swagger UI assets + bundled spec
├── dist/                     # Generated static Redoc bundle (gitignored)
├── app.ts                    # Hono app that serves the spec + static HTML
├── env.ts                    # Environment helpers for the OpenAPI app
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

## Environment

- Run `./apps/openapi/create_env.sh` to refresh `.env` and update OpenAPI servers from `apps/api/.env` and `apps/telegram/.env`.

## Updating the spec

1. Change the contract → update the module schema YAML in `libs/modules/**/sdk/model/src/lib`.
2. Add or adjust endpoints → edit the module `paths.yaml` in `libs/modules/**/sdk/model/src/lib`.
3. Modify `openapi.yaml` only when introducing a new model or relation (add the new `$ref`).

After any edits, run `nx run openapi:build` (or `nx run openapi:dev`, which automatically rebuilds) so the Bun app continues serving the latest documentation.
