# Отображения моделей Studio: продолжение

Статус: реализация. План — thoughts/shared/plans/singlepagestartup/2026-10-09-studio-model-views.md.

Исходный HEAD d2ed5cd0b9, ветка codex/studio-host-models. Пользователь разрешил удалить Studio relations и find, заменить их композицией моделей и props для визуальных состояний. Сохраняются Component/index и singlepage/startup registries. Telegram исключён. Production-файлы не меняются.

В checkout есть чужие правки .agents/.claude/.codex, AGENTS/CLAUDE, бизнес-документов workspace, Knowledge/RBAC backend и API uploads. Их не добавлять в коммиты. Локальная ветка содержит посторонний production-коммит 94f63c6a75; публиковать только собственные коммиты cherry-pick поверх актуального PR #371 head, без force push.

Текущий шаг: проверка и сборка. Удалены все Studio relations и find-варианты, старые граф-адаптеры AI Chat и редактор связей Host. AI Chat/Header/Host/Ecommerce используют модели напрямую. 61 модель имеет table/card/list; list Controls задают empty/count, Source Controls — empty/withFiles. Generator и inventory не создают relations. README, manifests и тесты обновлены. Production libs не изменялись.

Проверки завершены: 274 теста в 37 файлах, Studio TypeScript, validation, inventory, AI Chat content check, code placement и diff check проходят. Isolated Storybook build проходит без libs/apps-host/root-tsconfig. В браузере проверены New thread → Cancel → Products, две Working On опции, Ctrl+Enter, знание с двумя файлами и detach, список 20 карточек → 2 через Controls и empty. Ошибок браузера нет. Скриншот: /private/tmp/studio-model-views.png. Storybook на 4321 запущен, session 27807.

Следующий шаг: коммит только файлов задачи и cherry-pick в /private/tmp на codex/studio-products-review поверх актуального PR head 28733b1e12; обновление PR #371 и cleanup. Не публиковать локальный полный HEAD: там посторонний 94f63c6a75. Логи /private/tmp/studio-model-views-{types,tests,validation,build}.log. Подготовлен новый PR body thoughts/shared/prs/371_description.md.
