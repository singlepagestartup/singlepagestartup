---
issue_number: 376
issue_title: "Перенос визуала Storybook в Framework и доступ к закрытым виджетам"
start_date: 2026-10-22T22:34:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-376-platform-followup.md
status: in_progress
branch: codex/issue-376-framework-visual
---

# Implementation Progress: ISSUE-376

## Phase Progress

### Phase 1: Серверный период, scope и bytes

- [x] Started: GitHub In Dev проверен shared helpers.
- [x] Completed: fixed period, explicit revoke, resource graph, pre-cache/read/write/byte guards и SDK.
- [x] Automated verification: period/revoke 70 tests в 8 suites, включая две реальные PostgreSQL проверки; access 16 tests после final guest/Date правок; настоящая API matrix 1/1, 31.3 s.

Owners: subscription_period и research_access; protected media — workflow_lookup. Независимые review-pr: phase_reviewer и workflow_lookup. Реальная API matrix использует Hono, PostgreSQL, оба response cache, все 13 видов WB edges, File metadata и GET/HEAD/range bytes. Subscriber A — guest JWT без Identity с оплаченной подпиской и свежим Role. Anonymous, чужой signed-in B и guest без подписки получают отказ. Истечение, revoke, own-Subject и rollback fixtures проверены.

### Phase 2: Website Builder и оболочка

- [x] Started
- [x] Completed: commit 84087145cf.
- [x] Automated verification: WB 9 tests, shared find 2 tests; независимый source review PASS.

Owner: root. Сохранённые тексты, медиа, кнопки и порядок связей остаются источником presentation. Одна навигация слайдера, keyboard/media controls, mobile navbar, общий контейнер, footer groups и одиночные model skeletons проверены. Browser runtime подтвердил Next/ArrowRight/Home для gallery.

### Phase 3: Commerce и CRM

- [x] Started
- [x] Completed
- [x] Automated verification: commerce 11 tests плюс expired-history 9; Blog/CRM/RBAC frontend 49 tests, shared API 56; независимый review PASS.
- [x] Real CRM Request и dummy checkout integration: actual services/PostgreSQL PASS, включая независимые повторы; fixtures откатились.
- [x] Browser cart drawer: final desktop/320 recheck PASS; тестовая строка удалена, корзина пуста.

Owners: research_runtime и content_frontend. Browser подтвердил реальные currency/quantity, полный список 8 payment providers, add/update/delete тестовой строки в корзине; строка удалена. Внешние платежи и уведомления не выполняются.

### Phase 4: Blog и ordered private content

- [x] Started
- [x] Automated verification: ordered slots, denied/granted readers, request-start deadline, auth reset, query scope lifecycle и File Blob cleanup.
- [x] Browser verification
- [x] Completed

Owner: content_frontend. Независимый reviewer workflow_lookup: PASS после исправлений. Private content не передаётся в SSR/RSC. Первый запрос HTML и RSC demo Article не содержит private marker или private Widget ID; повторная проверка выполняется на окончательной сборке.

### Phase 5: SDK cutover

- [x] Started
- [x] Completed
- [x] Automated verification: Framework tool 14 tests; общий engine и rollback приняты независимым reviewer.
- [x] Local apply/readback/repeat/rollback/reapply

Owner tool: planner; локальный SDK apply: root. Первый manifest: 9 operations, 6 creates, 3 updates; verify 9 operations / 1 private graph. Repeat: 9 skips. Rollback восстановил contact/Host links, private marker и subscription requirement сохранены. Новый prepare после rollback: 2 operations; reapply: 0 creates, 2 updates; verify: 2 operations / 1 private graph. Legacy freezes в локальном manifest отсутствуют; freeze/revoke/period cases проверены отдельными сервисными и реальными PostgreSQL tests.

