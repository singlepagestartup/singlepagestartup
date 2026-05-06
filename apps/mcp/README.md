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

## Connect Codex

Codex loads the project-local server from `.codex/config.toml`:

```toml
[mcp_servers.singlepagestartup]
url = "http://127.0.0.1:3001/mcp"
env_http_headers = { "X-RBAC-SECRET-KEY" = "RBAC_SECRET_KEY" }
```

This keeps the config portable across cloned projects. It does not write username-specific `[projects."/Users/..."]` entries to `~/.codex/config.toml`, and it does not store the secret value.

Start Codex from an environment that has `RBAC_SECRET_KEY`:

```bash
RBAC_SECRET_KEY="<secret>" codex
```

Verify the repository config:

```bash
npm run mcp:codex:add:http
```

Expected output includes:

```text
name: singlepagestartup
url: http://127.0.0.1:3001/mcp
env_http_headers: X-RBAC-SECRET-KEY=RBAC_SECRET_KEY
```

The MCP server name should match the GitHub repository name. For this repository, that name is `singlepagestartup`.

If Codex Desktop is launched only through the app UI and cannot read environment variables, configure `X-RBAC-SECRET-KEY` as a local MCP header in the app UI. That stores the secret in local user/app config, not in repository files. If the app clears the value on restart, use an environment-aware launch or implement MCP OAuth/auth instead of committing a static secret.

## Connect Claude Code

Claude Code loads the project-local server from `.mcp.json`:

```json
{
  "mcpServers": {
    "singlepagestartup": {
      "type": "http",
      "url": "${MCP_URL:-http://127.0.0.1:3001/mcp}",
      "headers": {
        "X-RBAC-SECRET-KEY": "${RBAC_SECRET_KEY}"
      }
    }
  }
}
```

Start Claude Code from an environment that has `RBAC_SECRET_KEY`:

```bash
RBAC_SECRET_KEY="<secret>" claude
```

Override the MCP URL for a deployed HTTP server without editing repository files:

```bash
MCP_URL="https://mcp.example.com/mcp" RBAC_SECRET_KEY="<secret>" claude
```

Use `/mcp` inside Claude Code to inspect the connected server.

Claude Desktop and Claude.ai remote connectors cannot reach `127.0.0.1` on your machine. Use Claude Code for local HTTP MCP, or expose the MCP server through HTTPS for remote connectors.

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

Use that URL in Codex by updating the project-local `.codex/config.toml` URL for that deployment, or use Claude Code with `MCP_URL`:

```bash
MCP_URL="https://mcp.example.com/mcp" RBAC_SECRET_KEY="<secret>" claude
```

The aggregate command is:

```bash
npm run mcp:codex:add
```

It currently verifies the SPS HTTP MCP project config and is the entry point to extend when more repository MCP servers need automatic setup.

## Authentication

MCP does not read `RBAC_SECRET_KEY` from `apps/mcp/.env` for content/API access. Pass auth with each MCP request:

- `Authorization: Bearer <jwt>` using the same JWT as the frontend `rbac.subject.jwt` cookie.
- `X-RBAC-SECRET-KEY: <secret>` for root/service access in clients that support custom headers.
- Cookies `rbac.subject.jwt` or `rbac.secret-key` when the transport forwards frontend cookies.
- Tool input schemas do not expose direct auth fields; pass auth through the MCP transport instead.

Resources do not have input fields, so protected resource reads need auth from HTTP headers, cookies, MCP auth info, or request metadata.

## Stdio Compatibility

The stdio server is still available for clients that launch the MCP process directly:

```bash
npm run mcp:dev
```

Prefer Streamable HTTP for Codex, Claude Code, and Inspector workflows that need auth headers.
