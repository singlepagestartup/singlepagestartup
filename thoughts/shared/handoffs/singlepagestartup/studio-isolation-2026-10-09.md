# Локальные модели AI Chat в Studio

Статус: реализация и проверки завершены; code review PR #371 ожидается. План: `thoughts/shared/plans/singlepagestartup/2026-10-09-studio-isolation.md`.

PR: https://github.com/singlepagestartup/singlepagestartup/pull/371. Локальная ветка `codex/studio-host-models`, PR branch `codex/ai-chat-ui-review`. Декомпозиция разговоров: `38ec894cee`. Упрощение точек входа: `b69abc527b`. SHA текущего шага смотреть через `git log -1`. Публикация относится к существующему PR, без merge.

Studio содержит собственные React components, локальные интерфейсы, stories и callbacks. Прототип не импортирует libs, Host, production SDK или production статику. Варианты находятся в `apps/studio/modules`, чистые адаптеры в `workspace/utils/products`. Все 42 варианта AI Chat реализованы в Component.tsx; index.ts экспортирует Component, типы и необходимые helpers. Fixture examples находятся в Component.stories.tsx. View.tsx удалены; story IDs сохранены. Production в текущем шаге не изменён. Knowledge/MCP изменения, уже вошедшие в PR, сохраняются.

RBAC Subject разрешает пользовательский Profile через subjects-to-social-module-profiles. Его меню — Profile ai-chat-user-menu. Project selector и контейнер проектов — Profile ai-chat-project-select и ai-chat-workspace. Доступ к проекту требует профиль пользователя, profiles-to-chats, Chat/Profile variants и ID маршрута. Header получает selector через slot.

Project Profile ai-chat-project собирает настройки, Profile navigation и Chat. Chat ai-chat-workspace разрешает Thread через chats-to-threads/ai-chat-find. Brief, Strategy, Brand, Design, Products, добавленные продукты и рабочие разговоры — отдельные Threads одного Chat. projectThreadGraph проецирует редактор в Chat, Thread, Message и relation records; metadata выбора остаются вне полей моделей.

Thread ai-chat-workspace владеет заголовком, conversation, proposal, Working On, composer и Source editor. Conversation получает Messages через threads-to-messages/ai-chat-find по orderIndex; message/ai-chat-message отображает запись с исторической атрибуцией. Создание и настройки Thread — отдельные варианты ai-chat-create/ai-chat-settings. Рабочие Threads используют все текущие Sources Profile без Working On и выбора документов.

Profile-to-Source find ограничивает навигацию и редактор. projectKnowledge формирует Source.slug; bundle хранит sourceSlugs. Документный Thread фильтрует группу по slug; Working On выбирает Source IDs внутри неё. Каждый блок — knowledge.source/ai-chat-section. Source не содержит documentId или вложенный массив Files. Правки user-context сохраняют описания материалов. Chunks остаются производными записями поиска.

Source-to-File find разрешает Files по sourceId и orderIndex; пары уникальны. Каждый Source показывает один список Files с Upload files, добавлением существующих файлов, Open/Download и Detach. Старые original/delivery представлены отдельными связями. Detach получает File ID и Source/section ID, сохраняет File pool и другие связи. Legacy asset metadata остаются необязательными в адаптере для сохранения старых данных; новые вложения содержат только id, file и section.

Save reviewed version, статусы документов, reviewed snapshots и ограничения New thread удалены. Экспорт и ответы используют текущие знания. Исторические сообщения сохраняют контекст момента отправки. Start a thread доступен до загрузки материалов; переход создаёт разделы документов без анализа и обязательного заполнения. Анализ материалов остаётся отдельным действием. Role guidance и генерируемый JSON используют единый Files список.

Поля Thread, Source и отношений сверены с production schema/README/frontend без production imports. Profile ещё координирует агрегат через callbacks. Независимая persistence, API, tools, роли и векторный индекс — последующая работа. Studio не анализирует и не индексирует вложения.

Проверки: 258 тестов в 31 файле, Studio TypeScript, content --check, manifests, design-system, workspace validators и code-placement проходят. Изолированная Storybook build проходит в копии только apps/studio + tools/studio без libs/apps/host/root tsconfig, со сторонними зависимостями через node_modules. npm run studio:validate завершился успешно; report-mode pipeline показывает четыре approval gaps в параллельно редактируемых бизнес-документах, structural gaps отсутствуют. Логи текущего шага: /private/tmp/studio-free-work-tests.log, /private/tmp/studio-free-work-types.log, /private/tmp/studio-free-work-build.log.

Browser: создание треда с незаполненными знаниями, Ctrl+Enter; новый проект без материалов → Start a thread → создание и Cmd+Enter; два загруженных файла в одном списке → detach одного с сохранением другого; review controls отсутствуют. Console errors отсутствуют. Скриншот: /private/tmp/studio-free-work-ui.jpg. Storybook работает на 4321. Предыдущие проверки mobile при 390 CSS px, sidebar под navbar, sticky Thread header, независимость Brief/Strategy, Working On и proposal сохранены в логах /private/tmp/studio-thread-\*.log и скриншотах /private/tmp/studio-thread-{project,mobile}.jpg.

Host содержит четыре локальные модели и пять отношений с CRUD, composition и nested editors. Предыдущая production Host build прошла с NODE_OPTIONS=--max-old-space-size=8192; Next lint отключён текущей конфигурацией. Лог /private/tmp/studio-correction-host-final.log. Этот шаг production не меняет и Host build не повторяет.

Не включать чужие изменения: .agents/.claude/.codex README, AGENTS.md, CLAUDE.md, review-pr workflow/skill, workspace business/brand/strategy/design, singlepagestartup product, pre-development cursors, ISSUE-372, PR #368 description, apps/api uploaded files, production RBAC/OpenRouter/JEV/shared utils и их READMEs. В Profile Component до текущего шага был formatting hunk объединения двух Thread imports; он сохранён. Текущий commit включает только Studio AI Chat Files/review changes, stories, адаптеры и тесты, четыре role guidance файла и производный JSON, Studio README, этот handoff, план и PR #371 description.

Следующий шаг: code review PR #371. Production перенос остаётся отдельной задачей.