Exact input: Host contact a5a0855a-08bd-482c-bc82-e2330ef351b7; CRM Widget d947bcab-0873-40a5-8c91-66ec59c54c3b; Form 744eb654-aac3-4aac-af93-f9fb5e290b23; private Article 5ade2625-007e-4c90-86bd-989a33e534fa; subscription Product e939ed88-22ba-4630-86e4-9743ad94338c. Product type, Role, interval, currencies и цены прочитаны настоящими SDK. Before manifests содержат protected snapshots, сохранены локально mode 0600 и в Git не добавляются.

### Phase 6: Сквозные проверки

- [x] Started
- [x] Completed
- [x] Final automated verification
- [x] Browser verification desktop / 320 px
- [x] Independent final local review-pr

Production Host собран и отвечает HTTP 200 на :3000. Окончательная frozen build .next-issue376-final прошла и запущена на :3000. Module dependencies: 14864 source files, 0 violations. API TypeScript имеет 20 ошибок исходной ревизии: isolated HEAD archive и рабочее дерево дают одинаковые diagnostics, новых нет. Этот check не объявляется успешным.

## Implementation coordination

Пользователь разрешает автономные промежуточные review-pr разными агентами и переходы статусов. Финальная остановка — Code Review для пользователя. PR, push и merge не выполняются. Итоговое человеческое review остаётся за пользователем.

## Incident Log

<!-- incident-count: 21 -->

### Incident 1 — Native Date теряет миллисекунды при преобразовании через String

- **Occurrences**: 1
- **Stage**: Phase 1, real API matrix
- **Symptom**: Доступ закрывался раньше точного subscription deadline.
- **Root Cause**: String(Date) отбрасывает миллисекунды native Date.
- **Fix**: Native Date читается через getTime; остальные supported representations парсятся отдельно. Unit boundary и реальная API matrix прошли.
- **Reusable Pattern**: При Date/string union проверять точную границу на данных настоящего PostgreSQL driver.

### Incident 2 — Холодная сборка Host и последовательные invalidations

- **Occurrences**: 2
- **Stage**: Phase 6
- **Symptom**: Dev Ready не сопровождался готовой страницей во время параллельных изменений.
- **Root Cause**: Большой существующий catch-all/Admin graph и повторные сборки после edits; новых циклов или package edges не найдено. Точная причина отсутствия ответа после одного из dev compile остаётся неустановленной.
- **Fix**: Изолированный production dist, frozen source, build/start и HTTP/browser проверка. Production build прошёл.
- **Reusable Pattern**: Ready/compile не заменяет HTTP и browser evidence; не менять архитектуру ради неподтверждённой гипотезы о цикле.

### Incident 3 — Карточка корзины сжимается в drawer

- **Occurrences**: 1
- **Stage**: Phase 6, browser verification
- **Symptom**: Трёхколоночный Product cart layout разбивал Price/Interval/Topup на узкие строки.
- **Root Cause**: Компоновка большого блока использовалась в узком drawer.
- **Fix**: Компактная вертикальная карточка с сохранением Gallery/Attributes/slots и full-width drawer; final recheck desktop/320 PASS.
- **Reusable Pattern**: Проверять реальный drawer с выбранным товаром на desktop и 320 px.

Known GitHub/sandbox/agent coordination incidents находятся в постоянном process log. Localhost HTTP/socket и Git metadata требуют escalation; Nx запускается с NX_DAEMON=false NX_ISOLATE_PLUGINS=false. Completed агент запускается followup_task.

## Implementation decisions

- Ранний renewal сохраняет начало непрерывного покрытия и продлевает конец на полный interval; поздний начинается с принятой оплаты.
- SubscriptionRevokedAt отличает явный отзыв от естественного expiry. Generic writes не меняют эти server-owned поля; paid delivery и Role/balance writes атомарны.
- Identity влияет на denied presentation. Guest JWT с собственным активным оплаченным Order и свежими Product Roles получает entitlement.
- Query scopes принадлежат отдельным mounted private subtree. Deadline начинается до transport; ошибки повторной проверки закрывают private readers и Blob URLs.
- Apply/rollback требуют --exclusive-maintenance: сторонние CMS writers остановлены до verify. Generic full PATCH не обеспечивает CAS между GET и PATCH; локальное окно исключает параллельные CMS edits.

