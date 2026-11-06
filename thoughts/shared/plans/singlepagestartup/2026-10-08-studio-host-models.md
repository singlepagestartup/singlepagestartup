# Host в Studio

Статус: заменён планом `2026-10-09-studio-isolation.md`. Текущая реализация полностью локальна в Studio; ход исправления находится в `thoughts/shared/handoffs/singlepagestartup/studio-isolation-2026-10-09.md`.

Host содержит модели Page, Layout, Widget, Metadata и связи pages-to-layouts, layouts-to-widgets, pages-to-widgets, pages-to-metadata, widgets-to-external-widgets. Studio получает экраны для этих существующих сущностей. Данные в предпросмотре локальные; типы соответствуют SDK. Схемы БД и связи остаются существующими.

## Этапы

- [x] 1. Создать отдельную ветку и файл состояния. Проверить поля SDK; добавить типизированное локальное состояние, примеры и проверяемые операции сборки страницы.
- [x] 2. Добавить списки, формы и выбор записей для четырёх моделей через Records, RecordEditor, RecordForm и существующий набор UI.
- [x] 3. Добавить пять менеджеров связей, включая вложенное редактирование, порядок и удаление связи без удаления её концов.
- [x] 4. Добавить предпросмотр страницы из того же состояния: default-виджеты Layout до содержимого Page, additional после; внешние виджеты; Metadata внутри canvas.
- [x] 5. Добавить истории и manifests в зеркальные каталоги Host. Сохранить существующие page recipes. Дополнить inventory покрытием сущностей и page manifests.
- [x] 6. Проверить типы, операции состояния, inventory и работу экранов в браузере на desktop/mobile. Записать результаты.
- [ ] Проверка пользователем: создание Page → Layout → Widget → external widget → Metadata; порядок, unlink, пустые состояния, формы и клавиатура.

## Размещение и границы

UI-варианты: `apps/studio/modules/host/{models,relations}/<entity>/singlepage/<variant>/`. Общие UI-фрагменты используют существующий каталог `apps/studio/workspace/design/singlepage/interface-kit`. Литералы и чистые операции: `apps/studio/workspace/utils/host-studio`. Локальные интерфейсы принадлежат своим моделям и связям в Studio. Проверки inventory: `tools/studio/design-system`.

Metadata имеет title и SEO/social поля, но не adminTitle/slug. Widget содержит локализованные title/subtitle/description. Внешняя связь хранит externalModule и externalWidgetId. Неизвестные внешние источники показывают явное пустое состояние. Будущее подключение API использует существующие SDK providers и relation find с filters.and.

## Проверки

- `./node_modules/.bin/tsc -p apps/studio/tsconfig.json --noEmit --incremental false`
- Bun-тесты операций Host и inventory.
- Генератор и валидатор Studio design-system.
- Storybook на http://localhost:4321: CRUD, вложенные связи, сборка страницы, mobile и клавиатура.

Ход работы и следующий шаг: `thoughts/shared/handoffs/singlepagestartup/studio-host-models-2026-10-08.md`.

Результат: 21 новый каталог вариантов, 22 истории (включая Empty). Проверка типов, 10 Bun-тестов с 52 assertions, design-system validator и code-placement checker проходят. Браузерная проверка охватывает CRUD, вложенные формы, новый Target, внешний источник, порядок, unlink, Metadata canvas, Tab и ширину 390 CSS-пикселей. Все 22 новые истории загружаются без горизонтального переполнения страницы.
