---
issue_number: 376
issue_title: "Перенести визуал Storybook в Framework с сохранением функциональности и исправить доступ к закрытым виджетам"
repository: singlepagestartup
created_at: 2026-10-22T21:58:34Z
last_updated: 2026-10-23T18:34:00Z
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
- Next step: реализовать R2.1–R2.6 и провести независимые проверки; R2.5b ожидает коммерческие параметры; конечный Code Review остаётся пользователю.

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

### Implement

- Summary: Все шесть фаз реализованы и проверены на codex/issue-376-framework-visual. Website Builder 84087145cf, backend 6d7e1f09c9, frontend cb4296b6f0, cutover 6a9be42bb6. Раздельные авторы и независимые review-pr закрыли замечания до итогового PASS phase_reviewer против 6a9be42bb6.
- Outputs: Progress/handoff; ISSUE-376-implementation.md, ISSUE-376-browser.md, ISSUE-376-reviews.md; действующий локальный Host :3000, API :4000 и Storybook :4321.
- Verification: Frozen Host build и полный Studio validation exit 0; actual API/PostgreSQL/Redis access matrix и functional CRM/dummy checkout, focused frontend/SDK/period suites PASS. Final browser desktop/320, EN/RU, cart CRUD, saved schema/content, guest gate и not-found UI PASS, console errors/warnings 0. Локальный SDK apply/repeat/rollback/reapply принят. API TypeScript сохраняет 20 полных baseline diagnostics, новых нет; исходный Next streaming transport HTTP 200/noindex для not-found не менялся.
- Notes: Final preflight PASS поддерживает передачу на человеческий Code Review, но не заменяет его. Browser paid session, CRM Submit и внешние доставки/платежи не заявляются; API/React/service tests покрывают соответствующие границы. PR/push/merge нет. Generated Order/capture migrations, exact private classification и два public Blog GET prerequisites входят в rollout; snapshots не менялись. Apply/rollback требуют exclusive CMS window, общий conditional PATCH не добавлен.

## Incident Log

<!-- incident-count: 21 -->

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

## Human review handoff

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

## Blog follow-up handoff

- Implementation: completed; source 129dd65f92.
- Independent review-pr: PASS.
- Data: 6 Articles / 3 Categories / 8 retired, repeat 0 writes, fresh 0 operations, private fingerprint unchanged.
- Runtime: frozen build PASS;27 Host 200 responses + 5 API checks; scoped desktop/320 browser PASS, console 0 warnings/errors.
- Artifacts: ISSUE-376-blog-followup.md, ISSUE-376-blog-content.json, appended reviews/browser evidence.
- GitHub: Code Review, verified 2026-10-23T08:39:01Z; https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6360936917.
- Human Code Review остаётся пользователю; PR/push/merge/Done отсутствуют.

## Platform follow-up — пользовательский Code Review

Source: девять browser comments в текущей Codex-сессии.

Scope: GitHub source links; актуальный S-logo и Framework landing link; footer/header navigation с AI Chat; гостевой вход и меню профиля; создание статьи с server-owned Social author; регистрация обеспечивает Profile; публичные авторы/портфолио вместо Subjects; Chats доступен из профиля; About по Studio Products Code Framework; каталог Free implicit3000 once / Pro5000 / token topups / Landing$100 / Startup from$2000. Цена/период Pro и пакеты пополнения уточняются через pending async question.

Research owners: research_access — registration/ownership/public-author API; content_frontend — account/author/editor/Studio; host_compile_diagnosis — saved shell/About; research_runtime — catalogue/credit lifecycle. Root — content links, SDK publication, workflow. Planner — core-20-plan, phase_reviewer — независимый review-pr. PR/push/merge отсутствуют; конечный Code Review выполняет пользователь.

GitHub Code Review → Research Needed → Research in Progress проверен shared helpers. Scope comment: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6371892799.

Research platform follow-up: PASS by phase_reviewer at 55af94890b. Reports and exact graph retained in ISSUE-376-platform-followup.md; review in ISSUE-376-platform-reviews.md. Public Profile UUID, raw GET privacy guards, scoped historical Chat badges, atomic Article ownership, additive wallet and once-only Free are required plan criteria.

Research summary: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6372463266. Research in Review → Ready for Plan → Plan in Progress verified. Canonical platform plan saved; independent review-pr in progress.

### Incident 14 — Free checkout transport in transaction

