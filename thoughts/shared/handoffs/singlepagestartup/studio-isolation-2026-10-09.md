# Локальные модели AI Chat в Studio

Статус: Social Profile `ai-chat-project-overview` содержит project frame, sidebar toggle и mobile drawer. На каждой project Page один Host Layout `ai-chat-header`. Общие входы 16 моделей и девяти отношений выбирают вариант из объекта, собранного из singlepage/startup; startup переопределяет singlepage. 270 тестов, TypeScript и изолированная Storybook сборка проходят. SHA смотреть в Git и PR #371. Production-код остаётся отдельной реализацией.

Локальная ветка: `codex/studio-host-models`. PR: https://github.com/singlepagestartup/singlepagestartup/pull/371, branch `codex/ai-chat-ui-review`. SHA последнего Studio коммита смотреть в Git. Baseline перед общими входами: локально `5b6c60b3a8`, в PR `ada1dd3f25`. PR открыт, без merge.

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

Page принимает только profileId, если это экран проекта. Page не разбирает URL и не переключает экраны. Его Component.tsx содержит 10–64 строки. Page вызывает Social Profile `ai-chat-project-overview` с profileId, selected и content slot. Overview разрешает доступ через свой ai-chat-project sibling и содержит ai-chat-sidebar, responsive columns и мобильный drawer. Host Layout `ai-chat` содержит landing frame, `ai-chat-header` — собственный page frame и Website Builder Header. Вложенных Host Layout на project Pages нет. Shared PanelHeader находится в interface-kit/ai-chat/ServiceDocument.tsx.

Website Builder Header использует `widgets-to-logotypes/ai-chat-find` и `widgets-to-buttons-arrays/ai-chat-find`; Buttons Array использует `buttons-arrays-to-buttons/ai-chat-find`. Каждый find фильтрует parent ID через `apiProps.params.filters.and` и сортирует links по orderIndex. SVG находится в Logotype `ai-chat`, Help — в Button `ai-chat-header`. Header импортирует только Website Builder и нейтральный interface kit; тест обходит весь транзитивный граф и проверяет отсутствие циклов.

Host Page создаёт Social Profile Select и RBAC Subject Account, передаёт render props `profileSelect` и `subjectAccount` в Layout `ai-chat-header`. Layout импортирует общий вход Widget, выбирает variant="ai-chat-header" и передаёт slots. Header не хранит account balance; баланс принадлежит Subject Account. Все девять Pages с этим header используют данный Layout. ServicePage содержит только страницу; website adapters с редактируемым Markdown также используют Layout. Header story имеет заглушки slots, Layout story — реальные модели Social/RBAC. Варианты Header и всех выделенных частей имеют stories, manifests и Figma metadata. Общий find helper вынесен в `workspace/utils/products/ai-chat-relations.ts`; старые imports из ai-chat-models поддерживает re-export.

Router для локальной демонстрации находится в `workspace/products/singlepage/ai-chat/website/Preview.tsx`; чистый разбор маршрутов — в workspace/utils/products/ai-chat-routes.ts. Preview переключает самостоятельные Pages, хранит последний project href и перехватывает ссылки. Все десять страниц имеют собственные Storybook stories. Прежние Host Page story IDs сохранены; новые stories — `/ai-chat/projects/[project-id]/settings` и `/ai-chat/projects/[project-id]/threads/new`.

## Общие входы и имена

В существующих каталогах 16 моделей и девяти отношений есть Component.tsx и index.ts для AI Chat. Внешний вызов импортирует Component из models/<model>/index и задаёт variant. Alias показывает модуль и модель: SocialModuleProfile, HostModuleLayout, KnowledgeModuleSource. Alias отношения совпадает с его полным именем: SubjectsToSocialModuleProfiles, ProfilesToKnowledgeModuleSources, SourcesToFileStorageModuleFiles.

