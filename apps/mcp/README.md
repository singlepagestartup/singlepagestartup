# SPS MCP Server

`apps/mcp` exposes one compact SPS content surface to MCP clients. It supports local stdio and remote Streamable HTTP.

The public toolset is intentionally small for AI chat clients:

- `module-list`
- `model-schema`
- `relation-schema`
- `model-record-count`, `model-record-find`, `model-record-get`, `model-record-create`, `model-record-update`, `model-record-delete-preview`, `model-record-delete-apply`
- `relation-record-count`, `relation-record-find`, `relation-record-get`, `relation-record-create`, `relation-record-update`, `relation-record-delete-preview`, `relation-record-delete-apply`
- `page-preview`, `page-localized-field-update`

Generated per-model/per-relation CRUD tools are not part of `apps/mcp`. Select records with explicit selectors such as `{ "module": "blog", "model": "article" }` or `{ "module": "blog", "relation": "categories-to-articles" }`.

## File Uploads

Use the same compact `model-record-create` tool for files. For `file-storage.file`, MCP supports two upload forms:

Public URL:

```json
{
  "module": "file-storage",
  "model": "file",
  "dryRun": false,
  "data": {
    "url": "https://example.com/cover.webp",
    "adminTitle": "Cover image",
    "alt": "Cover image description"
  }
}
```

Generated/local client file as base64:

```json
{
  "module": "file-storage",
  "model": "file",
  "dryRun": false,
  "data": {
    "fileName": "cover.webp",
    "mimeType": "image/webp",
    "contentBase64": "<base64-without-data-url-prefix>",
    "adminTitle": "Cover image",
    "alt": "Cover image description"
  }
}
```

Do not pass ChatGPT/Claude sandbox paths such as `/mnt/data/cover.webp`; the SPS server cannot read files from the model provider's container. Encode the generated file as base64 or provide a publicly reachable URL.

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
MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK=true RBAC_SECRET_KEY=<secret> npm run mcp:http
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

## Codex Client Setup

Codex uses its own MCP configuration. Project `.mcp.json` is not enough for Codex Desktop/CLI to show this server in active MCP settings.

Print repo-derived Codex and Claude setup commands:

```bash
tools/mcp/setup-project-mcp.sh
```

To apply client configuration from the helper, pass a real production URL:

```bash
tools/mcp/setup-project-mcp.sh --remote-url "https://mcp.<domain>/mcp" --apply-codex
```

Register the local Streamable HTTP server:

```bash
REPO_NAME=$(.claude/helpers/get_repo_name.sh)
codex mcp add "${REPO_NAME}-local" --url http://127.0.0.1:3001/mcp
codex mcp login "${REPO_NAME}-local" --scopes mcp:content
```

Register the deployed remote server:

```bash
REPO_NAME=$(.claude/helpers/get_repo_name.sh)
codex mcp add "${REPO_NAME}-production" --url "https://mcp.<domain>/mcp"
codex mcp login "${REPO_NAME}-production" --scopes mcp:content
```

Check active Codex MCP servers:

```bash
codex mcp list
```

Restart Codex Desktop or open a new session after adding or logging in to a server so the tool list is reloaded.

## Claude Client Setup

Claude UI and Claude Code use different MCP setup paths.

For Claude UI / Claude Desktop remote connectors, add a custom connector:

1. Open `Customize -> Connectors`.
2. Click `+` and choose `Add custom connector`.
3. Use name `<repo-name>-production`, for example `singlepagestartup-production`.
4. Use URL `https://mcp.<domain>/mcp`.
5. Leave advanced OAuth Client ID/Secret empty.
6. Click `Add`, then `Connect`, and sign in with SPS email/password.
7. Enable the connector in a chat via `+ -> Connectors`.

Remote connectors are reached from Anthropic cloud infrastructure, so `http://127.0.0.1:3001/mcp` does not work for Claude UI. Use the public HTTPS endpoint.

For Claude Code CLI with the deployed remote server:

```bash
REPO_NAME=$(.claude/helpers/get_repo_name.sh)
claude mcp add --transport http "${REPO_NAME}-production" "https://mcp.<domain>/mcp"
```

For Claude Code CLI with the local server:

```bash
REPO_NAME=$(.claude/helpers/get_repo_name.sh)
claude mcp add --transport http "${REPO_NAME}-local" http://127.0.0.1:3001/mcp
```

`claude mcp add` only registers the server. Start Claude Code, run `/mcp`, select the server, and authenticate there. Claude should open the OAuth login page; if it does not, open the URL it prints manually.