## Summary

### Changes Made

- Studio visual: 652cabd9bf.
- Workflow membership lookup: 375b370333.
- Guest own-account: 710ae5329d.
- Research/review: 70244eab23.
- Approved plan: d5add8923d.
- Website Builder/Host shell: 84087145cf.
- Resource/period backend: 6d7e1f09c9.
- Commerce/CRM/Blog frontend: cb4296b6f0.
- SDK cutover: 6a9be42bb6.

### Pull Request

Не создаётся по прямой инструкции пользователя. Результат — локальная ветка и commits для человеческого Code Review.

### Final Status

- [x] Все фазы реализованы
- [x] Автоматические и браузерные проверки завершены; failing baseline API TypeScript выделен отдельно
- [x] Независимый preflight PASS, неустранённых замечаний нет
- [x] GitHub Project Code Review проверен shared update/get helpers; финальное человеческое review ожидается.

### Incident 4 — Typed ESLint heap

- **Occurrences**: 1
- **Stage**: Phase 6
- **Symptom**: Анализ 221 changed TS файла завершился default V8 heap error.
- **Root Cause**: Monorepo typed parser project.
- **Fix**: Повтор с 8 GB heap завершил весь анализ; пять файлов исправлены и повторно прошли exit 0. Только import/type/comment/format cleanup.
- **Reusable Pattern**: Указывать heap для typed ESLint, сохранять правила и проверять исправленные пути.

### Incident 5 — Missing Blog public relation GETs

- **Occurrences**: 2
- **Stage**: Phase 6
- **Symptom**: Blog index и Category возвращают 500 при 403 новых relation readers.
- **Root Cause**: В saved configuration отсутствуют widgets-to-categories и categories-to-website-builder-module-widgets list GET permissions; count/остальные13 audit reads public.
- **Fix**: Operator SDK missing-only create точных roleless GET после проверки Role bindings и private graph isolation; anonymous reads 200. Два пути перечислены в reproducible rollout snippet.
- **Reusable Pattern**: Проверять все 14 list/count reads семи Blog relations; не менять snapshots/общий bypass и не ослаблять existing role-bound policy.

### Incident 6 — Studio projection schema metadata

- **Occurrences**: 1
- **Stage**: Phase 6
- **Symptom**: Studio catalog test не находит четыре nullable Order fields.
- **Root Cause**: Локальная projection осталась на прежней schema.
- **Fix**: ReadSchemaFields синхронизировал admin-v2-table metadata, значения новых полей null и IRecord nullable; полный studio:validate exit 0.
- **Reusable Pattern**: После schema generation синхронизировать локальную projection без перегенерации authored views/данных.

## Final acceptance evidence

- Independent reviewer phase_reviewer: review-pr PASS, revision 6a9be42bb6.
- Durable implementation/browser/review reports: thoughts/shared/research/singlepagestartup/ISSUE-376-{implementation,browser,reviews}.md.
- Full Studio validation и final Host build exit 0; 16 EN/RU HTML/RSC checks без private marker/Widget ID; browser desktop/320 без открытых blockers, console errors/warnings 0.
- Actual public-control cache HIT подтверждён в обоих режимах; protected A/anonymous/B/guest reads обходят cache lookup/write. Paid A — guest JWT без Identity. Client cleanup и API entitlement/bytes имеют отдельные явно указанные tests.
- Actual commerce/CRM PostgreSQL fixtures проверяют сохранённые cart/Invoice/Request, затем rollback; внешние transports не вызываются. Browser Submit/payment и paid browser session не заявляются.
- API typecheck: 20 baseline/current diagnostics, 0 new/absent, exit 2. Streaming not-found UI сохраняет HTTP 200/noindex/digest; буквальный HTTP 404 не заявляется.
- Code Review передаётся пользователю; Done/merge не выполняются.

