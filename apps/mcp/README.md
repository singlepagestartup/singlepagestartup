# SinglePageStartup MCP Server

`apps/mcp` exposes one compact SinglePageStartup content surface to MCP clients. It supports local stdio and remote Streamable HTTP.

The public toolset is intentionally small for AI chat clients:

- `project-guide`
- `content-operations-guide`
- `module-list`
- `model-schema`
- `relation-schema`
- `model-record-count`, `model-record-find`, `model-record-get`, `model-record-create`, `model-record-update`, `model-record-delete-preview`, `model-record-delete-apply`
- `relation-record-count`, `relation-record-find`, `relation-record-get`, `relation-record-create`, `relation-record-update`, `relation-record-delete-preview`, `relation-record-delete-apply`
- `page-preview`

Generated per-model/per-relation CRUD tools are not part of `apps/mcp`. Select records with explicit selectors such as `{ "module": "blog", "model": "article" }` or `{ "module": "blog", "relation": "categories-to-articles" }`.

For the required read, impact-check, dry-run, commit, and verification procedure, see [`USAGE.md`](./USAGE.md).

## AI Guidance Delivery

The MCP server delivers project knowledge without requiring the client to read
the repository filesystem:

- MCP `initialize` returns concise server `instructions` with the project
  boundary, model/relation principles, page graph, source-code boundary, and
  verified mutation protocol.
- `project-guide` and `singlepagestartup://project-guide` return the complete structured
  project architecture, task-routing, content-composition, documentation-order,
  and non-negotiable-rule guide.
- `content-operations-guide` and
  `singlepagestartup://content-operations-guide` return the complete structured
  mutation, ambiguity, read-back, comparison, and reporting contract.
- `solve-singlepagestartup-task` is an MCP prompt that applies both guides to a
  concrete task.
- Every create, update, delete-apply, and localized page update tool repeats the
  critical same-connector, read-back, comparison, and `UNKNOWN` rules in its
  tool description.

Client support varies. A client may ignore MCP server instructions or not expose
resources/prompts to its model. The read-only guide tools and mutation tool
descriptions provide the same critical context through the universally used
MCP tool surface.

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

Do not pass ChatGPT/Claude sandbox paths such as `/mnt/data/cover.webp`; the SinglePageStartup server cannot read files from the model provider's container. Encode the generated file as base64 or provide a publicly reachable URL.

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
npm run mcp:inspector:http
```

The command loads `apps/mcp/inspector.config.json`, so Inspector already
contains the `singlepagestartup` Streamable HTTP server at
`http://127.0.0.1:3001/mcp`. Start `npm run mcp:http` separately before
connecting. Keep custom auth headers empty for OAuth. Inspector should open
`/oauth/authorize`, store the MCP access token, and attach
`Authorization: Bearer ...` automatically on the next connection attempt.

If Inspector keeps reconnecting without `Authorization`, clear the Inspector browser session storage or restart Inspector. It caches OAuth clients and tokens by MCP server URL.

## Generated Project Client Configs

`./create_env.sh` and a successful `tools/deployer/mcp.sh up` generate remote
MCP configuration in the checkout. Generation during ENV creation requires
`MCP_SERVICE_NAME` and `DOMAIN` in `tools/deployer/.env`, or an explicit
`MCP_SERVICE_PUBLIC_URL`. Runtime container ENV creation and `mcp.sh down` do
not generate client files.

For a downstream project such as `m2commerce`, configure its deployer:

```dotenv
GITHUB_REPOSITORY=owner/m2commerce
DOMAIN=m2commerce.ru
MCP_SERVICE_NAME=mcp
MCP_SERVICE_SUBDOMAIN=mcp
MCP_CLIENT_OPENCODE_VERSION=auto
```

The connector is named `m2commerce-production` and points to
`https://mcp.m2commerce.ru/mcp`. Preview deployment uses the deployer's actual
domain and a separate `<repo-name>-preview` connector. A deployment passes its
computed HTTPS endpoint to the generator, so client configuration matches the
service address.