This repository's project `.mcp.json` intentionally keeps `<repo-name>` as the local SinglePageStartup MCP. Use `<repo-name>-production` for the deployed connector to avoid name and precedence conflicts.

To apply Claude Code configuration from the helper, pass a real production URL:

```bash
tools/mcp/setup-project-mcp.sh --remote-url "https://mcp.<domain>/mcp" --apply-claude
```

## Remote Connector

Deployed remote MCP is served as:

```text
https://mcp.<domain>/mcp
```

Use that URL as the remote MCP connector URL in ChatGPT or Claude. Production auth is OAuth/Bearer: the connector opens `/oauth/authorize`, the user signs in with their SinglePageStartup email/password, and MCP issues an MCP-bound access token. MCP tools then call `apps/api` with the authenticated caller's `rbac.subject` authentication JWT.

Public metadata endpoints:

```text
https://mcp.<domain>/.well-known/oauth-protected-resource
https://mcp.<domain>/.well-known/oauth-protected-resource/mcp
https://mcp.<domain>/.well-known/oauth-authorization-server
https://mcp.<domain>/.well-known/oauth-authorization-server/mcp
```

The `/mcp` suffix variants are intentionally supported for clients that resolve OAuth metadata for the exact protected resource URL.

## Internal rbac.subject Token Exchange

`apps.api` exchanges a server-signed `rbac.subject` authentication JWT inside
the MCP process so the resulting MCP bearer maps back to the same `rbac.subject`
identity in the existing access-token store:

```text
POST /internal/rbac-subject-token-exchange
X-MCP-Internal-Token-Exchange-Secret: <MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET>
Content-Type: application/json

{"subject_token":"<rbac.subject authentication JWT>"}
```

The endpoint verifies `subject_token` with `RBAC_JWT_SECRET` and derives the
`rbac.subject` only from `subject.id` in the verified payload. Requests
containing a separate `subject`, `subjectId`, `subject_id`, `rbacSubjectId`, or
`rbac_subject_id` are rejected.

A successful exchange returns an access-only bearer with:

- client id `internal-rbac-subject`;
- scope `mcp:content`;
- a fixed five-minute lifetime;
- no refresh token.

Configure the same dedicated `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET` in `apps.api`
and `apps.mcp`. Do not reuse `RBAC_SECRET_KEY`, do not send
`X-RBAC-SECRET-KEY`, and do not expose this internal endpoint to browser clients.
External authorization-code, PKCE, refresh-token, revoke, and connector flows
remain unchanged. Configure `MCP_SERVICE_URL` in `apps.api` with the Streamable
HTTP resource URL (`http://127.0.0.1:3001/mcp` locally or
`http://mcp:3001/mcp` on the default deployment network).

`MCP_SERVICE_HTTP_HOST` and `MCP_SERVICE_HTTP_PORT` are bind settings for the
MCP process itself; `0.0.0.0` is valid there but is not a client destination.
`MCP_SERVICE_PUBLIC_BASE_URL` and `MCP_SERVICE_PUBLIC_URL` describe the external
HTTPS/OAuth address. Keep `MCP_SERVICE_URL` separate so `apps.api` can use the
correct internal service-to-service address in every environment.

## Deployment

Configure `tools/deployer/.env`:

```env
MCP_SERVICE_NAME=mcp
MCP_SERVICE_SUBDOMAIN=mcp
MCP_SERVICE_DOCKER_HUB_REPOSITORY_NAME=
MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK=false
MCP_SERVICE_ALLOWED_ORIGINS=
MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET=
MCP_SERVICE_URL=http://mcp:3001/mcp
MCP_SERVICE_OAUTH_JWT_SECRET=
MCP_SERVICE_OAUTH_AUTH_CODE_TTL_SECONDS=300
MCP_SERVICE_OAUTH_ACCESS_TOKEN_TTL_SECONDS=3600
MCP_SERVICE_OAUTH_REFRESH_TOKEN_TTL_SECONDS=2592000
```

`MCP_SERVICE_DOCKER_HUB_REPOSITORY_NAME` falls back to `API_SERVICE_DOCKER_HUB_REPOSITORY_NAME` when empty. Leave `MCP_SERVICE_ALLOWED_ORIGINS` empty to allow every Origin; OAuth/Bearer still protects data access. Redis is used for OAuth clients, codes, access-token mappings, and refresh tokens.

Deploy or remove only the MCP service:

```bash
cd tools/deployer
./mcp.sh up
./mcp.sh down
```

The full deployer runs MCP after `api` and before `telegram`/`host`.
