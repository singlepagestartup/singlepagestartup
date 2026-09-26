Closes #348.

Based on #346: this branch is stacked on `claude/issue-303-roleless-permissions` and should be retargeted to `main` once #346 merges.

## Summary

The reviewed list of role-less permission rows from #346 kept 47 `count` routes in a group pending review. No public or customer component calls them; their list reads already require the Admin role, and only the admin-v2 overview, its tables and MCP count those tables. The seed now attaches the Admin role to the 47 rows.

The admin-v2 overview needed one change for that. The host renders the overview on the server, and each card counts its model through the server SDK, which sends no credential, so a card whose count requires a role fails for every viewer. The cards of the models this change closes, and of the three models #346 closed, now render in the browser through a client wrapper, as the overview tables beside them already do, so their count carries the admin's token.

## Changes

- **Seed.** 47 `roles-to-permissions` rows attach the Admin role to the count routes of: `agent/agents`, `analytic/metrics`, three broadcast and two crm tables, three ecommerce order and store relations, five notification tables, `rbac/actions`, `rbac/permissions` and eight rbac permission, role and subject relations, nineteen social tables and relations, and three telegram tables. Created through the API on a copy of the development database and written by `npx nx run api:db:dump`; the dump removed the 29 relation files of #346, which the copy does not hold, and they were restored unchanged.
- **Reviewed list.** The pending group of `roleless-permissions/singlepage.ts` keeps only the four notification template reads. The content group comment records why its count routes stay without a role: they count published content and page widgets.
- **Seed check.** A scenario in `is-authorized.spec.ts` names `GET /api/social/messages/count` when its Admin attachment is missing.
- **Overview cards.** 21 wrappers under `libs/modules/*/frontend/component/src/lib/admin-v2/overview/*/admin-v2-card/` render a new `"use client"` `ClientComponent.tsx` that passes `isServer={false}` to the model card: the 18 models whose count this change closes and ecommerce orders, billing invoices and payment intents from #346. The 40 cards whose count stays public keep rendering on the server. A spec renders the message card as the host does and checks it counts through the browser SDK only.

## Verification

- [x] `npx nx run-many --target=jest:test --projects=@sps/agent,@sps/analytic,@sps/billing,@sps/broadcast,@sps/crm,@sps/ecommerce,@sps/notification,@sps/rbac,@sps/social,@sps/telegram`: all pass (`@sps/rbac` 84 suites and 392 tests).
- [x] `npx nx run-many --target=eslint:lint` for the same ten projects: pass, no warnings.
- [x] `npx tsc --noEmit -p libs/modules/<module>/tsconfig.json` for the ten modules: no errors.
- [x] `node tools/agents/code-placement.mjs`: clean.
- [x] Mutation checks: without the 47 new files the seed scenario names exactly those rows; the message card spec fails against the server-rendered wrapper.
- [x] HTTP on port 4303 against a throwaway copy of the database: before the change every count answered 200 without a token. After it, `GET /api/social/messages/count` answers 403 without a token and with a customer token and 200 with an admin token; the `crm/requests`, `rbac/actions`, `notification/notifications`, `agent/agents`, `social/chats-to-messages` and `telegram/pages` counts answer 403 without a token; `ecommerce/products`, `blog/articles`, `crm/forms`, `billing/currencies` and `website-builder/widgets` counts answer 200 without one.
- [ ] Browser check of the admin-v2 overview as an admin. Not run: the host needs a real install in the worktree; the wrappers follow the client pattern the 61 overview table wrappers already use.

## Notes

- `rbac/permissions/count`, `rbac/roles-to-permissions/count`, `broadcast/channels/count` and `broadcast/channels-to-messages/count` are also admitted by the is-authorized allow rules; the Admin role on their rows takes effect when #308 anchors those rules. Both answered 200 without a token in the run above.
- The identity, role and subject cards fail on the server the same way; the sensitive-route list closed their counts before this stack, and the same wrapper change would fix them.
- The four notification template reads stay without a role in the pending group.

## Downstream migration

- **Seed.** Projects that merge the framework seed receive 47 relation files. If a file's `permissionId` names no file in your permission snapshots, delete the 47 files, attach the Admin role to the same count rows in your development database and dump.
- **Role-less count rows.** `npx nx run @sps/rbac:jest:test` names every role-less seed row missing from the list; attach a role, or list the row in `roleless-permissions/startup.ts` when anonymous visitors see what it counts.
- **Counting from components.** A project component that counts one of these models renders through a `"use client"` wrapper with `isServer={false}`, as the overview tables do, so the request carries the admin token.

_Verify:_ open the admin-v2 overview of the social module as an admin and confirm the message card shows a count; `GET /api/social/messages/count` answers 403 without a token and 200 with an admin token; the rbac unit lane passes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
