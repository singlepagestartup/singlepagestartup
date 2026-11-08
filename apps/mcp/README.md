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

## Page preview scope

`page-preview` finds content records by URL through Host Page → Pages-to-Widgets
→ Host Widget → Widgets-to-External-Widgets → the linked module's Widget.
It forwards caller authorization through the SDKs and returns candidates with
their record and relation IDs. It performs no writes. Target text or an explicit
Widget ID filters the candidates; several matches remain ambiguous.

For a module Widget with `widgets-to-website-builder-module-widgets`, the preview
also includes its linked Website Builder content Widgets, in relation order.
This is one additional composition edge. The preview does not recursively
enumerate every relation in every module. Other registered associations,
including CRM and Social relations, use `relation-schema` and
`relation-record-*` with explicit module/relation selectors.

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

A base64 upload travels inside the tool call, so the whole call has to fit in `MCP_SERVICE_HTTP_MAX_BODY_BYTES` (4 MiB by default). Larger files need a public URL or a higher limit.

## Local Development

Run stdio for local MCP clients that launch the process:

```bash
npm run mcp:start
```

Run Streamable HTTP locally:

```bash
npm run mcp:http
```

Local HTTP defaults to `http://127.0.0.1:3001/mcp`. `npm run mcp:http` loads `apps/api/.env` outside production, which is where a local process gets `RBAC_SECRET_KEY` for the fallback. For Inspector/debugging with the static RBAC fallback:

```bash
MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK=true RBAC_SECRET_KEY=<secret> npm run mcp:http
```

Then pass `X-RBAC-SECRET-KEY: <secret>` in the MCP client headers. This fallback is for local/private debugging only.

To test the OAuth/Bearer flow locally without console commands, start `npm run mcp:http` and open:

```text
http://127.0.0.1:3001/authentication/oauth
```

Opening `http://127.0.0.1:3001/` redirects to this page. `/mcp` remains the authenticated protocol endpoint for MCP clients.

The page registers a local OAuth client, generates PKCE, redirects to the MCP consent and sign-in steps, exchanges the authorization code for an MCP access token, and can run an MCP `initialize` smoke test with `Authorization: Bearer ...`.

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

MCP connections are local checkout settings, excluded from Git. `up.sh` and
`create_env.sh` leave them unchanged. Generate them explicitly with
`npm run mcp:clients:generate -- --client <client>` after configuring the project's deployed endpoint.
The tracked `*.example` files contain shared defaults without server addresses.
For Codex profiles without an MCP connection, copy
`.codex/config.toml.example` to `.codex/config.toml`.

Successful `tools/deployer/mcp.sh up` exports a public connection bundle under
`.artifacts/mcp-client-configs/<client>`, or `MCP_CLIENT_CONFIG_OUTPUT_DIR` when supplied.
It does not edit the active client configs in the checkout.

For a downstream project such as `m2commerce`, configure its deployer:

```dotenv
GITHUB_REPOSITORY=owner/m2commerce
DOMAIN=m2commerce.ru
MCP_SERVICE_NAME=mcp
MCP_SERVICE_SUBDOMAIN=mcp
MCP_CLIENT_OPENCODE_VERSION=auto
```

With `origin` set to the downstream repository `owner/m2commerce`, the
connector is named `m2commerce-production` and points to
`https://mcp.m2commerce.ru/mcp`. Preview deployment uses the deployer's actual
domain and a separate `<repo-name>-preview` connector. A deployment passes its
computed HTTPS endpoint to the generator, so client configuration matches the
service address. Name resolution uses `--repo-name` when supplied, then the
checkout's `origin`. Deployment/process repository settings are a fallback for
exports without a Git checkout. The endpoint remains a separate setting: use
the client's domain, not the framework's server address. When the deployment
repository differs from the resolved checkout name, generation stops before
writing connections. Update the project's deployment settings or pass its
endpoint explicitly with `--remote-url`.

