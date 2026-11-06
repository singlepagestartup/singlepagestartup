## Summary

Framework, Blog and AI Chat now use the reviewed Studio presentation through registered module variants and saved content, with Russian and English interfaces and Russian as the default language. The branch also completes the account, commerce and protected-content flows needed by these pages.

Closes #376.

## Changes

- Port Framework sections, module guides, Blog cards/categories/articles, navigation and AI Chat surfaces from Studio into reusable Host, Website Builder, Blog and domain components. Keep functional Widget operations separate from presentation and link exact saved instances through relations and explicit JSX slots.
- Align the landing chat demo with the project workspace. Add attachment previews, drag ordering, insertion feedback and desktop file drops; keep own messages on the right without a redundant author label.
- Localize public, authentication, account, cart and chat interfaces in RU/EN. Preserve English AI document instructions and machine billing identifiers. Add competitor questions to business and product templates.
- Persist localized Widgets, Features, ButtonsArrays, Articles, media and their associations through the normal SDK/content-management and database dump flows. Include curated Blog examples and all fifteen module guides.
- Complete account-owned article publication, public author presentation, private article/media guards, scoped query/cache behavior, fixed subscription periods and once-only Free provisioning. Preserve historical paid records and exact token accounting.
- Make Widget relation seeds resolve remapped endpoint IDs through natural keys so imports can run repeatedly. Round token quantities only for display, including PostgreSQL numeric strings; keep prices and stored credits unchanged.
- Add a verification-only Docker workflow option and document sequential checks at the completion boundary with machine-resource monitoring.

## Verification

- [x] Full Docker/Host build, TypeScript validation and static generation (8/8) passed for application commit `9fbf3906fb868e1d7433337cad7d3617c4d5afc2` in [release workflow 40582597969](https://github.com/singlepagestartup/singlepagestartup/actions/runs/40582597969).
- [x] Release [0.0.327](https://github.com/singlepagestartup/singlepagestartup/releases/tag/0.0.327) deployed successfully. API, Host, MCP, LLM and Telegram rollouts completed on the same release image.
- [x] Focused checks include fifteen relation-seed cases and twenty-eight token-formatting/chat-locale behavior cases. The two final locale-prop contract corrections subsequently passed the full CI type check. Earlier scoped checks and their limits are recorded in `thoughts/shared/research/singlepagestartup/ISSUE-376-*.md`.
- [x] Browser verification covers RU/EN home and Framework, all fifteen module guides, Blog categories/articles, registration/recovery forms, existing account access, settings, project documents, attachment previews, chat tabs/actions, token quantities and an empty localized cart.
- [x] SDK readback after the final seed matched all 434 reviewed localized records with zero missing records or field mismatches. Five token packages in each of the local and test deployment databases match the dump; only approved descriptions and update timestamps changed.
- [x] Admin forms expose the localized Widget, Article and Product content, including both token-package descriptions.

## Notes

The large diff includes generated repository data snapshots and managed artwork. These snapshots come from the normal dump operation, not hand-edited UI fixes.

The test deployment required removing thirteen stale public-page associations and eighteen stale nested presentation/configuration associations through SDKs after preserving before snapshots. The seed is additive; merging source alone does not remove obsolete associations in another deployment. Model records, private projects and financial values were retained.

No payment, password reset email or final account registration was submitted during final deployment checks. Local full builds and typed lint were not repeated under memory pressure; the completed CI build supplies final type/build validation. This PR does not claim a fresh full-monorepo test run.

## Downstream migration

- Adapt owned variant overrides to the registered props, single-record model renderers, Widget-owned collections, ordered relation output and explicit author/comment/content slots. Keep `isServer=false` throughout client subtrees; use the narrow Blog Provider entry for client composition and rendered JSX across server/client boundaries. Reconcile old slider inputs with ID-keyed slide nodes and one selected navigation mode.
- Create or migrate each deployment's own Page, Widget, Feature, Article, Category, File and ButtonsArray graph through its SDK/API or MCP flow. Preserve owned copy, ordering, IDs and commercial terms; do not copy this project's business facts or overwrite private content. Review obsolete associations explicitly, regenerate the dump, and verify repeat imports without duplicates.
- Apply the generated owning-module and consistency-capture migrations before switching saved consumers. Preserve exact Subject guards and pre-cache/static private-content checks, allowlisted public author DTOs, scoped query subscriptions and protected Blob cleanup. Verify anonymous, paid guest, owner, foreign, expired and revoked access through both caches and byte delivery.
- Preserve existing Orders, Invoices, balances and payment anchors. Freeze eligible legacy subscription periods through the owning operation rather than CRUD timestamps; retain once-only initial Free credit and additive paid grants. Review owned catalog terms before applying example data. Round token display only, leaving decimal prices and accounting precision intact.
- Forward the selected locale through owned chat/account wrappers, message lists and attachment views; declare the optional locale in public props. Keep RU/EN editable UI data separate from canonical English AI templates and billing interval identifiers.
- Keep the Docker workflow's `VERIFY_ONLY` option enabled for build-only checks; publication calls must opt out as appropriate. Preserve completion-boundary, sequential validation and memory/swap/disk checks in owned agent instructions.
- Verify saved routes, admin editing, media resolution, repeat data application, private access, historical orders, locale controls, attachment behavior, module dependencies and completed production rendering. Individual commits retain the more specific adaptation instructions.
