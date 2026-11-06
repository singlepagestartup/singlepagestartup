# Каталог Studio: продолжение

Статус: реализация, проверки и публикация в PR #371 завершены. Активная ветка `codex/studio-host-models`, исходный HEAD `a66ffe96db23bd70d726d0df0085b3ccd8deefa3`. Исходный опубликованный PR head — `01546e3c316d8dd959b75e066091b0f54127d9e8`. Коммит реализации — `f62f92ead8f38a1cce39c46a37c47d035bfd6585`; его опубликованный cherry-pick — `9dfc7700529854ad9364e1f6e92cc0468ed4f447`. Актуальный head доступен в Git и PR.

План: `thoughts/shared/plans/singlepagestartup/2026-10-09-studio-module-catalog.md`. Предыдущая декомпозиция AI Chat: `studio-isolation-2026-10-09.md` в этом каталоге.

## Реализация

Все 153 production-сущности представлены в Studio: 61 модель, 92 связи, 15 модулей. Telegram отсутствует в inventory, generator и stories. Его существующие пустые каталоги не изменены. Studio-only Tag и Cart сохраняются.

Каждая сущность имеет Component/index, публичный локальный интерфейс, singlepage/startup registries и объединённый variants.ts с startup последним. Все существующие локальные визуальные варианты включены в реестры. Ключи прежних find-вариантов AI Chat сохранены; общий новый find их не заменяет.

358 новых локальных вариантов показывают таблицы, поиск и карточки моделей. Stories новых вариантов импортируют публичный вход сущности с native aliases. Примеры данных и их интерфейс находятся в singlepage/admin-v2-table соответствующей модели или связи. Foreign keys разрешаются в существующие записи целевой модели; ссылки открывают карточку выбранного ID. Find использует column/method/value в apiProps.params.filters.and, поддерживает пересечение условий и children({ data }). Старые AI Chat find сохраняют свои локальные provider-контракты.

Поддерживаемый generator — tools/studio/design-system/catalog.ts, команда npm run studio:catalog. Он читает синтаксис production-схем без их исполнения или runtime imports. Он сохраняет авторские реализации и fixtures, собирает entries и registries. Schema drift выявляется тестами; fixture/interface необходимо обновить локально. JSON-массивы и размеры векторов сохраняются. Общий renderer — workspace/design/singlepage/interface-kit/RecordProjection.tsx; Records поддерживает renderValue для ссылок.

Website Builder получает Chat preview и Subject contact form через slots; Help получает адрес выбранного проекта через props. Общий ServicePage не импортирует RBAC. Проверка публичного Widget entry охватывает все его варианты и зависимости.

Host composition использует Provider с внедряемым RelationManager. Model не импортирует Relations. Workbench отделён от Preview; runtime cycles отсутствуют. Остальные production-варианты перечислены в inventory для дальнейшего визуального проектирования; полный production frontend не копируется.

## Проверки

283 тест в 37 файлах проходят. Проверены native fields/foreign keys всех сущностей, alias keys, startup precedence, сохранение fixtures и компонентов, JSON arrays, vector dimensions, scoped find, выбранные ID и пустые результаты. TypeScript проходит в checkout и isolated copy. Metadata, content --check, code-placement и diff --check проходят.

Финальная Storybook build выполнена из /private/tmp/studio-isolation-fixture без libs, apps/host и root tsconfig, с установленными сторонними node_modules. Output — /private/tmp/studio-module-catalog-isolated-final. Логи: /private/tmp/studio-catalog-tests-final.log, /private/tmp/studio-catalog-types-final.log, /private/tmp/studio-catalog-isolated-types-final.log, /private/tmp/studio-module-catalog-isolated-final.log.

Browser: Social Profiles-to-Skills показывает три связи; переход из второй строки открывает skill example 2 с правильным ID. Filtered find показывает одну запись. Мобильный preview имеет scrollWidth = clientWidth = 487 CSS px. Viewport override снят. AI Chat New thread сохраняет header, sidebar, Products, имя и выбор агента, Create thread и Cancel. Application error logs пусты. Screenshot — /private/tmp/studio-module-catalog.png.

Storybook запущен на 4321; dev log — /private/tmp/studio-module-catalog-dev.log. Исходный dev server пришлось перезапустить после временной ошибки индекса во время создания stories.

## Git и продолжение

В checkout есть чужие изменения workflow, workspace-артефактов, production Knowledge/RBAC и API-файлов. Их не включать в коммит. Локальная ветка содержит посторонний production-коммит `94f63c6a75`; её целиком не публиковать. Собственные коммиты переносить cherry-pick поверх актуального PR head во временном checkout ветки codex/studio-products-review. Не использовать force push. Проверить actual PR head/body и отсутствие 94f63c6a75 в ancestry.

Список собственных файлов для staging — /private/tmp/studio-catalog-stage-paths.txt. Он содержит только Studio modules/interface-kit/inventory/docs, Studio tooling/tests, команды в package.json/project.json, этот план/handoff и PR #371 description. Все 3131 файла реализации совпадают между локальным коммитом и опубликованным cherry-pick; посторонний production-коммит отсутствует в ancestry PR. Перед следующей задачей проверить git status, log и PR. Следующая функциональная задача требует отдельного запроса пользователя.
