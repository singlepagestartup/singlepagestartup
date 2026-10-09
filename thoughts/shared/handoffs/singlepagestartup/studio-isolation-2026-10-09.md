# Локальные модели AI Chat в Studio

Статус: отдельные страницы и доменные компоненты реализованы и проверены; PR #371 ожидает code review. План: `thoughts/shared/plans/singlepagestartup/2026-10-09-studio-isolation.md`. Дальнейшая работа — review и проектирование создания продуктов. Production перенос остаётся отдельной задачей.

Локальная ветка: `codex/studio-host-models`. PR: https://github.com/singlepagestartup/singlepagestartup/pull/371, branch `codex/ai-chat-ui-review`. SHA последнего Studio коммита смотреть в Git. Последний baseline перед декомпозицией страниц: локально `c9fde47190`, в PR `16f3e93dccb093ba8f46c55b5d4cec98f7b42197`. PR открыт, без merge.

## Страницы и композиция

Host Page содержит десять самостоятельных компонентов:

- `ai-chat`: landing.
- `ai-chat-register`, `ai-chat-login`: формы RBAC Identity.
- `ai-chat-settings`: настройки текущего RBAC Subject.
- `ai-chat-help`, `ai-chat-tokens`: Help Widget и Ecommerce Order.
- `ai-chat-projects-new`: создание Social Profile.
- `ai-chat-projects-project-id`: Products Chat.
- `ai-chat-projects-project-id-settings`: настройки Social Profile проекта.
- `ai-chat-projects-project-id-threads-new`: форма создания Thread без создания записи.

Page принимает только profileId, если это экран проекта. Page не разбирает URL и не переключает экраны. Его Component.tsx содержит 9–51 строку. Sidebar импортируется непосредственно из Social Profile. Host Layout `ai-chat` содержит общий frame, `ai-chat-project` — responsive columns и мобильный drawer. Shared PanelHeader находится в interface-kit/ai-chat/ServiceDocument.tsx.

Router для локальной демонстрации находится в `workspace/products/singlepage/ai-chat/website/Preview.tsx`; чистый разбор маршрутов — в workspace/utils/products/ai-chat-routes.ts. Preview переключает самостоятельные Pages, хранит последний project href и перехватывает ссылки. Все десять страниц имеют собственные Storybook stories. Прежние Host Page story IDs сохранены; новые stories — `/ai-chat/projects/[project-id]/settings` и `/ai-chat/projects/[project-id]/threads/new`.

## Модели и состояние

В активном примере один Products.md, один подготовленный Thread, один Knowledge Source и Product assistant с Social Skill `ai-chat-products`. Working On: Whole document или Products. Создание Profile сразу готовит эти модели. New thread открывает отдельный Page: название, выбор Product assistant, просмотр навыка, Create thread и Cancel. Submit показывает feedback предпросмотра; Thread/Chat/Message records не создаются. Cancel возвращает в Products.

RBAC Subject account provider находится в `rbac/models/subject/singlepage/ai-chat-account/Account.tsx`. Current Subject разрешает пользовательский Profile через subjects-to-social-module-profiles; меню находится в Profile ai-chat-user-menu. Hook useAIChatProjectHref возвращает последний проект для account links.

В Social Profile:

- `ai-chat-project/Profiles.tsx` хранит identities `{id, name, variant}`, access links, create и rename. Доступ определяется текущим Subject/Profile, profiles-to-chats и вариантами Chat/Profile.
- `ai-chat-project/Component.tsx` разрешает Profile-to-Chat find и предоставляет model scope. Profile.tsx связывает providers с profileId. Внутреннего UI routing нет.
- `ai-chat-project-select` читает доступные identities в своей модели и показывает ссылки на проекты и создание.
- `ai-chat-sidebar` читает один Profile; Settings, Products и New thread — реальные ссылки на отдельные Pages.
- `ai-chat-create` и `ai-chat-settings` содержат соответствующие формы Profile.

Владельцы остальных данных:

- Chat `ai-chat-products` разрешает prepared Thread через chats-to-threads/find; получает только profileId и navigation slot.
- Thread `ai-chat-products/Thread.tsx` хранит native Thread, messages, draft, pending File IDs, Working On, pane и proposal. Composer/Conversation используют useThread. Conversation разрешает Message через threads-to-messages/find; Message отображает одну запись.
- Source `ai-chat-document/Source.tsx` хранит Source и Source/File links. Profile-to-Source find ограничен profileId. Source views: ai-chat-document, ai-chat-card и ai-chat-document-link. Редактор пользовательского контекста сохраняет описания материалов.
- File `ai-chat-attachments/Files.tsx` хранит File records и Blob URL. Source-to-File find фильтрует sourceId, сохраняет порядок и уникальность пары. Detach сохраняет File pool и остальные связи.
- Skill `ai-chat-products` содержит одну инструкцию работы с продуктами; Product assistant показывает этот Skill в своём modal.