- **Phase**: Platform Plan
- **Occurrences**: 1
- **Symptom**: Независимый review-pr отклонил общую Subject-блокировку вокруг текущего Free checkout.
- **Root Cause**: Checkout использует loopback SDK/provider/Observer; эти записи не входят в ambient DB transaction, а callback может ждать ту же блокировку.
- **Fix**: План определяет отдельную internal direct-Service операцию для zero-price graph, принятия Invoice, Role и credit в одной транзакции, с эффектами после commit. Публичная author pagination дополнена отдельным safe count API.
- **Preventive Action**: До обещания атомарности прослеживать транспорт каждого owning Service и порядок locks; HTTP и polling не включать в DB transaction.

Platform Plan PASS: phase_reviewer, /tmp/sps-376-round2-plan-review.md, archived in ISSUE-376-platform-reviews.md. Both transaction/count findings resolved in 3e6447dbf9. Unblocked implementation authorized; R2.5b remains pending operator input.

### Incident 15 — Machine restart during parallel implementation

- **Phase**: Platform Implement
- **Occurrences**: 1
- **Symptom**: Пользователь сообщил о выключении компьютера; API/Host и агенты остановились, файлы /tmp исчезли.
- **Root Cause**: Не установлена. После перезагрузки наблюдались load average 434, около 5 ГБ swap на машине с 18 ГБ RAM и высокая нагрузка процессов VS Code. До перезагрузки свободное место составляло около 2,4 ГБ. Эти наблюдения не устанавливают причину выключения.
- **Fix**: Изменения в ветке сохранены. Восстановление выполняется двумя source-only агентами и root; build, TSC, lint, Nx и серверы не запускаются параллельно. Временные результаты проверок не считаются подтверждёнными.
- **Preventive Action**: Запускать тяжёлые проверки по одной после оценки ресурсов; хранить итоговые результаты в постоянных артефактах, ограничивать количество процессов. Не выключать сторонние приложения и не удалять пользовательские кэши.

Commercial input: пользователь подтвердил Pro 29 USD или 1900 RUB и сохранение текущего расчёта списаний AI. Период Pro ожидает ответа на отдельный вопрос; Products rate/top-up sums сохраняются.

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

Current follow-up checkpoint, 2026-10-24: monthly Pro terms are confirmed. Normal SDK publication of the shell/About/Authors/article form/source links and two service Products is verified, including repeat/rollback/reapply. The Category policy follow-up verifies applied. The actual dev Host responses and authorized browser cart/navigation/private gate checks pass for the stated scope in ISSUE-376-platform-reviews.md. Studio/Workspace presentation tests pass380/380; both validators, Studio TypeScript, scoped lint, code placement and module order pass. API TypeScript retains20 baseline diagnostics. Production build and commercial compatibility/application remain open; issue stays In Dev.

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
- **Fix**: A bounded saved-Invoice/interval projection and regression cases are under independent review. Commercial apply remains held until the correction passes review and tests.
- **Preventive Action**: Exercise historical paid, completed, canceled, OPEN and unbilled Orders before changing live Product currencies or intervals; preserve financial rows and fixed accepted periods.

### Incident 21 — Reported heating during production type checking

- **Occurrences**: 1
- **Stage**: Platform final runtime verification
- **Symptom**: The user reported strong computer heating after Webpack compilation completed in88seconds and the build entered type checking.
- **Root Cause**: Not established. The build's type worker used about100%CPU; VSCode Tailwind/Nx extensions and system cleanup also had high CPU. These observations do not establish an unsafe import or explain the earlier shutdown.
- **Fix**: Root stopped only its build processes53069,53070,53815. Host was already stopped for the isolated build; API remained running. Memory free rose to about60%, and the user confirmed that heating noticeably decreased. No further heavy build or type checker was started.
- **Preventive Action**: Keep checks serial and bounded; inspect process ownership and actual resources, stop task-owned work on a thermal report, and distinguish source review, completed compilation and a completed production build.

Current thermal checkpoint: no Host or production compiler is running. API remains on4000 through npm run api:dev. User confirms cooling after the build stop. Client-boundary review is recorded in ISSUE-376-rbac-client-boundary-review.md; independent root/Host/source acceptance is in ISSUE-376-final-source-review.md. The new Blog Provider cycle is removed through its narrow public alias; the unfiltered empty Popular fallback is removed. Full production acceptance, commercial application and final Code Review handoff remain pending.
