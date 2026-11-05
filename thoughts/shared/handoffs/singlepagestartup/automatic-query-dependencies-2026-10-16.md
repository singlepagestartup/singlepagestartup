---
status: implemented_with_validation_limits
plan: thoughts/shared/plans/singlepagestartup/2026-10-16-automatic-query-dependencies.md
base: 9bc26719ff85a14de91813407f2198fdd42043ed
validation: thoughts/shared/research/singlepagestartup/2026-10-16-automatic-query-dependencies-validation.md
---

# Автоматические зависимости: состояние реализации

Этапы 1–9 реализованы: generated capture, read tracking, API cache, multi-instance dispatcher, SDK subscriptions/recovery, сложные consumers, Studio/production scroll и документация. Работа остаётся в режиме compatibility с legacy bridge. Полный отчёт содержит автоматические результаты, браузерные сценарии, метрики и ограничения.

## Проверка

Два участника общего чата, несвязанный чат, create/edit/delete, восстановление после остановки API, revoke/restore membership и корзина 125 → 250 T проверены. Dev — Chrome/Webpack; production — Chrome и in-app browser. Окончательная отправка обычным участником сохраняет enriched Message DTO, без Permission error. Production/Storybook builds проходят; окончательные RBAC tests — 144 suites / 764 passed. API TypeScript: 20 существующих diagnostics против 22 в HEAD.

Два API-процесса, 20 commits: спокойный p95 invalidation 91.08 ms. Order total p95 baseline no-store 7.698 ms, current no-store 17.756 ms, warm cache 4.113 ms. Бюджет no-store +20% не выполнен. Production React profiling, полная Host rendering matrix и SQL lock-wait profiling не подтверждены; ручная приёмка открыта.

## Рабочее окружение

Собственные fixtures удалены, все 10 записанных сущностей отсутствуют. Тестовые API 4005/4006/4007, production Host и Storybook остановлены. Обычный API dev возвращён на 4000, Host Webpack dev — на 3000 с heap 8192 MB и отключённым дисковым Webpack cache. Турбо-режим локально давал Rust panic. Скриншоты и сырые измерения находятся в gitignored `.artifacts/consistency`, логи — `/private/tmp/sps-consistency-*`.

Пользовательские uploads и документы ISSUE-373 сохранены. Generated migrations установлены локально; data snapshots не изменены. Production deployment и переключение режима не выполнялись.
