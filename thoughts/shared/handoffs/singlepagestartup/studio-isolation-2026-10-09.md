# Локальные модели AI Chat в Studio

Статус: один Products реализован, проверен и опубликован в [PR #371](https://github.com/singlepagestartup/singlepagestartup/pull/371); code review ожидается. План: `thoughts/shared/plans/singlepagestartup/2026-10-09-studio-isolation.md`. Следующая работа — review и последующее проектирование создания продуктов. Production перенос остаётся отдельной задачей.

Локальная ветка: `codex/studio-host-models`. Коммит реализации: `9e4c8828a0afe10ab411c1be65c50f4c2b6eccca`. Его эквивалент в PR branch `codex/ai-chat-ui-review`: `c034226c76d0e13159cc64edaaba4f5c4246c543`. SHA последующего коммита документации смотреть в Git. PR остаётся открытым, без merge.

## Текущее устройство

Активная страница содержит один Products.md, один подготовленный Thread, один Knowledge Source и одного Product assistant с Social Skill `ai-chat-products`. Working On предлагает Whole document и Products. Создание Profile сразу готовит эти модели. Дополнительных документов, карточек, выбора агентов и создания тредов на этой странице нет. Отдельные старые варианты и агрегатные адаптеры остаются примерами и тестами; активная страница их не использует.

Studio содержит собственные интерфейсы, React components, stories и локальные операции. Production imports, SDK и статика не нужны для сборки. Все 43 варианта AI Chat реализованы в Component.tsx; index.ts экспортирует Component, типы и нужные helpers. View.tsx удалены, прежние story IDs и маршруты сохранены.

RBAC Subject разрешает пользовательский Profile через subjects-to-social-module-profiles. Его меню находится в Profile ai-chat-user-menu. Selector и контейнер проектов — Profile ai-chat-project-select и ai-chat-workspace. Доступ к проекту ограничен пользовательским Profile, profiles-to-chats, вариантами Chat/Profile и ID маршрута. Header получает selector через slot.

Profile ai-chat-workspace хранит только `{id, name, variant}` и связи доступа. Profile ai-chat-project получает `{id, name}`, состояние активности и scalar callback переименования; владеет настройками и навигацией. Он монтирует File и Source providers, ограниченные ID Profile. Chat ai-chat-workspace получает Profile ID и slot навигации, разрешает один Thread через chats-to-threads/ai-chat-find. Thread получает одну native запись и slot. Массивы документов, знаний, сообщений, файлов и каталог агентов не проходят через Profile/Chat.

Владельцы состояния:

- `social/models/thread/singlepage/ai-chat-workspace/Thread.tsx`: сообщения, черновик, pending File IDs, Working On, pane и proposal. Composer/Conversation получают их через useThread. Conversation разрешает записи через threads-to-messages/find; Message отображает одну запись с исторической атрибуцией.
- `knowledge/models/source/singlepage/ai-chat-editor/Source.tsx`: одна запись Source, её текст и Source/File links. Profile-to-Source find ограничен profileId. Source section/navigation/editor читают useSource; SourceDownload экспортирует текущий Products.md. Редактор пользовательского контекста сохраняет описания материалов.
- `file-storage/models/file/singlepage/ai-chat-attachments/Files.tsx`: File records и жизненный цикл созданных Blob URL. File view получает IDs и разрешает records в useFiles. Source-to-File find фильтрует sourceId и сохраняет orderIndex; уникальная пара не добавляется повторно. Detach удаляет только связь, сохраняя File pool и остальные связи.
- `social/models/skill/singlepage/ai-chat-products`: один native Skill с title/adminTitle/slug/description/variant; modal Product assistant показывает его компонент. Social Skill и profiles-to-skills подтверждены чтением production README/schema, без импорта или изменений production.

Каждое отправленное сообщение сохраняет снимок текущего Source и использованных Files; последующие правки и detach историю не меняют. Предложение применяется явно к Source. Если после отправки Source изменён вручную, применение отклоняется с подсказкой отправить новое сообщение. Review gates отсутствуют. Cmd/Ctrl Enter отправляет сообщение, обычный Enter остаётся переносом строки.

Мобильный sidebar открывается под navbar; navbar и его меню доступны. Thread header sticky. Conversation имеет минимальную мобильную высоту 50dvh. Chat/Document переключаются на узком экране, на широком видны рядом. Thread остаётся смонтированным при переходе в настройки, сохраняя черновик и историю.

Независимые persistence, API, tools и векторный поиск остаются последующей работой. Studio не анализирует и не индексирует вложения; ответы и предложения — локальная демонстрация. Source не содержит documentId или вложенный массив Files. Chunks остаются производными записями поиска.

## Проверки и продолжение

259 тестов в 31 файле проходят: `bun test tools/studio apps/studio/workspace apps/studio/modules/host/models/page/singlepage/ai-chat/Component.test.tsx`. TypeScript Studio, content --check, manifests, Design system, code-placement и diff checks проходят. Изолированная сборка Storybook проходит в копии только apps/studio + tools/studio, без libs/apps/host/root tsconfig, со сторонними зависимостями через node_modules.

`npm run studio:validate` успешен. Report-mode pipeline показывает четыре approval gaps в параллельно редактируемых бизнес-документах и ноль structural gaps; статусы подтверждения не менялись. Логи: `/private/tmp/studio-slim-tests-final.log`, `/private/tmp/studio-slim-types-final.log`, `/private/tmp/studio-slim-validate.log`, `/private/tmp/studio-slim-storybook-final.log`.

Browser проверяет один Products/Thread/Source, два Working On options, один агент и навык, Ctrl/Meta Enter, редактор и применение proposal, два uploads и scoped detach с сохранённой историей. Переключение проектов сохраняет независимые знания, Files, историю и черновики. Новый Profile сразу получает Products. Mobile проверяет доступность navbar при открытом sidebar, переключение Chat/Document и отсутствие горизонтального overflow. Console errors/warnings отсутствуют. Скриншот: `/private/tmp/studio-products-models-ui.jpg`. Storybook работает на 4321; временный browser tab закрыт, viewport override снят.

Host сохраняет четыре локальные модели и пять отношений с CRUD, composition и nested editors. Предыдущая production Host build прошла с NODE_OPTIONS=--max-old-space-size=8192; Next lint отключён текущей конфигурацией. Лог: `/private/tmp/studio-correction-host-final.log`. Текущий шаг production не меняет и Host build не повторяет. Ранее вошедшие в PR Knowledge/MCP изменения сохраняются.

## Git и границы работы

В общей локальной ветке между предыдущим Studio коммитом и текущим шагом находится отдельный production-коммит `94f63c6a75` про JEV. Он сохранён локально, но отсутствует в PR #371. Для публикации только Studio использован временный checkout поверх прежнего PR head `ea69bb036a`; туда cherry-picked только Studio коммит. Не пушить всю локальную ветку в PR без отдельного запроса на production работу.

Не включать чужие изменения: .agents/.claude/.codex README, AGENTS.md, CLAUDE.md, review-pr workflow/skill, workspace business/brand/strategy/design, singlepagestartup product, pre-development cursors, ISSUE-372, PR #368 description, apps/api uploaded files. Текущая реализация включает только 42 Studio файла; сопровождающий коммит — этот handoff, план и PR #371 description.
