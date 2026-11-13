Closes #309.

## Summary

The public MCP endpoint accepts untrusted tool arguments. The SDK upgrade addresses cross-client responses and limits the work spent validating one request. The dependency review covers 253 direct JavaScript packages across 11 manifests and all seven direct Python dependencies in the LLM service.

## Changes

- MCP SDK 1.32.2 enforces a maximum of 10,000 object keys and array elements per tool call. The HTTP body limit remains 4 MiB by default. Clients can split a larger batch and continue in the same session. [Cross-client response advisory](https://github.com/advisories/GHSA-345p-7cg4-v4c7) · [Validation advisory](https://github.com/advisories/GHSA-46jr-4wx8-v453)
- Updated Next.js to 16.4.6, React to 19.3.1, Nx to 24.0.6, Zod to 4.6.7, Inversify to 8.3.0 and Postgres.js to 4.1.1. Migrated their consumers, generators, test configuration and Docker runtime. Production Host builds use Webpack and development uses Turbopack.
- The shared repository preserves omitted fields in partial updates under Zod 4. Notification retries still accept existing deterministic IDs. SQL array bindings and numeric realtime cursor ordering were verified against PostgreSQL. Framework classes and generator templates explicitly inherit constructor injections under Inversify 8.
- Updated Studio, wallets, email rendering, Stripe, Redis and Python LLM clients. The deployer installs its GitHub helper from a committed lockfile. The workspace installs without legacy peer resolution. Dependabot checks application dependencies, actions and Docker daily.
- The Host layout now provides the cookie context that the project selector and account menu need after sign-in. The email/password form enables its controls once React can handle submissions.
- The nine remaining model and relation services in Blog, CRM, Ecommerce and Knowledge now export their project class from `service/startup`. The existing implementations live in `service/singlepage`.

## Verification

- [x] Resolved a project override through DI for each of the nine services. All 26 Knowledge and CRM integration tests passed against PostgreSQL, including a Knowledge Source override inside a transaction. Exercised article edits, ordered form steps, linked inputs and category-to-widget relations through the running API. In the signed-in chat, saved a value in a test document and retrieved it in the assistant's reply. The conversation survived a reload.

- [x] Clean npm installation and peer dependency tree. TypeScript checks passed for API, Host, MCP, Studio, Telegram and the Nx generator.
- [x] Reinstalled 2,427 packages with `npm ci` and an empty cache. In a browser, registered a test account against a local database copy. On both Turbopack and the production Webpack build, checked rejection of an incorrect password, successful sign-in, the project selector, opening the account menu, session persistence after reload and navigation between pages.
- [x] 3,391 unit tests passed across 36 Jest projects, with one existing skip. All 122 integration tests passed against isolated PostgreSQL and Redis across 16 projects. All 30 HTTP scenarios passed against the running API, including adding a priced product from the rendered form, reading the cart count after remount, provider webhooks and isolating messages between chat threads. Creating an extra thread previously conflicted with the unique default thread. The user-facing route now assigns a custom variant by default.
- [x] Opened the Russian framework page against the running Bun API and Turbopack Host. Built and started the production Webpack Host and verified HTTP 200 with page content. Built Storybook and both standalone Studio applications. Ran dry runs for model and frontend variant generation.
- [x] All 31 File Storage security tests passed in a Docker network with real TLS servers, including IP pinning, private redirects, redirect loops and decoded size limits. A per-hop dispatcher handles one request and closes explicitly, preventing early peer shutdown from exhausting the redirect deadline.
- [x] All 79 Bun deployer, secret handling, MCP client configuration and OAuth tests passed with a fresh isolated Redis instance. The deployer tests verify that preview and production settings use GitHub Variables and passwords use Secrets. Seven API and Host startup checks passed.
- [x] MCP authentication, ordinary and oversized tool calls, receipt and checkout paths, and notification retries were exercised locally. The LLM service passed 13 tests and a multipart request with a stub transcription provider. Live provider payments, email delivery and wallet signing were outside these checks.
- [ ] The aggregate Studio validation stops on 11 duplicated sentences in existing agent documentation. The same checker reports the same sentences on the previous revision. The design-system, presentation, GitHub and pipeline checks were run separately.

## Security and version constraints

On November 11, 2026, the root production npm audit reported **zero known findings**, down from 96 on the previous PR revision (including five critical). Both standalone Studio audits and the resolved Python runtime audit returned zero. The full root npm audit reports 20 low-severity package entries through one development dependency, deepmerge 4.3.1. Its maintainers have yet to publish a patched release. [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)

Seven direct packages remain on compatible release lines. Nx and Jest use Babel 7 (`@babel/core` and `@babel/preset-react`), the installed React and import lint plugins support ESLint 9 (`eslint` and `@eslint/js`), the Jest transformer and ESLint TypeScript parser support TypeScript 6.0, Nx uses Verdaccio 6, and `@types/node` matches the Node 24 runtime. Installation still reports deprecation notices in this tooling tree.

## Downstream migration

1. Use Node 24.15+ on the 24.x line, npm 11 or 12, and Bun 1.4.4. Reinstall with `npm ci` and rebuild the API, Host and LLM images.
2. Review project-owned subclasses that rely on an inherited constructor for dependency injection, Zod partial schemas that carry defaults, SQL array parameter bindings and deep imports of retired package APIs. Use the matching updated framework implementations as examples. Align custom Nx executors and generator templates before generating new modules.
3. Run project type checks and PostgreSQL integration tests, build the production Host and exercise project-specific wallets, payments and notifications with their configured providers. This update requires no database schema or seed migration.
4. If your project overrides the Host layout, mount the client-side `CookiesProvider` above RBAC initialization and the page content. For custom email/password forms that submit through JavaScript, enable submission after hydration. Sign in and check that the account menu and project control render after a full reload.
5. If you edited a formerly unlayered `service/index.ts`, move your project methods, constructor and injections to `service/startup/index.ts` during the merge. Keep the public service import path. Verify the edited operation through its normal API route.
