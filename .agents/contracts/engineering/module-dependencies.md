# Module dependency order

Production code under `libs/modules` follows this order, from consumer to
capability. A module may import itself and modules below it, but never a module
above it.

1. `agent`
2. `host`
3. `analytic`
4. `rbac`
5. `startup`
6. `social`
7. `crm`
8. `blog`
9. `ecommerce`
10. `billing`
11. `website-builder`
12. `knowledge`
13. `notification`
14. `file-storage`
15. `broadcast`

This order applies to backend code, database schemas, SDKs, frontend variants,
imports and reexports, including type-only imports. A type-only edge does not
prove a runtime cycle, but it still crosses the module boundary. An indirect
import through a shared barrel does not exempt an upward dependency. A new
module needs an agreed position before other modules depend on it.

The order restricts dependencies; it does not require a module to use every
lower module. Intra-module dependencies must also avoid circular imports.

## Ownership and composition

- Social owns profile-to-article relations. Its profile admin can compose Blog
  article readers and editors. Blog owns article content and must not import
  Social profiles or relations. Cross-module UI belongs to its higher consumer;
  a lower component can expose a slot without importing that consumer.
- Host composes lower modules' widgets, including Analytic widgets. Analytic
  does not import Host page, layout or widget implementations.
- RBAC subject operations orchestrate lower domain capabilities with the
  caller's access scope. The global permission resolver retains its narrow
  authorization role; the module order does not move domain rules into it.
- `libs/modules/startup` is the project widget module. The `startup` extension
  layer inside packages is a separate inheritance mechanism and does not
  change an import's owning module.

## Applications and infrastructure

`apps/api`, `apps/host`, `apps/mcp` and `apps/telegram` compose the business
modules and are outside this module order. Infrastructure primitives in
`libs/shared` and `libs/providers` must not acquire business orchestration.
Global middleware assembled by the API host is integration code and follows
its documented access, transport and cache contracts.

There is no `libs/modules/telegram` business module. `apps/telegram` remains
the Telegram transport service: it receives updates and publishes the Agent
command catalog. Bot command interpretation and conversations belong to
`agent`; subject-scoped operations belong to `rbac`, records to `social`, and
outbound delivery to `notification`.

## Implementation and review

Run `npm run check:module-dependencies` when reviewing changed module imports.
The check reads the order above, resolves TypeScript aliases and neutral barrels,
and includes type imports and tests. It reports upward edges; it does not prove
that every remaining intra-module graph is free of runtime cycles.

Check each new cross-module import against this order, including schemas,
types, frontend composition and transitive barrel exports. Existing upward
imports are findings, not permission to repeat them. Keep their triggering
behavior and evidence distinct from a proven runtime cycle.

When changing an ownership boundary, update this contract and the affected
module/entity READMEs together. Exceptions require an explicit operator
decision with scope and revisit conditions. The general review workflow is
`.agents/workflows/engineering/review_pr.md`.