GitHub handoff: Code Review подтверждён 2026-10-22T23:58:52Z. Summary comment: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6353992295. Issue открыт; PR/push/merge/Done отсутствуют.

## Blog follow-up from user review

- [x] Новый scope: шесть содержательных EN/RU статей про Next.js/Hono и SPS, Frontend/Backend/DevOps по две, covers/authors/category associations, cleanup старых generic records.
- [x] Шесть generated masters и отдельные square outpaint derivatives сохранены; uploaded managed File bytes readback exact.
- [x] Тексты и safe SDK publication/readback/repeat.
- [x] Navbar по Studio и whole-card links, реальные author/category metadata и модельные skeletons.
- [x] Independent review-pr, frozen build и desktop/mobile browser acceptance.
- [x] Повторная передача на Code Review.

User feedback продолжает issue376 в той же ветке; прежняя приёмка относится к source6a9be42bb6, новая проверка охватит последующие edits и данные. Исходный private Article сохраняет ID/slug/security associations и получает содержательную публичную статью/закрытый appendix. Остальные восемь старых Article подлежат явному SDK deletion после новой graph readback.

### Incident 7 — Profile subtitle renderer

- **Phase**: Blog follow-up
- **Occurrences**: 1
- **Symptom**: Byline TipTap пишет parse warnings для штатной строки subtitle.
- **Root Cause**: Новый view выбрал rich-text renderer, хотя Profile form и overview используют plain text.
- **Fix**: getLocalizedPlainText и обычный paragraph; временная нормализация данных возвращена к исходному тексту через SDK. EN/RU plain/legacy и loading regressions PASS.
- **Preventive Action**: Проверять form/schema и существующие consumers перед выбором renderer.

### Incident 8 — Дисковый build cache

- **Phase**: Blog follow-up
- **Occurrences**: 1
- **Symptom**: Повторная финальная сборка завершилась ENOSPC при записи webpack cache.
- **Root Cause**: Большие task build caches заняли доступный диск.
- **Fix**: Удалены только четыре неактивных task outputs. Существующие SPS_HOST_WEBPACK_CACHE=false и NX_SKIP_NX_CACHE=true дали финальный build exit 0; working Host сохранён.
- **Preventive Action**: Проверять свободное место и отключать дисковый cache для разовых frozen builds.

## Blog follow-up acceptance

Source revision: 129dd65f92. Commits: 4db50ba65f, 2457eebd1e, 129dd65f92. Шесть EN/RU статей, три категории по две статьи, реальные cover/author associations, whole-card links и Studio navbar/cart controls готовы. Публикация: 51 writes, 8 retired; repeat 0 writes, fresh prepare 0 operations, private graph unchanged. Независимый review-pr PASS; 33 frontend tests/9 suites и 9 tool tests/36 assertions PASS. Frozen build PASS, 27 Host HTML/RSC200 +5 API checks, desktop/320 browser PASS в документированных пределах. Ошибочные capture-файлы исключены из evidence.

Полный результат: [ISSUE-376-blog-followup.md](../../research/singlepagestartup/ISSUE-376-blog-followup.md). GitHub Code Review проверен 2026-10-23T08:39:01Z; summary: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6360936917. Следующий шаг — пользовательский Code Review. PR/push/merge/Done не выполнялись.

## Platform follow-up progress

- [x] Research: registration/author scope, shell/About, catalogue/credit lifecycle, GitHub source references.
- [x] Independent research review and detailed implementation plan.
- [x] Plan review and Ready for Dev.
- [ ] Studio-first account/authors/editor and Website Builder blocks.
- [ ] Backend profile/Article ownership and credit lifecycle.
- [ ] Runtime frontend and saved SDK data cutover.
- [ ] Source tests, built Host, desktop/mobile/authenticated acceptance.
- [ ] Independent final review-pr, commits and human Code Review handoff.

Pro costs 29 USD or 1900 RUB per month for 5000 tokens. Existing token consumption math, top-up rate and pack amounts remain unchanged. Commercial publication requires the legacy Order projection correction and independent verification.

