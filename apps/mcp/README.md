# SPS MCP Server

`apps/mcp` exposes SPS documentation and content-management tools over MCP. Content reads and writes go through the same API/SDK path as the application, so the API must be running and MCP requests must provide the same auth accepted by `apps/api`.

## Start Locally

Start infrastructure and the API:

```bash
./up.sh
npm run api:dev
```

Start the Streamable HTTP MCP server:

```bash
npm run mcp:http
```

The default endpoint is:

```text
http://127.0.0.1:3001/mcp
```

`http://127.0.0.1:3001/sse` is also available as a compatibility endpoint.

## Connect Codex CLI or Environment-Aware Desktop

Register the MCP server in Codex with the repository script:

```bash
export RBAC_SECRET_KEY="<secret>"
npm run mcp:codex:add:http
```

This writes a user-level Codex MCP config for `sps-mcp` using Streamable HTTP. It stores only the mapping `X-RBAC-SECRET-KEY=RBAC_SECRET_KEY`; it does not store the secret value.

Verify the registration:

```bash
codex mcp get sps-mcp
```

Expected output includes:

```text
transport: streamable_http
url: http://127.0.0.1:3001/mcp
env_http_headers: X-RBAC-SECRET-KEY=RBAC_SECRET_KEY
```

When using Codex CLI, start Codex from an environment that has `RBAC_SECRET_KEY`:

```bash
RBAC_SECRET_KEY="<secret>" codex
```

When using Codex Desktop with environment variables, the app process must also have access to `RBAC_SECRET_KEY`. On macOS, set it with `launchctl setenv RBAC_SECRET_KEY "<secret>"`, then fully quit and reopen Codex Desktop.

## Connect Codex Desktop Without Environment Variables

If Codex Desktop is launched from the app UI and cannot read shell environment variables, configure the MCP server manually in the app:

- URL: `http://127.0.0.1:3001/mcp`
- Bearer token env var: empty
- Headers: `X-RBAC-SECRET-KEY` = `<secret>`
- Headers from environment variables: empty

This stores the secret in the user-level Codex config, not in repository files. Do not rerun `npm run mcp:codex:add:http` after manual header setup unless you want to switch back to the `RBAC_SECRET_KEY` environment-variable mapping.

## Connect MCP Inspector

Start Inspector:

```bash
npm run mcp:inspector:http
```

Use these settings:

- Transport Type: `Streamable HTTP`
- URL: `http://127.0.0.1:3001/mcp`
- Connection Type: `Via Proxy`
- Custom Headers: `Authorization: Bearer <jwt>` or `X-RBAC-SECRET-KEY: <secret>`

Use HTTP Inspector when testing protected resources. The stdio Inspector command cannot forward `Custom Headers` to MCP resource/tool handlers.

## Connect a Remote MCP Server

On the application server, run the HTTP MCP process with a host/port reachable by your reverse proxy:

```bash
MCP_HTTP_HOST=0.0.0.0 MCP_HTTP_PORT=3001 npm run mcp:http
```

Expose it through HTTPS, for example:

```text
https://mcp.example.com/mcp
```

Register that URL in Codex:

```bash
MCP_URL="https://mcp.example.com/mcp" npm run mcp:codex:add:http
```

The aggregate command is:

```bash
npm run mcp:codex:add
```

It currently registers the SPS HTTP MCP server and is the entry point to extend when more repository MCP servers need automatic setup.

## Authentication

MCP does not read `RBAC_SECRET_KEY` from `apps/mcp/.env` for content/API access. Pass auth with each MCP request:

- `Authorization: Bearer <jwt>` using the same JWT as the frontend `rbac.subject.jwt` cookie.
- `X-RBAC-SECRET-KEY: <secret>` for root/service access in clients that support custom headers.
- Cookies `rbac.subject.jwt` or `rbac.secret-key` when the transport forwards frontend cookies.
- Generic content-management tool input, for example `"auth": { "jwt": "..." }` or `"auth": { "rbacSecretKey": "..." }`.

Resources do not have input fields, so protected resource reads need auth from HTTP headers, cookies, MCP auth info, or request metadata.

## Stdio Compatibility

The stdio server is still available for clients that launch the MCP process directly:

```bash
npm run mcp:dev
```

The repository `.mcp.json` also points at the stdio entrypoint. Prefer Streamable HTTP for Codex and Inspector workflows that need auth headers.