| Client            | Active local file or exported sample                                | Transport format                                                  |
| ----------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Claude Code       | `.mcp.json`                                                         | `mcpServers.<name>`, `type: http`                                 |
| Codex             | `.codex/config.toml`                                                | `[mcp_servers."<name>"]`, `url`                                   |
| Kimi Code 2.x     | `.kimi-code/mcp.json`                                               | `mcpServers.<name>`, `url`; strict JSON                           |
| MiMo Code         | `.mimocode/mimocode.json`, or an existing project JSON/JSONC config | `mcp.<name>`, `type: remote`                                      |
| OpenCode V1 / V2  | Existing `opencode.json[c]` project file                            | V1 `mcp.<name>`; V2 `mcp.servers.<name>`                          |
| Cursor            | `.cursor/mcp.json`                                                  | `mcpServers.<name>`, `url`                                        |
| VS Code / Copilot | `.vscode/mcp.json`                                                  | `servers.<name>`, `type: http`                                    |
| Muse Code         | Exported `muse/settings.json`; merge into user settings             | `schema_version: 1`, `mcpServers.<name>`, `type: streamable-http` |
| DeepSeek Harness  | Exported `deepseek/mcp-client.yaml`; import into a Cordis scope     | `@deepseek-ai/dsh-mcp-client`, `transport: streamable-http`       |

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
npm run mcp:clients:generate -- --client codex
```

Or supply the endpoint explicitly:

```bash
npm run mcp:clients:generate -- --client kimi --remote-url https://mcp.m2commerce.ru/mcp
```

The URL resolution order is `--remote-url`, process `MCP_SERVICE_PUBLIC_URL`,
deployer `MCP_SERVICE_PUBLIC_URL`, then the deployer's subdomain and domain.
`MCP_SERVICE_URL` is the internal API-to-MCP address and is not a client URL.
The generator prints setup commands when run without `--write-clients`.

Omitting `--client` exports separate samples for every supported client; it
never activates all client files in the checkout. `--output-dir` also selects
export-only mode, with one subdirectory per client. `muse` and `deepseek`
always export samples and never edit user settings or Cordis patches.

Generation initializes missing client files from their adjacent `*.example`
when present. Existing client files retain other servers, settings and comments
outside the updated server entry. JSON client entries with the generated name
are replaced; Codex updates that server's URL. Invalid configuration aborts
generation before any client file is written. Repeat runs with the same inputs leave the files
unchanged. Generated remote entries contain public URLs and OAuth settings,
without RBAC secrets or bearer tokens. Generated active files, including all
supported OpenCode JSON/JSONC locations, are ignored; the shared Codex defaults
and empty JSON examples remain tracked. For existing downstream checkouts that
already track these active files, preserve local settings and remove those paths
from the Git index with `git rm --cached -- <path>`. Remove any inherited
framework connection from the local client configuration before authenticating
to the project's own server.

`mcp.sh up` validates generation with `--check-clients` before DNS changes,
image pulls, or MCP playbooks. It exports the bundle after deployment succeeds.

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
deployment. It contains only generated public connector entries. OpenCode bundle format
uses the explicit version setting or installed CLI version, falling back to V2;
exports never parse unrelated active editor configs. It does not include existing client
credentials or change repository files remotely. To generate the merged files
in a developer checkout, run `npm run mcp:clients:generate -- --client <client>` there. The
`MCP_CLIENT_CONFIG_OUTPUT_DIR` environment variable or `--output-dir` option
selects an export directory instead of the checkout.

Validate the generator and bootstrap/deployment hooks with:

```bash
npm run mcp:clients:test
```

## Client compatibility

Checked: 2026-11-02. Configuration support belongs to the agent application,
not the model vendor. These MCP files do not select or pin a model. Model API
credentials, tool-calling support and provider-specific behavior are separate.
There is no claim that every current model has passed a live tool-call test.

- **Anthropic / Claude Code:** requires `type: http` for a URL in `.mcp.json`.
  The installed 2.1.281 CLI recognizes the generated entry as pending project
  approval. Prefer local-scope `claude mcp add --transport http ...` when also
  using Muse in the same checkout. [Claude MCP reference](https://code.claude.com/docs/en/mcp).
- **OpenAI / Codex:** uses TOML rather than `.mcp.json`; project settings require
  workspace trust. TOML output is validated locally. The bundled Codex
  0.166.0-alpha.5.1 MCP listing did not enumerate the isolated project entry;
  native project discovery and live OAuth remain unverified here.
  [Official OpenAI MCP documentation](https://developers.openai.com/codex/mcp/).
- **Moonshot / Kimi Code:** 2.x uses `.kimi-code/mcp.json`, unlike the older
  Python `kimi-cli` setup. The generator emits URL-only HTTP entries and
  refuses comments or trailing commas in this strict JSON file. Native 2.4.1
  completed ACP initialization and opened a session with the generated project
  configuration and an isolated dummy provider; no prompt/model request was
  sent. Workspace trust and `/mcp-config login <name>` are still required for
  authenticated tools. The earlier client incident cannot be attributed to a
  specific cause without its version and error. [Kimi MCP reference](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp).
- **Xiaomi / MiMo Code:** has its own project config and an OpenCode-V1-style
  MCP map, even when OpenCode V2 is installed. Its adapter preserves provider
  settings and JSONC comments; native startup and OAuth were not run.
  [MiMo MCP reference](https://mimo.xiaomi.com/mimocode/mcp-servers).
- **Meta / Muse Code:** a project `.mcp.json` accepts `streamable-http`, while
  Claude requires `http`. Do not copy the Claude sample into a shared Muse
  project. Muse OAuth login currently requires a matching entry in
  `$XDG_CONFIG_HOME/muse/settings.json` (default `~/.config/muse/settings.json`),
  including `schema_version: 1`. Merge the exported sample without replacing
  existing settings, then run `muse mcp login <name> --scope mcp:content`.
  The sample makes the server optional. Native startup/OAuth remain unverified.
  [Muse MCP reference](https://meta-models.github.io/muse-code-sdk/next/guides/extend/mcp-servers/).
- **OpenCode:** the installed 2.0.24 CLI read the generated V2 config through
  `opencode debug config` using an isolated local service. No model request or
  production MCP login was made. [OpenCode MCP reference](https://opencode.ai/v2/docs/mcp-servers/).
- **DeepSeek:** its models can use the chosen host's MCP adapter through
  [documented Claude Code/OpenCode integrations](https://api-docs.deepseek.com/guides/coding_agents/).
  Native DeepSeek Harness instead consumes a Cordis plugin entry. Its sample
  keeps the namespace within 32 allowed characters and uses
  `failOnStartupError: false`. Import it into the intended plugin scope and
  supply project authentication separately; automatic OAuth is not generated
  or verified. [Native Harness reference](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md).

The regression suite checks native output formats, per-client isolation,
strict Kimi JSON, separate Muse/Claude samples, repository-name constraints and
unchanged local client files during bootstrap/deployment. These checks do not
replace an authenticated `initialize`, `tools/list` and read-only tool call
against the project's deployed endpoint in each selected client.

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

## OAuth Scopes and Consent

MCP advertises one OAuth scope, `mcp:content`, for connecting to the project.
Every API operation uses the authenticated subject's RBAC permissions,
including deleting records. There is no separate MCP delete permission. The
delete tools still require their preview and confirmation token.

The authorization page first shows the application name, client id and callback
address. Continue opens the SinglePageStartup sign-in form; Cancel returns
`error=access_denied` and the state to the registered callback. Both pages
refuse to render inside a frame.

Dynamic registration accepts an `https` callback or an `http` callback on
`localhost`, `127.0.0.1` or `[::1]`, without a fragment, credentials, whitespace
or non-ASCII characters. Authorization and code exchange match it exactly.

### Token lifetimes and refresh

API and MCP use the same RBAC settings:

| Setting                                      | Default | Use in MCP                                                      |
| -------------------------------------------- | ------- | --------------------------------------------------------------- |
| `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS`         | `3600`  | Maximum access-token lifetime                                   |
| `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` | `86400` | Maximum refresh-token lifetime and client-registration lifetime |

MCP tokens cannot outlive the corresponding signed RBAC JWT. MCP stores the
RBAC refresh token on the server. When a connector refreshes its MCP token,
MCP calls `rbacSubjectApi.authenticationRefresh` to obtain a new RBAC pair,
then issues a new MCP pair mapped to the same subject. A failed RBAC refresh
requires signing in again. Each successful token issue renews the client
registration for the shared refresh window.

Authorization codes and MCP refresh tokens are consumed atomically, including
across processes using Redis. Concurrent exchanges of one token cannot both
succeed. `MCP_SERVICE_OAUTH_AUTH_CODE_TTL_SECONDS` still controls the separate,
short-lived authorization code (300 seconds by default).

After upgrading from the previous implementation, reconnect existing OAuth
clients: their stored refresh records do not contain an RBAC refresh token.
Replace custom `MCP_SERVICE_OAUTH_ACCESS_TOKEN_TTL_SECONDS`,
`MCP_SERVICE_OAUTH_REFRESH_TOKEN_TTL_SECONDS` and
`MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS` settings with the shared RBAC settings
above, with matching values in API and MCP.

SDK requests to `API_SERVICE_URL` reject redirects, even when a caller requests
`redirect: "follow"`. This prevents an API redirect from forwarding a subject
JWT, operator header, password or refresh token. Configure the final API URL;
redirecting aliases will fail. Credentials are automatically added only to the
configured API origin.

## Limits

- `/mcp` refuses a request body larger than `MCP_SERVICE_HTTP_MAX_BODY_BYTES` (4194304 by default) with 413. OAuth endpoints accept up to 64 KiB.
- A Streamable HTTP session idle for `MCP_SERVICE_HTTP_SESSION_IDLE_TTL_SECONDS` (86400 by default) is closed, and at `MCP_SERVICE_HTTP_MAX_SESSIONS` (500 by default) the least recently used session is closed to admit a new one. A closed session answers 404, and the client starts a new session as it does after a restart.
- The HTTP server refuses to start on a legacy `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET` and reports a short or legacy value of its other secrets. `MCP_SECRET_STRENGTH=report` starts it anyway; see `tools/deployer/README.md`.

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
- scope `mcp:content`, with every operation checked by API RBAC;
- a lifetime capped by `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` and the remaining lifetime of the supplied subject JWT;
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
RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS=3600
RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS=86400
MCP_SERVICE_HTTP_MAX_BODY_BYTES=4194304
MCP_SERVICE_HTTP_SESSION_IDLE_TTL_SECONDS=86400
MCP_SERVICE_HTTP_MAX_SESSIONS=500
```

