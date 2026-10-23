---
issue_number: 376
issue_title: "Перенести визуал Storybook в Framework с сохранением функциональности и исправить доступ к закрытым виджетам"
repository: singlepagestartup
created_at: 2026-10-22T21:58:34Z
last_updated: 2026-10-23T22:31:08Z
status: active
current_phase: implement
---

# Process Log: ISSUE-376 — перенос визуала Storybook в Framework

## Purpose

Сохраняет результаты этапов и условия продолжения работы над переносом Framework.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: root сохраняет commit/checkpoint и подтверждает GitHub переход Code Review. Independent final review PASS; issue остаётся In Dev до проверенного перехода.

## Current round — platform follow-up, 2026-10-24

Baseline implementation `18f454fef1`, documentation `922d823da6`; текущие guard и
Category CSS corrections описаны ниже. Pro стоит 29 USD или 1900 RUB в месяц за 5000 токенов; пять
RUB packs по 0.13 RUB/token применены с verify/repeat/rollback/reapply. Все 84
protected selections/669 rows сохранены,7 old Pro Orders читаются; после
fixture cleanup fresh commercial prepare снова даёт 0 operations. Free 3000 —
внутренний once-only grant; AI consumption math не менялся.

Next/Nx production target завершён: build ID `MKpFtIHdiJJQqecTuXDQO`, types,
static generation 8/8, manifests и итоговый route table. Built Host дал 36/36 HTTP 200,
maximum 0.826 s, без error/private markers. Supervisor outer exit 1 вызван
post-exit signalling race; final RSS receipt отсутствует, sample 2803.1 MiB
при 516.7 s не определяет полный максимум. Повторная компиляция ради receipt
не требуется.

Built browser подтверждает публикацию/feed/UUID author/menu и очистку трёх
полей draft после A logout/B login, guest editor gate и B private denial,
console errors 0. Реальные auth/API receipts подтверждают one Profile/Free 3000
для A/B, Article replay и foreign denials. B registration 201; A 500 возник
после commit из-за временного JWT adapter mismatch, затем normal login A
работает. Guard 20/20 и real private Hono/PostgreSQL/Redis/cache/bytes 1/1 PASS.

Cleanup:92 fixture IDs удалены, pre-existing drift 0, nonfixture hashes сохранены.
Read-only review подтверждает отсутствие обоих fixture Subjects; четыре
сохранённых default Subjects без references по 12 FK columns совместимы с
обычными orphan guests, их origin не установлен. Temporary harness остановлен
через USR2. Обычные API/Host dev sessions 19270/6711 восстановлены; Host Ready 6.2 s
при 1536 MiB heap/1024 MiB native target/2 threads. Framework cold HTTP 200 —83.643 s, Category 200 —1.093 s; authenticated
consistency lag/pending/failures 0, degraded false.

Issue остаётся In Dev. Production build предшествует двум class-only Category
исправлениям. Их source review, generated 16/9 CSS и desktop/actual 320 px geometry
PASS. Итоговый independent review от code_review_readiness — PASS;
ожидается root commit/checkpoint и проверенный GitHub Code Review transition.
PR/push/merge отсутствуют. Подробности: platform-reviews и browser-r 2 artifacts;
записи прежних приёмок ниже относятся к указанным ревизиям.

## Phase Notes

### Create

