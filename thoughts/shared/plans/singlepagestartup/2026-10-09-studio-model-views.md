# Отображения моделей Studio

Статус: реализация. Ветка: codex/studio-host-models. Основание: убрать relations и find из Studio; данные и видимые состояния задаются локально и через props/Storybook Controls. Production libs не изменяются.

- [x] Заменить relation-компоненты в AI Chat прямой композицией Profile, Chat, Thread, Message, Source, File и Website Builder моделей.
- [x] Сохранить визуальные Host/Ecommerce примеры в владельцах-моделях; убрать зависимости от удаляемых relation-файлов.
- [x] Удалить Studio relations и API-подобные find-варианты; добавить list с количеством и пустым состоянием.
- [x] Обновить generator, inventory, metadata и проверки: только модели, без повторного создания relations/find.
- [x] Проверить types, тесты, isolated Storybook build и браузерные сценарии.
- [ ] Сохранить результат и обновить PR #371.

Продолжение: thoughts/shared/handoffs/singlepagestartup/studio-model-views-2026-10-09.md.