## Platform recovery after machine restart

Source baseline 3e6447dbf9. Partial implementation remains uncommitted; no new CMS publication was performed in this round. /tmp research inventories, draft source-link transform and test outputs were lost. Canonical research/plan/reviews remain in Git. New tests/builds have not been accepted. Source-only agents: r2_auth_finish, r2_ui_finish; root integrates the existing commerce/catalog/shell work and managed publication. Heavy checks run one at a time after resource verification. Pro prices confirmed 29 USD / 1900 RUB; period pending.

Recovery verification update (2026-10-23): API source typecheck, serial Node heap 3072 MiB, exits 2 with 20 known diagnostics after new author/SDK/Free type corrections. Studio typecheck exits 0 at the same cap. Host typecheck found six unsupported legacy admin props; those props were removed and final source recheck remains pending. Code placement passes; module dependency audit covers 15,197 sources with zero violations. R2.1 scoped Chat/controller tests: 15 in five suites; Social author/Chat display: eight in two suites; catalog/Profile reader/Chat loader: 35 in three suites. These focused tests pass and do not substitute for RSC/browser verification.

The actual PostgreSQL credit tests pass: two suites, six cases, bounded serial execution; disposable fixtures were cleaned up. Generated Blog/Social Widget→Website Builder migrations and consistency capture 0009 (158 resources) are applied locally. The canonical SVG was uploaded through the File SDK and its 1739 bytes match the repository source exactly. New public content has not yet been applied. The user requires final verification through npm run api:dev and npm run host:dev; API is now started through the former, Host verification follows source freeze.

Legacy author cache correction: the real PostgreSQL/Hono cache scenario reproduced stale public author list/count/detail after first publication in legacy cache mode. Consistency cache dependency generations updated correctly. The canonical legacy HTTP-cache exclusions now cover only the named public author GET/HEAD family; the consistency cache retains its actual Service dependency tracking. The same scenario is being rerun after the fix. Subject's new direct Free graph writes now receive effective lower module Services instead of activating generic CRUD wrappers for those writes. Independent re-review is pending.

### Incident 16 — Host dev heap limit

- **Occurrences**: 1
- **Stage**: Platform runtime verification
- **Symptom**: Webpack Host dev starts on 3000, then its first Framework request receives an empty reply after 101.1 seconds; Next exits with V8 heap exhaustion.
- **Root Cause**: The cold dev compilation exceeds its explicit 3072 MiB Node heap. This is a process failure and does not establish the earlier machine shutdown cause. System memory remained about 31% free.
- **Fix**: No heap increase. The default Turbo dev restart uses a 1536 MiB Node heap and optional Next native-bundler target 1024 MiB through SPS_HOST_TURBOPACK_MEMORY_MB; the first page response remains under verification.
- **Preventive Action**: Keep cold compilation, TSC, lint and builds serial; distinguish listening/Ready from a verified rendered page. The native bundler target is not a hard RSS guarantee.

### Incident 17 — Client directive below imports

- **Occurrences**: 1
- **Stage**: Platform dev verification
- **Symptom**: Turbo Host returns 500: the use-client directive must precede other expressions in Subject client SDK.
- **Root Cause**: The Article-create import was prepended above the existing directive; formatting retained it as a parenthesized string expression. TypeScript accepted that syntax, but Next rejected the client boundary.
- **Fix**: Restored the directive as the first statement and scanned module/Host sources for the same misplaced form. Only this occurrence was found. HTTP recheck is pending.
- **Preventive Action**: Preserve directive prologues when adding imports and verify actual Next compilation, not TypeScript alone.

Runtime policy prerequisite: the new curated Category reader also needs exact public GET /api/ecommerce/widgets-to-categories. Fresh SDK inspection found no existing policy or Role binding; one additive policy was prepared and applied separately through the same protected manifest flow. Main confirmed input now has170targets. This repeats the missing-public-read rollout issue; no broad bypass or existing Role policy was changed.

