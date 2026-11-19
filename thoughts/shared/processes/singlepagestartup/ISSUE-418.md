---
issue_number: 418
issue_title: "Связать CRM-воронки, работу персонального ассистента и исполнение заказов"
repository: singlepagestartup
created_at: 2026-11-18T22:47:22Z
last_updated: 2026-11-19T08:08:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-418 — Связать CRM-воронки, работу персонального ассистента и исполнение заказов

## Purpose

Сохранить ход создания задачи и проверки требований перед ревью.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: complete implementation and submit PR

## Phase Notes

### Create

- Summary: Общее поручение для консультации, покупки и исполнения заказа.
- Outputs: GitHub #418 и thoughts/shared/tickets/singlepagestartup/ISSUE-418.md. Проект № 2, Triage → Research Needed.
- Notes: Тип feature, размер large, рабочий приоритет medium.

### Research

- Summary: Проверены профильная Knowledge, расчёт за ответ, checkout, выдача чеков, очередь и внешние аналоги.
- Outputs: [Исследование](../../research/singlepagestartup/ISSUE-418.md), [комментарий GitHub](https://github.com/singlepagestartup/singlepagestartup/issues/418#issuecomment-6994014613).
- Notes: Research Needed → Research in Progress → Research in Review. Итоговый статус проверен.

### Plan

- Summary: Семь этапов связывают текстовые воронки, Studio и рабочее место менеджера, персонального исполнителя, расчёты и исполнение заказа. План передаётся на ревью.
- Outputs: [План внедрения и критерии приёмки](../../plans/singlepagestartup/ISSUE-418.md).
- Notes: Реализация после ревью в отдельной ветке `codex/issue-418-crm-workflows`. Руководитель принимает архитектуру, дизайн и результаты браузерных проверок исполнителей GPT-6.2 Sol xhigh.
- Verification: Три агента проверили реестры #416, границы CRM и менеджерского доступа, браузерные сценарии и точки подключения платных операций. Для OpenRouter и прямого OpenAI проверены официальные способы получения данных о расходах. Перед публикацией проверены структура плана и локальные ссылки.

### Implement

- План утверждён владельцем. Проект переведён в `In Dev`. [Ход реализации](../../handoffs/singlepagestartup/ISSUE-418-progress.md).

## Incident Log

<!-- incident-count: 3 -->

### Incident 1 — Подключение к GitHub

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Проверка контекста вернула ошибку соединения с api.github.com.
- **Root Cause**: Сетевое ограничение среды исполнения.
- **Fix**: Проверка через load_config.sh с разрешённым сетевым доступом подтвердила репозиторий и метки размера.
- **Preventive Action**: Запускать сетевые шаги в одном настроенном Bash-контексте.
- **References**: `.claude/helpers/load_config.sh`

### Incident 2 — Недоступные модели исследовательских ролей

- **Phase**: Research
- **Occurrences**: 3
- **Symptom**: Три профиля агентов завершились до исследования.
- **Root Cause**: Учётная запись не поддерживала заданные в адаптерах модели 5.4 и 5.4-mini.
- **Fix**: Три агента на доступной модели выполнили те же независимые задания. Получены ссылки на строки кода и официальные документы.
- **Preventive Action**: При таком ответе передать метод роли агенту на модели текущей сессии.
- **References**: .codex/agents/codebase-analyzer.toml, codebase-pattern-finder.toml, web-search-researcher.toml.

### Incident 3 — Получатель платы за вычисления и судьба старого маршрута

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: В структуре плана нельзя было отличить расчёт с внешним провайдером от дохода SPS. Для старого маршрута был предложен переходный период.
- **Root Cause**: В исследовании использовалось слово «платформа» для двух участников расчёта. Привязка ключа к конкретному агенту и требование обновить всех клиентов в одном релизе появились при разборе плана.
- **Fix**: Владелец оплачивает внешний счёт. Перевод агенту, внутреннее отнесение затрат по подключению и покупка клиентом имеют разные основания. Для обращения к провайдеру личный ассистент делегирует поручение отдельному RBAC Subject магазина и платит на его кошелёк. У этого Subject исходящая Identity со ссылкой на защищённый ключ. Штатная связь входа участвует в authentication/me, поэтому для исходящих Identity нужна отдельная связь. У каждой платной попытки есть потолок, резерв, фактический или расчётный расход и сверка. Все клиенты переходят на работу по задаче, старый маршрут и middleware удаляются в том же релизе.
- **Preventive Action**: В критериях приёмки финансового сценария называть владельца внешнего ключа, плательщика и получателя каждого внутреннего перевода, валюту и источник суммы.
- **References**: [Расчёты и удаление старого биллинга](../../plans/singlepagestartup/ISSUE-418.md).

## Reusable Learnings

- Сохранять продуктовые решения автора отдельно от проверенного поведения ветки.
