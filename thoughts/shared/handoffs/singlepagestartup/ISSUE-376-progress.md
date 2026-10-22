---
issue_number: 376
issue_title: "Перенос визуала Storybook в Framework и доступ к закрытым виджетам"
start_date: 2026-10-22T22:34:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-376.md
status: complete
completed_date: 2026-10-22T23:57:42Z
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

<!-- incident-count: 6 -->

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