### Incident 18 — Private Article actions used nonexistent routes

- **Occurrences**: 1
- **Stage**: Platform browser verification
- **Symptom**: Guest lock linked to plural Subject sign-in; the subscription action linked to a missing Product-list Page.
- **Root Cause**: Hardcoded paths differed from the saved singular sign-in and Ecommerce routes.
- **Fix**: Both owning RBAC client renderers use localized `/rbac/subject/authentication/select-method` and `/ecommerce`. The guest browser transition succeeds.
- **Preventive Action**: Verify action destinations against actual saved Pages and follow the rendered action.

### Incident 19 — New Studio variants omitted contract metadata

- **Occurrences**: 1
- **Stage**: Platform Studio acceptance
- **Symptom**: Validation reported ten missing Figma metadata files; contract tests found private story imports and three unmarked early-return roots.
- **Root Cause**: New variants had not completed the public-entry and inspection metadata contract.
- **Fix**: Truthful not-created metadata, public story entries with literal variants, root data attributes and the NoProjects example are corrected. Full presentation tests passed380/380 before the final NoProjects count correction; Studio typecheck and validators passed.
- **Preventive Action**: Run variant contracts and validators before accepting a new Studio projection; do not claim a Figma node from placeholder metadata.

### Incident 20 — Changed Product prices break historical Order reads

- **Occurrences**: 1
- **Stage**: Commercial preflight
- **Symptom**: Retiring Pro's Star offer would make existing Star Orders fail their extended read.
- **Root Cause**: The history projection recalculated its quote from current Product attributes; billing transport type and Product delivery type can differ.
- **Fix**: The saved-Invoice/interval projection and ambiguity guards pass independent source review and45 regression tests. All7 old Pro Orders remain readable after commercial application; protected financial observations are unchanged.
- **Preventive Action**: Exercise historical paid, completed, canceled, OPEN and unbilled Orders before changing live Product currencies or intervals; preserve financial rows and fixed accepted periods.

### Incident 21 — Reported heating during production type checking

- **Occurrences**: 1
- **Stage**: Platform final runtime verification
- **Symptom**: The user reported strong computer heating after Webpack compilation completed in88seconds and the build entered type checking.
- **Root Cause**: Not established. The build's type worker used about100%CPU; VSCode Tailwind/Nx extensions and system cleanup also had high CPU. These observations do not establish an unsafe import or explain the earlier shutdown.
- **Fix**: Root stopped only its build processes53069,53070,53815. Host was already stopped for the isolated build; API remained running. Memory free rose to about60%, and the user confirmed that heating noticeably decreased. No further heavy build or type checker was started.
- **Preventive Action**: Keep checks serial and bounded; inspect process ownership and actual resources, stop task-owned work on a thermal report, and distinguish source review, completed compilation and a completed production build.

Current thermal checkpoint: no Host or production compiler is running. API remains on4000 through npm run api:dev. User confirms cooling after the build stop. Client-boundary review is recorded in ISSUE-376-rbac-client-boundary-review.md; independent root/Host/source acceptance is in ISSUE-376-final-source-review.md. The new Blog Provider cycle is removed through its narrow public alias; the unfiltered empty Popular fallback is removed. Full production acceptance, commercial application and final Code Review handoff remain pending.

## Current checkpoint

Implementation: local commit `18f454fef1`; no push or PR. Order regressions pass45/45 in1.982seconds; all7 real old Pro Orders remain readable. The confirmed monthly Pro/top-up catalog applied70 creates/6 updates. Verify, repeat76 skips, fresh prepare0 operations, configuration rollback and reapply0 creates/6 updates pass with84 protected selections/669 rows unchanged. Detailed receipts and limitations: `ISSUE-376-platform-reviews.md` and `ISSUE-376-commercial-review.md`.

API remains on4000. Host is stopped after the thermal report. Issue stays In Dev: post-checkpoint Host verification, a completed production build, exact320px and complete authenticated browser transitions are pending. No further heavy build or type checker has run.
