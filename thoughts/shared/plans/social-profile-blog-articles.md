# Social profile to blog article implementation

The approved implementation adds `social.profiles-to-blog-module-articles`,
a many-to-many relation with standard SPS CRUD, client/server SDKs and both
admin interfaces. Its reads and mutations use existing RBAC. The separate
profile frontend variant `articles-default` renders linked article cards.

## Implementation

- [x] Add the relation backend and SDKs using profiles-to-knowledge-module-documents as the structural reference. Preserve dump/seed configuration and translate both foreign-key seed mappings.
- [x] Register the API and Nx generate/migrate targets. Generate migrations with the relation target; run Blog migrations before Social migrations.
- [x] Add find/default and form/select-input/table/table-row for both admin generations. Use explicit client boundaries, memoized rows, stable id keys, stable callbacks and row-local deletion state.
- [x] Add relation sections to profile and article admin forms. Filter by the current parent, prefill create defaults, and expose both model editors in admin-v2.
- [x] Add articles-default to the profile frontend registry. Query links by profileId, order by orderIndex ascending and render existing article default cards in a responsive 1/2/3-column grid.
- [x] Document the relation, usage and RBAC requirements in the relation, module and model READMEs.

## Verification

- [x] Unit tests cover UUID validation, display filtering, language/runtime forwarding, empty output and create/edit form defaults.
- [x] Integration checks cover CRUD, filtering, many-to-many links, foreign keys, cascades and RBAC.
- [x] Verify fresh database migration and upgrading a database with the existing profile/article schemas.
- [x] Check MCP SDK discovery, run scoped Social/Blog tests, type checks, changed-file lint and code-placement.
- [x] Agent browser checks cover create/edit/delete, prefilled endpoints, linked editor actions, article ordering, Russian links and the 1/2/3-column grid on fixture data.
- [x] Apply the full migration sequence to the configured local project database and verify the running API with temporary records.
- [x] Verify CRUD in the authenticated project admin session from profile and article forms in both admin generations.
- [ ] Human acceptance in an authenticated project admin session remains unconfirmed.

## Boundaries

No profile or article records are created by a migration. Repository data
snapshots are unchanged. The existing overview-default and persisted profile
types stay as they are. User publishing flows and deployment to another SPS
project are outside this implementation.

## Verification results

- Social: 22 unit suites / 63 tests and 2 integration suites / 8 tests passed. The relation integration suite uses PostgreSQL and the real shared authorization middleware, with the RBAC subject SDK authorization decision mocked.
- Blog: 2 unit suites / 6 tests and 1 integration suite / 3 tests passed.
- MCP: 10 unit suites / 55 tests passed, including SDK registry discovery.
- Shared client API: 5 suites / 41 tests passed, covering mutation cache updates and subscription revalidation.
- Social and Blog TypeScript checks passed. Lint passed for 107 owned source/config files; code-placement and diff whitespace checks passed.
- The generated relation migration passed on existing parent schemas with records. The full API migration sequence also completed on a disposable pgvector PostgreSQL database; reapplying the relation migration made no changes.
- The combined API migration target now runs from the repository root so nested Nx targets resolve their workspace-relative environment file. Blog precedes Social.

The full `api:db:migrate` target completed on the configured local project database. Both development servers are running at `http://localhost:4000` and `http://localhost:3000`. The local API Redis password matches the running project Redis container.

Real HTTP checks passed for CRUD, filters from both endpoints, multiple profiles per article, ordering, required IDs, foreign keys, cascades, cache freshness and WebSocket revalidation. Authorized requests used the existing operator secret key; unauthenticated reads and writes returned 403. Temporary profiles, articles and links created for these checks were removed.

Next.js compiled the admin and authentication routes. Authenticated browser checks passed in both admin generations: creating, editing and deleting links from profile and article forms, prefilled parent selection, retained endpoint selection on edit, and table updates without page reload. The admin-v2 profile and article editor buttons open the linked entities. The browser console contains no errors during these checks.

Deleting the browser-created links preserved the temporary profile and articles. All temporary records were removed after verification. Earlier fixture browser checks cover article cards, language forwarding, ordering and the responsive grid; those display checks remain separate from the authenticated project admin checks. Human acceptance remains unconfirmed.