| Client                                                                                  | Project file                                         | Remote server format                                                      |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| [OpenCode V1](https://opencode.ai/docs/mcp-servers/)                                    | `opencode.json` or existing JSONC config             | `mcp.<name>`, `type: remote`, `enabled: true`                             |
| [OpenCode V2](https://opencode.ai/v2/docs/mcp-servers/)                                 | Same file, including an existing `.opencode/` config | `mcp.servers.<name>`, `type: remote`; connects by default                 |
| [Claude Code](https://code.claude.com/docs/en/mcp)                                      | `.mcp.json`                                          | `mcpServers.<name>`, `type: http`                                         |
| [Codex](https://developers.openai.com/codex/mcp/)                                       | `.codex/config.toml`                                 | `[mcp_servers."<name>"]`, `url`; requires a trusted project               |
| [Cursor](https://cursor.com/docs/mcp)                                                   | `.cursor/mcp.json`                                   | `mcpServers.<name>`, `url`                                                |
| [VS Code / Copilot](https://code.visualstudio.com/docs/agent-customization/mcp-servers) | `.vscode/mcp.json`                                   | `servers.<name>`, `type: http`; current Copilot also supports `.mcp.json` |

`auto` retains the format of an existing OpenCode MCP configuration. For a new
config it detects `opencode --version`, falling back to V2 when detection is
unavailable. Set `MCP_CLIENT_OPENCODE_VERSION=1` or `2` to choose the format for
a new file. An existing config with a different format requires migration
before applying that override; the generator does not migrate other OpenCode
settings.

The client generator runs on Bun and uses its built-in TOML parser without
additional npm dependencies. The project dependency and CI use Bun 1.3.6. The
launcher disables automatic `.env` loading; only the existing process variables
and selected deployer file determine client settings.

Regenerate the files without deploying:

```bash
npm run mcp:clients:generate
```

Or supply the endpoint explicitly:

```bash
npm run mcp:clients:generate -- --remote-url https://mcp.m2commerce.ru/mcp
```

The URL resolution order is `--remote-url`, process `MCP_SERVICE_PUBLIC_URL`,
deployer `MCP_SERVICE_PUBLIC_URL`, then the deployer's subdomain and domain.
`MCP_SERVICE_URL` is the internal API-to-MCP address and is not a client URL.
The generator prints setup commands when run without `--write-clients`.

Generation preserves other servers, client settings, and comments outside the
updated server entry. JSON client entries with the generated name are replaced;
Codex updates that server's URL. Invalid configuration aborts generation before
any client file is written. Repeat runs with the same inputs leave the files
unchanged. Generated remote entries contain public URLs and OAuth settings,
without RBAC secrets or bearer tokens.

`mcp.sh up` validates generation with `--check-clients` before DNS changes,
image pulls, or MCP playbooks. It writes the configs after deployment succeeds.

Authenticate from the project root after generation:

```bash
opencode mcp auth m2commerce-production
codex mcp login m2commerce-production --scopes mcp:content
```

Claude Code uses `/mcp`; Cursor and VS Code use their MCP settings. Sign in with
the deployed project's account. Generation configures the connection; each
client stores its own OAuth session. ChatGPT and Claude web connectors are
configured in their UI with the same HTTPS URL.

GitHub Actions exports an `mcp-client-configs` artifact after successful MCP
deployment. It contains only the generated public connector entries and uses
the source project's OpenCode format. It does not include existing client
credentials or change repository files remotely. To generate the merged files
in a developer checkout, run `npm run mcp:clients:generate` there. The
`MCP_CLIENT_CONFIG_OUTPUT_DIR` environment variable or `--output-dir` option
selects an export directory instead of the checkout.

Validate the generator and bootstrap/deployment hooks with:

```bash
npm run mcp:clients:test
```

## Codex Client Setup

Codex uses `.codex/config.toml` in a trusted project. The generated remote entry
is ready for `codex mcp login`; `.mcp.json` alone does not configure Codex.
The commands below also support manual registration through the client's CLI.

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
6. Click `Add`, then `Connect`, and sign in with SinglePageStartup email/password.
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

Generation adds `<repo-name>-production` to `.mcp.json` and preserves local
entries. The legacy `--write-project` option adds a local stdio entry named
`<repo-name>`; it does not configure the other clients.

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
