# Studio: публичные входы моделей

Статус: завершено. Реализация опубликована в PR #371.

## Реализация

Межмодельные представления используют публичный `Component` с `variant` в Blog,
CRM, Ecommerce, Host, RBAC, Social и Website Builder. Внутри модели сохраняются
приватные sibling-варианты. Provider/helper-зависимости обслуживают локальное состояние.

Featured-список принимает `count` и `compact`, показывает примеры Article.
Controls подтверждены для четырёх карточек. Профиль автора получает статьи слотом
от Host; Article Detail получает карточку тегов слотом от Blog Widget/Story.
Так зависимости публичных входов остаются ацикличными.

Отдельные варианты: Knowledge Source `ai-chat-download`, Social Profile
`ai-chat-processing`, Social Thread `chat-settings`. Disclosure JSON и его
генератор используют папку `ai-chat-processing`. Settings получает `profiles`.
Product Tier использует `appearance` для выделения тарифа; `variant` выбирает модель.
Явный `variant` после spread не даёт обёртке перезаписать выбранное представление.

## Проверки

- 275 тестов в 37 файлах: `/private/tmp/studio-public-tests.log`.
- Studio TypeScript: `/private/tmp/studio-public-types.log`, диагностик нет.
- Проверки метаданных, контента AI Chat, размещения кода и diff проходят.
- Сборка в `/private/tmp/studio-isolation-fixture` проходит без `libs`, `apps/host`
  и root tsconfig: `/private/tmp/studio-public-build.log`.
- Браузер: четыре featured Article через Controls; статья с тегами/комментариями;
  две статьи автора; тарифы default/featured/default; пять полей CRM;
  экспорт Products.md; disclosure; настройки чата; Products Thread/Source.
  После исправлений ошибок браузера нет. Регистрация снова открыта.
- Снимок: `/private/tmp/studio-model-imports-featured.png`.
- Storybook: 4321, session `36207`, лог `/private/tmp/studio-public-dev.log`.

## Git и продолжение

Рабочая ветка: `codex/studio-host-models`, исходный HEAD: `41e706d569`.
PR #371: https://github.com/singlepagestartup/singlepagestartup/pull/371,
ветка `codex/ai-chat-ui-review`, исходный HEAD PR: `c1e2255c4b`.

Коммит реализации: `5c08eb961b` локально, `fb0ded5ee2` в PR.
HEAD и описание PR проверены через GitHub; PR прикреплён к задаче.
Файлы всех моделей и runtime-утилит `.ts`, `.tsx`, `.json`, `.md` совпадают
с проверенной рабочей копией. Отличия `.DS_Store` и изменённых пользователем
pre-development YAML не относятся к реализации и не входят в коммит.

Посторонний production-коммит `94f63c6a75` не входит в историю публикуемой ветки.
В коммите нет production-файлов. 26 посторонних изменённых файлов сохранены без изменений.

При продолжении использовать публичные модельные входы и слоты,
сохраняя локальное состояние провайдеров. Новых задач по этой правке не осталось.