- Summary: Ticket охватывает визуал Framework, товаров/категорий, CRM, блога/статей и серверное исправление доступа к закрытым виджетам с сохранением текущей функциональности.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-376.md`; [GitHub issue #376](https://github.com/singlepagestartup/singlepagestartup/issues/376); GitHub Project #2, Research Needed.
- Notes: Priority high, size large, type refactoring. Основание создания — прямой запрос пользователя на Core issue, включая исправление доступа. Исходные Studio-варианты и аудит находятся в незакоммиченном checkout main; runtime-перенос и исправление доступа ещё не выполнены. Поиск issue по Storybook и Framework не дал совпадений.
- Project: `singlepagestartup`, organization Project #2. Целевой репозиторий — `singlepagestartup/singlepagestartup`; контекст получен через `.claude/helpers/load_config.sh`.
- Verification: Issue открыт, label `size:large`, опубликованный body соответствует подготовленному тексту. Точная связь с Project подтверждена через `repository.issue.projectItems`; после переходов Triage → Research Needed итоговый статус подтверждён `gh issue view --json projectItems`. Первоначальное чтение общим списком не видело запись; текущий fallback и восстановление описаны в Incident 2.

### Research

- Summary: Исследованы текущие runtime-композиции и воспроизведена анонимная выдача закрытого demo Widget через API. Визуальная база — `652cabd9bf`, workflow lookup — `375b370333`, гостевое чтение своего аккаунта — `710ae5329d`. Авторы — агенты `research_runtime` (core-10-research) и `research_access` (исследование доступа); независимая проверка — `phase_reviewer` (review-pr).
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-376.md`; research summary в GitHub issue.
- Notes: Research завершён и независимо проверен агентом phase_reviewer: PASS; запись в `ISSUE-376-reviews.md`. Переходы Research in Review → Ready for Plan → Plan in Progress подтверждены. Исходный статус Research in Progress подтверждён штатными helpers после исправления lookup fallback. Ветка — `codex/issue-376-framework-visual`. Пользователь разрешает автономные промежуточные проверки и переходы после независимого review-pr; финальная остановка — Code Review для пользователя. PR не создаётся и ветка не публикуется. Эта инструкция заменяет промежуточные ручные подтверждения и стандартную финализацию через PR.

### Plan

- Summary: План из шести фаз подготовлен. Автор — агент planner с core-20-plan; проверка — phase_reviewer с review-pr, независимо от автора. Явные association semantics, фиксированный subscription period, scoped content API, защищённые bytes и SDK cutover определены без открытых вопросов.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-376.md`; summary в issue.
- Notes: Пользователь делегирует промежуточные подтверждения, поэтому проверка плана выполняется независимым агентом вместо повторного запроса согласия. Первый review требует доработки: delivering не должен восстанавливать отозванную роль, Invoice.createdAt должен быть неизменяемым для порядка paid invoice. План возвращён Plan in Progress, исправлен автором и повторно принят phase_reviewer: PASS. Runtime-реализация этим review не подтверждается.

### Implement — current platform round

- Summary: R2 implementation, saved cutovers, completed production target, scoped browser/auth API, cleanup и Category desktop/320 px проверены. Independent final review code_review_readiness — PASS; workflow transition ожидается.
- Outputs: `ISSUE-376-progress.md`, `ISSUE-376-platform-reviews.md`, commercial input/reviews, client-boundary и final source review reports.
- Verification: Next/Nx build `MKpFtIHdiJJQqecTuXDQO`,36 built HTTP 200, Article/account browser flow,20 access tests и real private cache/bytes matrix 1/1 PASS. Fixture cleanup и fresh commercial prepare 0/84 protections проверены. Build предшествует двум Category class-only changes; их source, generated CSS и desktop/320 px geometry PASS.
- Notes: Independent final review PASS. Issue остаётся In Dev до root commit/checkpoint и подтверждённого перехода Code Review; пользователь принимает конечный результат. PR/push/merge отсутствуют.

### Implement — historical first delivery, 2026-10-22

- Summary: Все шесть фаз реализованы и проверены на codex/issue-376-framework-visual. Website Builder 84087145cf, backend 6d7e1f09c9, frontend cb4296b6f0, cutover 6a9be42bb6. Раздельные авторы и независимые review-pr закрыли замечания до итогового PASS phase_reviewer против 6a9be42bb6.
- Outputs: Progress/handoff; ISSUE-376-implementation.md, ISSUE-376-browser.md, ISSUE-376-reviews.md; действующий локальный Host :3000, API :4000 и Storybook :4321.
- Verification: Frozen Host build и полный Studio validation exit 0; actual API/PostgreSQL/Redis access matrix и functional CRM/dummy checkout, focused frontend/SDK/period suites PASS. Final browser desktop/320, EN/RU, cart CRUD, saved schema/content, guest gate и not-found UI PASS, console errors/warnings 0. Локальный SDK apply/repeat/rollback/reapply принят. API TypeScript сохраняет 20 полных baseline diagnostics, новых нет; исходный Next streaming transport HTTP 200/noindex для not-found не менялся.
- Notes: Final preflight PASS поддерживает передачу на человеческий Code Review, но не заменяет его. Browser paid session, CRM Submit и внешние доставки/платежи не заявляются; API/React/service tests покрывают соответствующие границы. PR/push/merge нет. Generated Order/capture migrations, exact private classification и два public Blog GET prerequisites входят в rollout; snapshots не менялись. Apply/rollback требуют exclusive CMS window, общий conditional PATCH не добавлен.

## Incident Log

<!-- incident-count: 30 -->

### Incident 1 — GitHub недоступен из sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Preflight и GitHub-чтения сообщают `error connecting to api.github.com`.
- **Root Cause**: Ограничение сетевого доступа sandbox; тот же bash-блок успешно выполняется с network escalation.
- **Fix**: Повторить исходный блок с `require_escalated`, сохранив загрузку config и helper sequence.
- **Preventive Action**: При этой ошибке использовать предусмотренный skill повтор с escalation. Проверять содержимое ответов: текущий `gh_retry` может вернуть exit code 0 после ошибки, поэтому один код завершения не подтверждает результат GitHub-операции.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.claude/helpers/gh_retry.sh`.

