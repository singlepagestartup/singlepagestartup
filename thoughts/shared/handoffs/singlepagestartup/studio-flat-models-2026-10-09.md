# Studio: перенос моделей

Статус: в работе.

## Область

`apps/studio/modules/<module>/models/<model>` переносится в
`apps/studio/modules/<module>/<model>`. Production-файлы и посторонние изменения
в рабочем дереве не входят в задачу.

## Состояние

- Модели находятся прямо в папках модулей; папок `models` под Studio Modules нет.
- Обновлены импорты, пути манифестов, Figma metadata, реестр ассетов, команды и генераторы.
- Идентификаторы Storybook, node IDs Figma, данные и карты вариантов сохранены.
- TypeScript и 274 теста в 37 файлах проходят; ошибок нет.
- Генерация каталога и инвентаря сохраняет 61 модель в 15 модулях без Telegram.
- Проверены манифесты, AI Chat content, code placement и `git diff --check`.
- Изолированная сборка Storybook проходит без `libs`, `apps/host` и root tsconfig.
- В браузере проверены регистрация, создание треда, Cancel и Products Source.
  Ошибок консоли нет. Скриншот: `/private/tmp/studio-flat-models.png`.
- Storybook перезапущен на 4321; exec session: `78242`.

## Git

Рабочая ветка: `codex/studio-host-models`, исходный HEAD: `42b3bf27d4`.
PR: https://github.com/singlepagestartup/singlepagestartup/pull/371,
ветка PR: `codex/ai-chat-ui-review`.

В рабочей ветке есть посторонний production-коммит `94f63c6a75`.
В PR переносить только коммиты этой задачи через отдельный временный checkout.
Не отправлять рабочую ветку целиком.

## Следующий шаг

Зафиксировать только файлы этой задачи и перенести коммит в ветку PR.
После публикации обновить статус плана и этого файла.
