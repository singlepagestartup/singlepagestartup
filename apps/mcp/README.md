# SPS MCP Server

`apps/mcp` exposes SPS module resources and tools to MCP clients. It supports local stdio and remote Streamable HTTP.

## Local Development

Run stdio for local MCP clients that launch the process:

```bash
npm run mcp:start
```

Run Streamable HTTP locally:

```bash
npm run mcp:http
```

Local HTTP defaults to `http://127.0.0.1:3001/mcp`. For Inspector/debugging with the static RBAC fallback:

```bash
MCP_ALLOW_RBAC_SECRET_FALLBACK=true RBAC_SECRET_KEY=<secret> npm run mcp:http
```

Then pass `X-RBAC-SECRET-KEY: <secret>` in the MCP client headers. This fallback is for local/private debugging only.

To test the OAuth/Bearer flow locally without console commands, start `npm run mcp:http` and open:

```text
http://127.0.0.1:3001/authentication/oauth
```

The page registers a local OAuth client, generates PKCE, redirects to the MCP login page, exchanges the authorization code for an MCP access token, and can run an MCP `initialize` smoke test with `Authorization: Bearer ...`.

For MCP Inspector with Streamable HTTP OAuth:

```bash
npx @modelcontextprotocol/inspector
```

Select `Streamable HTTP`, set URL to `http://127.0.0.1:3001/mcp`, keep custom auth headers empty, and reconnect. Inspector should open `/oauth/authorize`, store the MCP access token, and attach `Authorization: Bearer ...` automatically on the next connection attempt.

If Inspector keeps reconnecting without `Authorization`, clear the Inspector browser session storage or restart Inspector. It caches OAuth clients and tokens by MCP server URL.

## Remote Connector

Deployed remote MCP is served as:

```text
https://mcp.<domain>/mcp
```

Use that URL as the remote MCP connector URL in ChatGPT or Claude. Production auth is OAuth/Bearer: the connector opens `/oauth/authorize`, the user signs in with SPS email/password, and MCP issues an MCP-bound access token. MCP tools then call `apps/api` with the authenticated caller's SPS JWT.

Public metadata endpoints:

```text
https://mcp.<domain>/.well-known/oauth-protected-resource
https://mcp.<domain>/.well-known/oauth-authorization-server
```

## Deployment

Configure `tools/deployer/.env`:

```env
MCP_SERVICE_NAME=mcp
MCP_SERVICE_SUBDOMAIN=mcp
MCP_SERVICE_DOCKER_HUB_REPOSITORY_NAME=
MCP_ALLOW_RBAC_SECRET_FALLBACK=false
MCP_ALLOWED_ORIGINS=
MCP_OAUTH_JWT_SECRET=
MCP_OAUTH_AUTH_CODE_TTL_SECONDS=300
MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS=3600
MCP_OAUTH_REFRESH_TOKEN_TTL_SECONDS=2592000
```

`MCP_SERVICE_DOCKER_HUB_REPOSITORY_NAME` falls back to `API_SERVICE_DOCKER_HUB_REPOSITORY_NAME` when empty. Leave `MCP_ALLOWED_ORIGINS` empty to allow every Origin; OAuth/Bearer still protects data access. Redis is used for OAuth clients, codes, access-token mappings, and refresh tokens.

Deploy or remove only the MCP service:

```bash
cd tools/deployer
./mcp.sh up
./mcp.sh down
```

The full deployer runs MCP after `api` and before `telegram`/`host`.