### Incident 2 — Список Project не содержит созданную запись

- **Phase**: Create
- **Occurrences**: 5
- **Symptom**: После успешного создания issue и добавления в Project helpers установки/чтения статуса не находят issue #376. Ответ `gh project item-list --limit 1000` содержит 112 записей без этого issue.
- **Root Cause**: Helpers ищут item только в общем списке. Прямой GraphQL-запрос к тому же issue подтверждает существующий неархивированный item в нужном organization Project #2; причина расхождения ответов GitHub не установлена.
- **Fix**: Без повторного создания issue получить item через `repository.issue.projectItems`. Сверить полный issue URL, Project URL/owner/number, node ID и единственность записи. После загрузки config и проверки artifact context применить штатную операцию `gh_retry project item-edit` с IDs Status/options этого Project для Triage и Research Needed. Итог проверить прямым чтением issue. Для последующих этапов resolver дополнен fallback к точным issue memberships: `.claude/helpers/get_project_item_id.sh`; status helper использует этот resolver. Проверены 10 isolated regression tests и живой переход Research Needed → Research in Progress. Коммит `375b370333`.
- **Preventive Action**: После частичного успеха creation helper проверять issue и его точные projectItems, чтобы не создавать дубликаты. При отсутствии новой записи в общем списке использовать проверку точной связи перед восстановлением статуса; не ослаблять проверку репозитория или Project.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/get_project_item_id.sh`, `.claude/helpers/get_issue_status.sh`; issue #376, item `PVTI_lADOB3eWkc4A1nYszhC1yjQ`, Project `PVT_kwDOB3eWkc4A1nYs`.

### Incident 3 — Peer report не передан автору сводного исследования

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: Сводный research ожидал готовый отчёт доступа, уже завершённый другим агентом.
- **Root Cause**: Final answer дочернего агента доставляется root; другие дочерние агенты не получают его автоматически.
- **Fix**: Автор доступа передал полный отчёт через явное сообщение и scratch-файл; сводный research завершён.
- **Preventive Action**: Для зависимых подзадач указывать явного получателя отчёта; root проверяет доставку, а не только completed агента.
- **References**: агенты research_access, research_runtime; `thoughts/shared/research/singlepagestartup/ISSUE-376.md`.

### Incident 4 — Сообщение не запускает завершённого агента

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: Backend автор оставался completed после сообщения GO.
- **Root Cause**: send_message доставляет текст, но не запускает новый turn завершённого агента.
- **Fix**: Отправлен followup_task; автор подтвердил запуск и создал SDK/service contracts.
- **Preventive Action**: Для completed агента использовать followup_task и дождаться подтверждения начала.

### Incident 5 — Nx worker и локальные соединения

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: Nx зависает при изоляции plugins; миграция и HTTP/read probes не соединяются с localhost в sandbox.
- **Root Cause**: Ограничения окружения запуска.
- **Fix**: NX_DAEMON=false NX_ISOLATE_PLUGINS=false; конкретные локальные DB/socket команды повторены с escalation. Миграция сгенерирована штатным repository-generate и применена.
- **Preventive Action**: Использовать эти Nx флаги; не менять runtime-код ради sandbox соединения.

## Reusable Learnings

- Для issue по локальному визуалу указывать точные source paths и Storybook IDs, а также состояние Git. Незакоммиченные материалы и снимки `/tmp` требуют доступной ревизии перед продолжением research.
- Состояния закрытого блока в Storybook подтверждают presentation; серверные права, прямые API-чтения и кэши проверяются отдельно.

## Verification baseline

- Studio TypeScript: passed. Design system: 141 tests passed in sandbox; единственный socket preview test прошёл отдельно с network escalation (142 суммарно).
- Host TypeScript: passed до runtime-переноса. Module dependencies: 14772 source files, 0 violations.
- Existing own-Subject controller: 13 tests passed; route matcher: 9; consistency-cache: 5. Workflow lookup: 10 isolated tests и live status transition passed.
- Sandbox запрещает loopback/listen: read probes и socket tests повторяются с escalation. Это ограничение среды, без изменения приложения.

### Incident 6 — Native Date и точный deadline

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Real API matrix обнаружила преждевременный отказ на millisecond boundary.
- **Root Cause**: String(native Date) теряет миллисекунды.
- **Fix**: Native Date → getTime; unit boundary и реальная matrix PASS.
- **Preventive Action**: Проверять точный deadline с фактическим типом PostgreSQL driver.

### Incident 7 — Холодный Host и invalidation churn

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: Dev Ready без готовой страницы во время параллельных edits.
- **Root Cause**: Существующий большой catch-all/Admin graph и повторные compile после edits. Новые циклы/package edges не найдены; одна задержка ответа после compile остаётся без точной причины.
- **Fix**: Изолированный production dist, frozen build/start; HTTP 200 и browser verification.
- **Preventive Action**: Подтверждать работу HTTP и UI, сохранять стабильные sources при финальной сборке.

### Incident 8 — Cart drawer layout

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Price/Interval/Topup сжаты до нескольких букв в строке.
- **Root Cause**: Product cart grid-cols-3 внутри узкого drawer.
- **Fix**: Вертикальный compact layout и адаптивная ширина drawer; browser recheck ожидается.
- **Preventive Action**: Проверять заполненную корзину desktop/320 px, сохраняя реальные actions и attributes.

### Incident 9 — Отсутствующие публичные GET Blog relations

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: `/en/blog` возвращал 500 из-за 403 `/api/blog/widgets-to-categories`.
- **Root Cause**: Сохранённого GET permission нет; соседние count и widgets-to-articles уже public. Исходный snapshot также не содержит его. Новый private guard запрос пропускает; отказ происходит в общем RBAC.
- **Fix**: Локальный operator Permission SDK создал точные roleless GET widgets-to-categories (4cea3bc3-1549-40da-8cf5-c166f2eec7b8) и categories-to-website-builder-module-widgets (c4ed950e-6d6d-48f6-bec8-1a172913ee6f). Оба anonymous GET 200. Полный аудит 14 list/count reads семи Blog relations отделяет отсутствующие permissions от private guards. Существующие публичные Category links и последующие writes не могут переиспользовать private graph.
- **Preventive Action**: Проверять фактические разрешения saved Blog graph; документировать targeted SDK repair, не расширять Subject routes или global bypass.

### Incident 10 — Studio Order projection отстаёт от schema

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: studio:validate catalog test не находит четыре добавленных server-owned поля Order.
- **Root Cause**: Локальная Studio projection имеет прежний набор metadata fields.
- **Fix**: ReadSchemaFields обновил только Order admin-v2-table schema, records получили null, IRecord содержит четыре nullable поля. Полный studio:validate прошёл, включая loopback preview.
- **Preventive Action**: После generated schema migration синхронизировать локальную Studio projection, сохраняя authored UI и значения записей.

### Incident 11 — ESLint heap и targeted cleanup

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: ESLint 221 изменённого TypeScript-файла завершился V8 heap error с default heap.
- **Root Cause**: Typed parser загружает полный monorepo project.
- **Fix**: Повтор с NODE_OPTIONS=--max-old-space-size=8192 завершил анализ. Пять файлов требовали объединения imports, удаления ссылки на отсутствующее lint rule и форматирования; исправленные файлы повторно прошли ESLint exit 0.
- **Preventive Action**: Для полного typed project выделять достаточный heap; правила не отключать ради результата. Исправления imports/types/comments/formatting не меняют исполняемую семантику final build.

## Historical human review handoff — 2026-10-22

- GitHub status: Code Review, verified 2026-10-22T23:58:52Z через shared update/get helpers.
- Summary: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6353992295.
- Issue открыт. Человеческий review ожидается; PR, push, merge и Done не выполнялись.

## Blog follow-up

Source: user feedback after first Code Review handoff. Scope: six useful Next.js/Hono articles, Frontend/Backend/DevOps, generated covers, real authors/categories, default navbar matching Studio and whole-card navigation. Existing private demo is rewritten in place; unrelated protected associations remain intact. Root owns local SDK publication, content_frontend owns Blog/Social/Host slots, host_compile_diagnosis owns navbar, planner drafts technical EN/RU content, research_runtime owns publication tool, phase_reviewer independently reviews. Final handoff remains human Code Review without PR/push/merge.

### Incident 12 — Plain Profile subtitle

- **Phase**: Blog follow-up
- **Occurrences**: 1
- **Symptom**: Новый byline давал TipTap parse warnings.
- **Root Cause**: Profile.subtitle штатно редактируется как текст, renderer ожидал JSON.
- **Fix**: Существующий getLocalizedPlainText и paragraph; исходные plain данные восстановлены через SDK. Независимые plain/legacy EN/RU tests и чистая финальная browser console подтверждены.
- **Preventive Action**: До выбора renderer читать owning form/schema и существующие consumers.

### Incident 13 — ENOSPC при final build

- **Phase**: Blog follow-up
- **Occurrences**: 1
- **Symptom**: Webpack не смог записать дисковый cache.
- **Root Cause**: Несколько task outputs и большой cache заняли доступное место.
- **Fix**: Только неактивные task dist удалены; existing cache-off flags дали финальную сборку размером 185 MB с exit 0 без source changes.
- **Preventive Action**: Для разовой приёмки проверять место и использовать существующий режим без дискового webpack/Nx cache.

## Historical Blog follow-up handoff — 2026-10-23

- Implementation: completed; source 129dd65f92.
- Independent review-pr: PASS.
- Data: 6 Articles / 3 Categories / 8 retired, repeat 0 writes, fresh 0 operations, private fingerprint unchanged.
- Runtime: frozen build PASS;27 Host 200 responses + 5 API checks; scoped desktop/320 browser PASS, console 0 warnings/errors.
- Artifacts: ISSUE-376-blog-followup.md, ISSUE-376-blog-content.json, appended reviews/browser evidence.
- GitHub: Code Review, verified 2026-10-23T08:39:01Z; https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6360936917.
- Human Code Review остаётся пользователю; PR/push/merge/Done отсутствуют.

## Platform follow-up — пользовательский Code Review

Source: девять browser comments в текущей Codex-сессии.

Scope: GitHub source links; актуальный S-logo и Framework landing link; footer/header navigation с AI Chat; гостевой вход и меню профиля; создание статьи с server-owned Social author; регистрация обеспечивает Profile; публичные авторы/портфолио вместо Subjects; Chats доступен из профиля; About по Studio Products Code Framework; каталог Free implicit 3000 once / monthly Pro 5000 за 29 USD/1900 RUB / пять RUB topups по 0.13 RUB/token / Landing $100 / Startup from $2000. Коммерческие параметры подтверждены пользователем и применены; финальные runtime gates остаются открытыми.

Research owners: research_access — registration/ownership/public-author API; content_frontend — account/author/editor/Studio; host_compile_diagnosis — saved shell/About; research_runtime — catalogue/credit lifecycle. Root — content links, SDK publication, workflow. Planner — core-20-plan, phase_reviewer — независимый review-pr. PR/push/merge отсутствуют; конечный Code Review выполняет пользователь.

GitHub Code Review → Research Needed → Research in Progress проверен shared helpers. Scope comment: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6371892799.

Research platform follow-up: PASS by phase_reviewer at 55af94890b. Reports and exact graph retained in ISSUE-376-platform-followup.md; review in ISSUE-376-platform-reviews.md. Public Profile UUID, raw GET privacy guards, scoped historical Chat badges, atomic Article ownership, additive wallet and once-only Free are required plan criteria.

Historical research handoff: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6372463266. Research in Review → Ready for Plan → Plan in Progress verified at that stage. The canonical platform plan subsequently passed independent review and now tracks the remaining R2.6 gates.

### Incident 14 — Free checkout transport in transaction

- **Phase**: Platform Plan
- **Occurrences**: 1
- **Symptom**: Независимый review-pr отклонил общую Subject-блокировку вокруг текущего Free checkout.
- **Root Cause**: Checkout использует loopback SDK/provider/Observer; эти записи не входят в ambient DB transaction, а callback может ждать ту же блокировку.
- **Fix**: План определяет отдельную internal direct-Service операцию для zero-price graph, принятия Invoice, Role и credit в одной транзакции, с эффектами после commit. Публичная author pagination дополнена отдельным safe count API.
- **Preventive Action**: До обещания атомарности прослеживать транспорт каждого owning Service и порядок locks; HTTP и polling не включать в DB transaction.

Historical Plan PASS, 2026-10-23: phase_reviewer, /tmp/sps-376-round2-plan-review.md, archived in ISSUE-376-platform-reviews.md. Both transaction/count findings resolved in 3e6447dbf9. Implementation was authorized at that checkpoint; commercial input was still pending then. Its confirmed application is recorded in the current checkpoint.

### Incident 15 — Machine restart during parallel implementation

- **Phase**: Platform Implement
- **Occurrences**: 1
- **Symptom**: Пользователь сообщил о выключении компьютера; API/Host и агенты остановились, файлы /tmp исчезли.
- **Root Cause**: Не установлена. После перезагрузки наблюдались load average 434, около 5 ГБ swap на машине с 18 ГБ RAM и высокая нагрузка процессов VS Code. До перезагрузки свободное место составляло около 2,4 ГБ. Эти наблюдения не устанавливают причину выключения.
- **Fix**: Изменения в ветке сохранены. Восстановление выполняется двумя source-only агентами и root; build, TSC, lint, Nx и серверы не запускаются параллельно. Временные результаты проверок не считаются подтверждёнными.
- **Preventive Action**: Запускать тяжёлые проверки по одной после оценки ресурсов; хранить итоговые результаты в постоянных артефактах, ограничивать количество процессов. Не выключать сторонние приложения и не удалять пользовательские кэши.

Historical recovery input, 2026-10-23 before period confirmation: пользователь подтвердил Pro 29 USD или 1900 RUB и сохранение текущего расчёта списаний AI; период ещё ожидался на том checkpoint. Текущие подтверждённые условия — месяц и5000 токенов — уже применены; Products rate/top-up sums сохранены.

Historical recovery verification (2026-10-23, before platform publication): API source typecheck, serial Node heap 3072 MiB, exits 2 with 20 known diagnostics after new author/SDK/Free type corrections. Studio typecheck exits 0 at the same cap. Host typecheck found six unsupported legacy admin props; those props were removed and final source recheck remained pending at that checkpoint. Code placement passes; module dependency audit covers 15,197 sources with zero violations. R2.1 scoped Chat/controller tests: 15 in five suites; Social author/Chat display: eight in two suites; catalog/Profile reader/Chat loader: 35 in three suites. These focused tests pass and do not substitute for RSC/browser verification.

At that recovery checkpoint, actual PostgreSQL credit tests passed: two suites, six cases, bounded serial execution; disposable fixtures were cleaned up. Generated Blog/Social Widget→Website Builder migrations and consistency capture 0009 (158 resources) were applied locally. The canonical SVG was uploaded through the File SDK and its 1739 bytes matched the repository source exactly. New public content had not yet been applied. Its later publication and the required npm API/Host dev verification are recorded in the current checkpoint.

Historical cache checkpoint, 2026-10-23: the real PostgreSQL/Hono scenario reproduced stale public author list/count/detail after first publication in legacy cache mode. Consistency cache dependency generations updated correctly. The canonical legacy HTTP-cache exclusions cover only the named public author GET/HEAD family; the consistency cache retains its actual Service dependency tracking. The rerun and independent re-review were still pending at that checkpoint. Subject's direct Free graph writes receive effective lower module Services instead of activating generic CRUD wrappers. Subsequent verification evidence belongs to ISSUE-376-platform-reviews.md.

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

Historical pre-commercial checkpoint, 2026-10-24: monthly Pro terms were confirmed. Normal SDK publication of the shell/About/Authors/article form/source links and two service Products was verified, including repeat/rollback/reapply. The Category policy follow-up verified applied. The actual dev Host responses and authorized browser cart/navigation/private gate checks passed for the stated scope in ISSUE-376-platform-reviews.md. Studio/Workspace presentation tests passed380/380; both validators, Studio TypeScript, scoped lint, code placement and module order passed. API TypeScript retained20 baseline diagnostics. Production build and commercial application were still open at that checkpoint; commercial application has since passed its scoped acceptance.

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

### Incident 22 — Numeric token values used a text Attribute Key

- **Occurrences**: 1
- **Stage**: Commercial browser readback
- **Symptom**: The five new packs displayed `Topup —` although their descriptions and numeric credits were correct.
- **Root Cause**: Their shared legacy Topup Key selected `string`; the six new managed Attributes populated `number`. Fulfillment reads `number` directly.
- **Fix**: Independent review accepted one new numeric `Tokens` Key and six exact association switches. Local SDK apply/verify, repeat7 skips and fresh prepare0 pass with84 protected selections unchanged. Browser EN/RU confirms all five numbers and Pro5000.
- **Preventive Action**: Match Attribute value storage to Key.field and verify both the rendered field and its owning calculation; preserve historical Keys and paid data.

### Incident 23 — A single Category cover occupied half the content width

- **Occurrences**: 1
- **Stage**: Current Category browser acceptance
- **Symptom**: A newly populated single cover rendered as an unframed600px image below the full-width category header.
- **Root Cause**: The transferred gallery always used two desktop columns and had no media frame; Studio's default example omitted media.
- **Fix**: Studio includes single/multiple/no-media examples. The matching runtime uses full width for one active cover, two columns for multiple covers and rounded aspect-video frames. Independent source review passes; built-Host readback remains required.
- **Preventive Action**: Populate optional media in Studio before accepting the transfer and check zero, one and multiple records.

### Incident 24 — A fixed relation renderer could expose hidden Category covers

- **Occurrences**: 1
- **Stage**: Independent review of the Category cover correction
- **Symptom**: Source review found that selecting the default renderer for every loaded link would render records whose saved variant was hidden.
- **Root Cause**: The new renderer selection ignored relation visibility, and hidden records also affected the number of columns.
- **Fix**: The existing relation find now filters exact Category ID and variant=default before counting or rendering. Hidden records remain saved. Independent reread passes; the faulty revision was not applied to the running Host.
- **Preventive Action**: Check all saved relation variants when changing a renderer; apply visibility before layout counts and preserve retired records.

### Incident 25 — Supervisor signals an already-exited build group

- **Occurrences**: 1
- **Stage**: Platform production verification
- **Symptom**: The outer supervisor exits 1 with EPERM after Next/Nx reports a successful build; its final resource receipt is absent.
- **Root Cause**: The child exits between the supervisor's status check and process-group signalling.
- **Fix**: The temporary supervisor checks child completion after the signalling race. Build ID/manifests and the full target log establish completion; sampled 2803.1 MiB at 516.7 s is retained without claiming a complete peak.
- **Preventive Action**: Record compiler result and supervisor result separately; do not recompile solely to repair resource bookkeeping.

### Incident 26 — Temporary CLI flag collides with bcrypt tooling

- **Occurrences**: 1
- **Stage**: Real registration harness startup
- **Symptom**: The temporary API harness fails during bcrypt/node-pre-gyp startup.
- **Root Cause**: Its generic `--directory` option collides with the dependency's CLI option handling.
- **Fix**: The harness uses `--fixture-state-dir`; the failed process is gone and baseline/fixture absence checks pass before retry. Environment files and application behavior are unchanged.
- **Preventive Action**: Use task-specific CLI names and verify the harness starts before creating fixture accounts.

### Incident 27 — Named Identity action treated as a UUID record

- **Occurrences**: 1
- **Stage**: Real registration acceptance
- **Symptom**: Registration returns 403 before creating rows; PostgreSQL reports 22P02 for `email-and-password`.
- **Root Cause**: The global protected-content mutation guard passes an action segment to the Identity `findById` lookup.
- **Fix**: Only the existing accepted normalized UUID shape becomes recordId. Named mutations still undergo body/private-reference checks and normal route authorization. Independent source review,20 access tests and the real registration retry pass in their stated scope.
- **Preventive Action**: Test named collection actions through the global middleware, alongside UUID aliases, bulk mutations and protected-reference rejection.

### Incident 28 — SIGTERM bypasses temporary harness cleanup

- **Occurrences**: 1
- **Stage**: Temporary API shutdown
- **Symptom**: SIGTERM reaches an imported provider's immediate-exit handler before temporary harness cleanup completes.
- **Root Cause**: The process shares dependency signal handlers whose exit behavior precedes the harness teardown.
- **Fix**: The temporary harness handles USR2 for awaited cleanup and shutdown. Normal API startup is restored; recorded fixture IDs are absent and nonfixture hashes are preserved.
- **Preventive Action**: Inspect imported signal behavior and use an explicit awaited teardown path for disposable full-app harnesses.

### Incident 29 — Temporary JWT resolver fails after registration commit

- **Occurrences**: 1
- **Stage**: Real registration acceptance
- **Symptom**: A's registration returns 500 after its Identity/Profile/Free graph has committed.
- **Root Cause**: The temporary global Hono JWT resolver differs from the project's canonical verification adapter.
- **Fix**: The harness uses canonical verifyJwt/project rules. A's normal UI login succeeds; B registration returns 201, and both have one Profile/Free graph and 3000 tokens. A's response remains documented as 500, not 201.
- **Preventive Action**: Reuse the project's transport adapter; after an uncertain response inspect committed ownership/credit state before retrying account creation.

### Incident 30 — Named aspect utility is absent from the Tailwind preset

- **Occurrences**: 1
- **Stage**: Built Category browser acceptance
- **Symptom**: `aspect-video` computes to `auto`; a Category cover is 1216 × 1216 on desktop and 272 × 272 at 320 px instead of 16:9.
- **Root Cause**: The configured aspect-ratio plugin has no named video token; source class presence alone does not create that CSS rule.
- **Fix**: The two runtime/Studio views use `aspect-[16/9]` and an absolute media child. Narrow source, generated 16/9 CSS and desktop geometry pass; actual 320 px frame 272 × 153, computed 16/9 and document widths 320 pass. Console errors are absent; viewport/zoom are restored and the QA tab is closed. The completed production build predates this class-only change.
- **Preventive Action**: Check generated utilities and computed geometry with real media; keep this token issue separate from Incident 23's single-cover column layout.

Historical thermal checkpoint — 2026-10-24, after the build stop and before the current dev restart: no Host or production compiler was running. API remained on4000 through npm run api:dev. User confirmed cooling after the build stop. Client-boundary review is recorded in ISSUE-376-rbac-client-boundary-review.md; independent root/Host/source acceptance is in ISSUE-376-final-source-review.md. The new Blog Provider cycle is removed through its narrow public alias; the unfiltered empty Popular fallback is removed. Production acceptance, commercial application and final Code Review handoff were still pending at that checkpoint.

## Current checkpoint — R2 acceptance evidence, 2026-10-24

Commercial configuration, legacy Order reads and all 84 protected selections
remain verified after fixture cleanup: fresh preparation has 0 operations.
Production target `MKpFtIHdiJJQqecTuXDQO` completed types/static generation 8/8 and serves 36
HTTP 200 checks. The supervisor's separate outer exit 1 and missing full RSS
receipt are recorded in Incident 25. No recompile is needed for bookkeeping.

Named Identity actions now reach their owning controller without a non-UUID
record lookup; all body/private-graph guards remain. Independent narrow source
review and 20/20 access tests in 1.401 s pass. Actual private Hono/PostgreSQL/
Redis/both-cache/bytes matrix 1/1 passes in 22.233 s; six final files pass ESLint.
B's real registration is 201; A's graph committed before temporary adapter 500,
then A's ordinary login succeeds. Both fixtures have one Identity/Profile/Free
Order/paid zero Invoice and 3000 tokens. Identical Article retry returns the
same graph; foreign collision 409 and cross-Subject 401 remain enforced.

Built-browser publication, feed/author/menu, draft disposal across logout/login
and B private denial pass within `ISSUE-376-browser-r2.md`. A paid-subscriber
browser session and new CRM submit are not claimed; their existing real service/
cache/bytes and persisted Request evidence remain separate. All 92 recorded
fixture IDs are removed with 0 baseline drift and captured nonfixture hashes
unchanged. Read-only review preserves four unrelated orphan default Subjects
with 0 references across 12 FK columns; their origin remains unassigned.

Normal API/Host dev sessions 19270/6711 are restored, Host Ready 6.2 s at 1536 MiB
heap/1024 MiB native target/2 threads. Category source/CSS/desktop/320 px acceptance after the two class-only edits
passes. Independent final review by code_review_readiness is PASS. Root commit/checkpoint
and the verified GitHub Code Review transition remain pending; issue is In Dev. No GitHub or status mutation is part of this checkpoint.