Каждая модель и связь содержит singlepage/variants.ts, startup/variants.ts и корневой variants.ts. Корневой объект собирает singlepage, затем startup; Component выбирает variants[props.variant]. IComponentProps выводится из итогового объекта как discriminated union с исходными props каждого варианта; any и центрального URL routing нет. Record interface.ts не менялся. Отношения сохраняют variant="find" и apiProps.params.filters.and. Private siblings внутри одной модели импортируются напрямую, без собственного общего входа; тест проверяет весь runtime graph на циклы. Providers, типы записей и утилиты остаются в своих доменных файлах.

Проект остаётся Social Profile. Вариант ai-chat-project-item содержит memoized строку селектора с profile ID, selected и onNavigate. Аватар и выбор агента — ai-chat-agent-avatar и ai-chat-agent-select. Файлы — ai-chat-pending, ai-chat-preview и ai-chat-asset. Их прежние named component exports удалены; внешние вызовы выбирают эти варианты через общий вход. ProjectAgentPicker и productsAgent остаются в ai-chat-agent, providers не перемещаются. Общие входы сейчас регистрируют только локальные AI Chat варианты; scaffold остальных Studio вариантов не меняется.

Предыдущая проверка общих входов: 268 тестов/33 файла, tsc в checkout и в /private/tmp/studio-isolation-fixture, inventory, design-system validation, content check и code-placement. Isolated Storybook build: /private/tmp/studio-model-entry-build.log, output /private/tmp/studio-model-entry-storybook. В копии нет libs, apps/host и root tsconfig. Browser: record identity/selected у project item, account Settings/return link, выбор агента/Skill, mobile menu и drawer ниже navbar. Ошибок приложения нет; Storybook предупреждает о будущем обязательном ariaLabel в PopoverProvider.

## Модели и состояние

В активном примере один Products.md, один подготовленный Thread, один Knowledge Source и Product assistant с Social Skill `ai-chat-products`. Working On: Whole document или Products. Создание Profile сразу готовит эти модели. New thread открывает отдельный Page: название, выбор Product assistant, просмотр навыка, Create thread и Cancel. Submit показывает feedback предпросмотра; Thread/Chat/Message records не создаются. Cancel возвращает в Products.

RBAC Subject account provider находится в `rbac/models/subject/singlepage/ai-chat-account/Account.tsx`. Current Subject разрешает пользовательский Profile через subjects-to-social-module-profiles; меню находится в Profile ai-chat-user-menu. Hook useAIChatProjectHref возвращает последний проект для account links.

В Social Profile:

- `ai-chat-project/Profiles.tsx` хранит identities `{id, name, variant}`, access links, create и rename. Доступ определяется текущим Subject/Profile, profiles-to-chats и вариантами Chat/Profile.
- `ai-chat-project/Component.tsx` разрешает Profile-to-Chat find и предоставляет model scope. Profile.tsx связывает providers с profileId. Внутреннего UI routing нет.
- `ai-chat-project-select` читает доступные identities в своей модели и показывает ссылки на проекты и создание.
- `ai-chat-project-overview` владеет project frame, своим sidebar и drawer. В content slot передаётся только toggle навигации. Profile scope монтирует frame только при разрешённом доступе.
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

270 тестов в 33 файлах проходят: `bun test tools/studio apps/studio/workspace apps/studio/modules/host/models/page/singlepage/ai-chat/Component.test.tsx apps/studio/modules/website-builder/models/widget/singlepage/ai-chat-header/Component.test.tsx`. Есть проверка самостоятельности страниц, scoped access, model ownership, файлов, истории и импортной границы. TypeScript Studio проходит в checkout и изолированной копии. Content --check, inventory, Design system metadata и code-placement проходят. Storybook build выполнен из копии только apps/studio + tools/studio + package.json, без libs/apps/host/root tsconfig, с установленными сторонними зависимостями через node_modules.

`npm run studio:validate` успешен. Report-mode pipeline показывает четыре approval gaps в параллельно редактируемых бизнес-документах и ноль structural gaps; confirmation states не менялись. Логи Header: `/private/tmp/studio-header-tests.log`, `/private/tmp/studio-header-build.log`. TypeScript проходит в checkout и изолированной копии; Storybook output — `/private/tmp/studio-header-storybook`.

