---
issue_number: 376
issue_title: "Перенести визуал Storybook в Framework с сохранением функциональности и исправить доступ к закрытым виджетам"
repository: singlepagestartup
created_at: 2026-10-22T21:58:34Z
last_updated: 2026-10-22T22:03:17Z
status: active
current_phase: plan
---

# Process Log: ISSUE-376 — перенос визуала Storybook в Framework

## Purpose

Сохраняет результаты этапов и условия продолжения работы над переносом Framework.

## Phase Status

- Create: completed
- Research: completed
- Plan: in_progress
- Implement: not_started
- Current phase: plan
- Next step: Завершить core-20-plan, пройти независимый review-pr плана, при PASS перейти Ready for Dev.

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

- Summary: В работе. Автор — агент planner с core-20-plan; проверка — phase_reviewer с review-pr, независимо от автора.
- Outputs:
- Notes:

### Implement

- Summary: Не начат.
- Outputs:
- Notes:

## Incident Log

<!-- incident-count: 3 -->

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

## Reusable Learnings

- Для issue по локальному визуалу указывать точные source paths и Storybook IDs, а также состояние Git. Незакоммиченные материалы и снимки `/tmp` требуют доступной ревизии перед продолжением research.
- Состояния закрытого блока в Storybook подтверждают presentation; серверные права, прямые API-чтения и кэши проверяются отдельно.

## Verification baseline

- Studio TypeScript: passed. Design system: 141 tests passed in sandbox; единственный socket preview test прошёл отдельно с network escalation (142 суммарно).
- Host TypeScript: passed до runtime-переноса. Module dependencies: 14772 source files, 0 violations.
- Existing own-Subject controller: 13 tests passed; route matcher: 9; consistency-cache: 5. Workflow lookup: 10 isolated tests и live status transition passed.
- Sandbox запрещает loopback/listen: read probes и socket tests повторяются с escalation. Это ограничение среды, без изменения приложения.