`MCP_SERVICE_DOCKER_HUB_REPOSITORY_NAME` falls back to `API_SERVICE_DOCKER_HUB_REPOSITORY_NAME` when empty. Leave `MCP_SERVICE_ALLOWED_ORIGINS` empty to allow every Origin; OAuth/Bearer still protects data access. Redis is used for OAuth clients, codes, access-token mappings, and refresh tokens; every one of these keys expires.

The rendered MCP environment never contains `RBAC_SECRET_KEY`. To use `MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK=true` on a server for private debugging, add `RBAC_SECRET_KEY` to the MCP service env by hand; without it the fallback refuses every header.

Deploy or remove only the MCP service:

```bash
cd tools/deployer
./mcp.sh up
./mcp.sh down
```

The full deployer runs MCP after `api` and before `telegram`/`host`.

## Runtime authentication check

`tools/dev/mcp-auth.test.ts` starts an actual MCP HTTP process and loopback RBAC
fixture with signed test JWTs. Supply a dedicated Redis instance; the test
creates expiring `mcp:oauth:*` keys. It exercises SDK login and refresh, access
expiry, concurrent refresh consumption, Redis TTLs, and redirects 301, 302,
303, 307 and 308. It does not use a real user's account or test the API's RBAC
implementation.

```bash
MCP_TEST_REDIS_PORT=<isolated-redis-port> bun test --no-env-file --timeout 30000 tools/dev/mcp-auth.test.ts
```
