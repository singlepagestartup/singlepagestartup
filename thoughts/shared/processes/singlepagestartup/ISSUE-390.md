---
issue_number: 390
issue_title: "Спроектировать в RBAC декларативные правила доступа к конкретным объектам"
repository: singlepagestartup
created_at: 2026-11-11T22:53:13Z
last_updated: 2026-11-11T22:55:28Z
status: active
current_phase: create
---

# Process Log: ISSUE-390 — Спроектировать в RBAC декларативные правила доступа к конкретным объектам

## Purpose

Спроектировать условные права на отдельные объекты в RBAC.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: core/10-research.

## Phase Notes

### Create

- Summary: Сверены чтение ролей в Subject, поле condition и маршруты чата. Связаны #303, #346, #347 и #352.
- Outputs: [GitHub #390](https://github.com/singlepagestartup/singlepagestartup/issues/390), статус Research Needed, локальный тикет в thoughts/shared/tickets/singlepagestartup/ISSUE-390.md.

### Research

### Plan

### Implement

## Incident Log

<!-- incident-count: 1 -->

### Incident 1 — Доступ к GitHub из песочницы

- Phase: Create
- Occurrences: 1
- Symptom: GitHub CLI не смог подключиться к api.github.com при поиске задач.
- Fix: Повтор штатной команды с сетевым доступом.

## Reusable Learnings

При проектировании условий доступа проверить существующую связь RolesToPermissions и обработку поля condition в Subject.
