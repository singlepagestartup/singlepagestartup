---
issue_number: 416
issue_title: "Типизированный доступ к сервисам нижележащих модулей через this.modules"
repository: singlepagestartup
created_at: 2026-11-18T19:15:00Z
last_updated: 2026-11-18T19:23:00Z
status: active
current_phase: research
---

# Процесс работы над типизацией сервисов

## Purpose

Зафиксировать результаты исследования, проверки и переходы между этапами.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: проверка исследования, затем Core 20.

## Phase Notes

### Create

Задача #416 зарегистрирована в Project 2 и переведена в Research Needed. Тикет — thoughts/shared/tickets/singlepagestartup/ISSUE-416.md. Основание для новой ветки — слияние #415 в main, коммит 1a173118d580f6520ccd93eaf2aa7bacdac60879.

### Research

GPT-6.2 Sol с усилием xhigh исследовал создание экземпляров и переопределение startup, генерацию модулей, моделей и связей, проверки зависимостей и права Subject. Проверены 176 bootstrap-файлов. TypeScript-проба подтвердила доступ к методу startup через тип фабрики. Сравнение объектов в процессе Bun подтвердило, что Agent получает экземпляр основного Order.

Результат — [исследование](../../research/singlepagestartup/ISSUE-416.md). В Project 2 установлен статус Research in Review. [Комментарий в GitHub](https://github.com/singlepagestartup/singlepagestartup/issues/416#issuecomment-6989084179).

### Plan

### Implement

## Incident Log

<!-- incident-count: 1 -->

### Incident 1 — Загрузка undici при проверке идентичности в Bun

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: При импорте реальных сервисов тестовый процесс Bun 1.3.6 не предоставил worker_threads.markAsUncloneable, используемый undici.
- **Root Cause**: Метод отсутствует в использованной версии Bun.
- **Fix**: Проба идентичности выполнилась с локальной заглушкой в памяти процесса. Сетевые операции в этой пробе не проверялись.
- **Preventive Action**: Для воспроизведения отделять тест сборки объектов от проверки транспортного адаптера.
- **References**: libs/shared/backend/api/src/lib/app/bootstrap.spec.ts, раздел проверок в исследовании.

## Reusable Learnings

Для проверки доступности метода startup достаточно виртуального исходника TypeScript. Для проверки идентичности нужен отдельный запуск с реальными биндингами.