Browser подтверждает отдельные Pages, переименование профиля, сохранение draft/history/Source при переходах, создание второго Profile с независимой историей, Ctrl Enter и форму создания Thread без новой записи. Мобильный sidebar начинается ровно у нижней границы navbar, аккаунт доступен, горизонтального переполнения нет. Browser console содержит только предупреждение самого Storybook о будущем ariaLabel у PopoverProvider; ошибок приложения нет. Скриншоты: `/private/tmp/studio-pages-mobile-sidebar.png` и `/private/tmp/studio-pages-separate-thread-page.png`. Проверка Header подтверждает одну композицию на Page и в отдельной story Layout, Subject Account → Settings → Back to workspace, Profile Select в мобильном меню и возврат фокуса на hamburger. Аккаунт расположен слева от hamburger; top drawer = bottom navbar = 71.9921875 CSS px на мобильном экране. Скриншот Header: `/private/tmp/studio-header-composition.png`. Viewport override снят. User tab оставлен на исходной story создания Thread. Storybook работает на 4321.

Ранее пройденные проверки файлов, proposal, Cmd Enter, account navigation и Host composition записаны в предыдущем Git состоянии handoff. Host сохраняет четыре локальные модели и пять отношений. Предыдущая production Host build прошла с 8 GiB heap; текущий шаг production не меняет и эту сборку не повторяет. Ранее вошедшие в PR Knowledge/MCP изменения сохраняются.

## Git и границы

В локальной ветке находится отдельный production-коммит `94f63c6a75` про JEV. Он сохранён локально и отсутствует в PR #371. Публиковать только новые Studio commits через cherry-pick в checkout `codex/studio-products-review` поверх PR head; не пушить всю локальную ветку. Проверить отсутствие 94f63c6a75 в ancestry публикуемого HEAD, совпадение Studio/документов, нормальный push в codex/ai-chat-ui-review и actual PR head/body. Не использовать force push.

Чужие изменения исключены: .agents/.claude/.codex README, AGENTS.md, CLAUDE.md, review-pr workflow/skill, workspace business/brand/strategy/design, singlepagestartup product, pre-development cursors, ISSUE-372, PR #368 description, apps/api uploads. Текущий шаг включает только Studio компоненты, их tools/tests/metadata, Studio README, этот handoff, план и PR #371 description.

## Profile overview и объектные варианты

Host Layout ai-chat-project удалён. Его project frame, toggle и drawer находятся в social/models/profile/singlepage/ai-chat-project-overview; stories, manifest, Figma metadata и три Page manifests указывают на эту модель. Каждая из трёх project Pages использует единственный Host Layout ai-chat-header. Public entry принимает variant=ai-chat-project-overview, profileId, selected и content slot. Scope и Sidebar — private siblings Profile, без импорта собственного dispatcher.

В 25 entity entries объекты singlepage/startup собираются в root variants.ts. Startup spread последний. Component выбирает вариант динамически; mapped IComponentProps сохраняет обязательные props каждого варианта. Native relation find и полные aliases сохранены. Тесты проверяют registry precedence, отсутствие runtime cycles и один Host Layout с native Profile overview на project Pages, включая отказ чужому Profile.

Проверки: 270 тестов/33 файла; TypeScript checkout и /private/tmp/studio-isolation-fixture; inventory и metadata; content --check; code-placement и diff --check. Isolated Storybook: /private/tmp/studio-profile-overview-build.log и /private/tmp/studio-profile-overview-storybook. В fixture только Studio/tools и сторонние node_modules, без libs/apps/host/root tsconfig.

Browser: desktop collapse/reopen, Products → Profile settings → Products → New thread, выбор Product assistant. На мобильном drawer начинается у bottom navbar = 71.9921875 CSS px; Profile button доступна, переход к New thread закрывает drawer, scrollWidth = clientWidth. DOM содержит один host.layout.ai-chat-header и social.profile.ai-chat-project-overview с data-id pottery. Warning/error logs пусты. Viewport override снят, user tab оставлен на story New thread. Screenshot: /private/tmp/studio-profile-overview-composition.png. Storybook работает на 4321.