Preview сохраняет scopes providers по Profile ID при смене страниц. Pages и Thread view размонтируются, данные моделей остаются. Profile/Chat не передают aggregate document/message/source/File arrays или каталог агентов. История хранит снимки Source и Files. Proposal применяется явно; устаревшее после ручной правки предложение отклоняется. Review gates отсутствуют. Cmd/Ctrl Enter отправляет сообщение, обычный Enter вставляет перенос строки.

Мобильный drawer открывается под navbar; navbar доступен и при открытом drawer. PanelHeader sticky. Минимальная мобильная высота Conversation — 50dvh; Chat/Document переключаются на узком экране. На широком экране они видны рядом.

Все реализации находятся в Studio Component.tsx и экспортируются через index.ts; View.tsx отсутствуют. Studio не импортирует production libs, SDK или статику. Старые aggregate adapters остаются отдельными примерами и тестами. Persistence, API, agent tools и векторный поиск — последующие задачи. Studio не анализирует и не индексирует файлы. Source не содержит documentId или вложенный массив Files.

## Проверки

260 тестов в 31 файле проходят: `bun test tools/studio apps/studio/workspace apps/studio/modules/host/models/page/singlepage/ai-chat/Component.test.tsx`. Есть проверка самостоятельности страниц, scoped access, model ownership, файлов, истории и импортной границы. TypeScript Studio проходит в checkout и изолированной копии. Content --check, inventory, Design system metadata и code-placement проходят. Storybook build выполнен из копии только apps/studio + tools/studio + package.json, без libs/apps/host/root tsconfig, с установленными сторонними зависимостями через node_modules.

`npm run studio:validate` успешен. Report-mode pipeline показывает четыре approval gaps в параллельно редактируемых бизнес-документах и ноль structural gaps; confirmation states не менялись. Логи текущего шага: `/private/tmp/studio-pages-tests-final.log`, `/private/tmp/studio-pages-types-final.log`, `/private/tmp/studio-pages-isolated-types.log`, `/private/tmp/studio-pages-validate.log`, `/private/tmp/studio-pages-build-final.log`.

Browser подтверждает отдельные Pages, переименование профиля, сохранение draft/history/Source при переходах, создание второго Profile с независимой историей, Ctrl Enter и форму создания Thread без новой записи. Мобильный sidebar начинается ровно у нижней границы navbar, аккаунт доступен, горизонтального переполнения нет. Browser console содержит только предупреждение самого Storybook о будущем ariaLabel у PopoverProvider; ошибок приложения нет. Скриншоты: `/private/tmp/studio-pages-mobile-sidebar.png` и `/private/tmp/studio-pages-separate-thread-page.png`. Временный tab закрыт, viewport override снят. Storybook работает на 4321.

Ранее пройденные проверки файлов, proposal, Cmd Enter, account navigation и Host composition записаны в предыдущем Git состоянии handoff. Host сохраняет четыре локальные модели и пять отношений. Предыдущая production Host build прошла с 8 GiB heap; текущий шаг production не меняет и эту сборку не повторяет. Ранее вошедшие в PR Knowledge/MCP изменения сохраняются.

## Git и границы

В локальной ветке находится отдельный production-коммит `94f63c6a75` про JEV. Он сохранён локально и отсутствует в PR #371. Публиковать только новые Studio commits через cherry-pick в checkout `codex/studio-products-review` поверх PR head; не пушить всю локальную ветку. Проверить отсутствие 94f63c6a75 в ancestry публикуемого HEAD, совпадение Studio/документов, нормальный push в codex/ai-chat-ui-review и actual PR head/body. Не использовать force push.

Чужие изменения исключены: .agents/.claude/.codex README, AGENTS.md, CLAUDE.md, review-pr workflow/skill, workspace business/brand/strategy/design, singlepagestartup product, pre-development cursors, ISSUE-372, PR #368 description, apps/api uploads. Текущий шаг включает только Studio компоненты, их tools/tests/metadata, Studio README, этот handoff, план и PR #371 description.
