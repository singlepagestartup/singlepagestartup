---
issue_number: 372
issue_title: "Мутации Knowledge могут оставлять HTTP-кэш и подписки других моделей устаревшими"
repository: singlepagestartup
created_at: 2026-10-08T22:17:40Z
last_updated: 2026-10-08T22:39:51Z
status: active
current_phase: create
---

# Process Log: ISSUE-372 - Мутации Knowledge могут оставлять HTTP-кэш и подписки других моделей устаревшими

## Purpose

Фиксирует результаты этапов и сведения, необходимые для продолжения работы над issue.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: `core/10-research` по запросу пользователя; статус GitHub Project — Research Needed.

## Phase Notes

### Create

- Summary: Описан риск расхождения БД, HTTP-кэша и подписок при межмодульных мутациях Knowledge на ревизии PR #371 d08dc32793470f6eb186311c3bc2eed16dfb85b5.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-372.md`; [GitHub issue #372](https://github.com/singlepagestartup/singlepagestartup/issues/372); GitHub Project singlepagestartup #2, Research Needed.
- Notes: Подтверждены прямые мутации и несовпадение topics. Воспроизведение через HTTP и оценка частоты входят в будущий research. Задачи с таким же конкретным механизмом в поиске GitHub не обнаружены; #195 связан с общим механизмом кэша и revalidation.

- Review tooling: `review-pr` и `.agents/workflows/engineering/review_pr.md` содержат проверки межмодульных мутаций, HTTP/client/service-level кэшей, topics, подписок и формат оценки последствий/частоты с решением разработчика. `AGENTS.md` и `CLAUDE.md` подключают общие правила для Code Review. `local_review` готовит checkout; `submit_pr_for_code_review.sh` связывает PR и переводит статус. Предложение порядка модулей находится в `thoughts/shared/research/singlepagestartup/2026-10-09-module-layering-review.md`, confirmation pending. Исследование самого сбоя кэширования отложено.

### Research

- Summary: Не начат.
- Outputs:
- Notes: Начать позже по запросу пользователя.

### Plan

- Summary: Не начат.
- Outputs:
- Notes:

### Implement

- Summary: Не начат.
- Outputs:
- Notes: Изменения runtime не входят в создание issue.

## Incident Log

<!-- incident-count: 0 -->

## Reusable Learnings

- При ревью межмодульной мутации сопоставлять изменённые модели с topics внешнего маршрута. Сам факт вызова backend service не доказывает отсутствие инвалидации: нужно проверить middleware и правила topics.
- Отдельно фиксировать доказанный по коду механизм, результаты воспроизведения и частоту пользовательских сбоев. Решение о переделке принимается по этим данным.
