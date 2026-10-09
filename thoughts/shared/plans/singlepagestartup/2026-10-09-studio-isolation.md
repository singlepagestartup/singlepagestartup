# Локальная реализация Studio

Статус: отдельные страницы и доменные компоненты реализованы и проверены. Один Products остаётся активным примером; PR #371 ожидает code review. Основание: запрос в текущем чате и review PR #371. Ветка: `codex/studio-host-models`; исходный коммит прототипа: `a826615f6d`.

Studio содержит собственные React views, интерфейсы, локальные примеры и операции состояния. Profile и Chat передают идентификаторы, параметры отображения и slots. Thread, Source и File владеют своими данными и обработчиками в локальных providers. Каталоги `modules/<module>/{models,relations}/<entity>/singlepage/<variant>` сохраняют владельцев компонентов. RBAC Subject владеет account provider. Общие визуальные элементы находятся в существующем interface-kit, чистые операции — в workspace/utils. Studio не зависит от libs, Host, production SDK и production статики.

Предыдущие разделы фиксируют завершённые этапы декомпозиции. Текущее устройство — в разделе «Один Products и данные на уровне моделей» и handoff.

## Этапы

- [x] Прочитать PR #371 и определить внесённые прототипом production-изменения. Запустить сборку Host до исправления.
- [x] Перенести AI Chat views и данные в соответствующие локальные модели и связи Studio. Перенести provider в RBAC Subject, утилиты и примеры в Studio.
- [x] Перенести Host state/helpers/constants из libs/shared, заменить SDK-типы локальными интерфейсами четырёх моделей и пяти связей. Сохранить CRUD и композицию.
- [x] Удалить добавленные прототипом production variants, route, preset и статику. Сохранить последующие изменения Knowledge/MCP и чужие workspace-правки.
- [x] Сделать стили, шрифты, изображения и генерацию контента локальными. Убрать оставшиеся импорты libs из Studio, включая экспорт PNG/PDF.
- [x] Добавить проверку границы импортов. Проверить типы, тесты состояния, Storybook build, Host build и основные истории в браузере.
- [x] Записать результаты и оставшиеся ограничения в handoff.
- [x] Перенести project workspace из Social Chat в Social Profile, выделить profile selector и передавать его в header через slot. Проверить переключение профилей и независимость их локального состояния.
- [x] Разрешать профиль пользователя через Subject и subjects-to-social-module-profiles; перенести account dropdown в вариант Social Profile.
- [x] Разрешать доступные проекты через профиль пользователя, profiles-to-chats и чат с вариантом проекта. Учитывать ID из маршрута и отсутствие связи.
- [x] Перенести центральную рабочую область из chats-to-threads в Social Profile. Навигацию знаний и чатов собирать через существующие связи и локальные модельные компоненты.
- [x] Проверить изоляцию, типы, отношения разных пользователей, маршруты, Storybook и работу меню в браузере; обновить handoff и PR.

## Декомпозиция блоков знаний

- [x] Проверить production Source, profiles-to-knowledge-module-sources и sources-to-file-storage-module-files по README, schema и frontend. Source содержит title/content/description; несколько File связаны по sourceId/fileStorageModuleFileId и orderIndex. Удаление связи сохраняет File. Редактор меняет пользовательский блок content и сохраняет описания материалов.
- [x] Выделить каждый блок в локальный вариант Source ai-chat-section. Отделить группировку Brief/Strategy от полей Source, а параметры отображения файлов — от production отношений.
- [x] Собрать редактор через Profile-to-Source find и вложения через Source-to-File find. Передавать записи и обработчики через props, без imports из libs.
- [x] Проверить изоляцию источников и файлов, уникальность пары Source/File, сохранение описаний при редактировании, несколько вложений и detach. Проверить Storybook на desktop/mobile.
- [x] Обновить handoff и PR с результатами и оставшимися границами локальных адаптеров.

## Декомпозиция разговоров

- [x] Собрать Profile → Chat → Thread → Message через локальные find-варианты существующих profiles-to-chats, chats-to-threads и threads-to-messages.
- [x] Представить Brief, Strategy, Brand, Design, Products и рабочие разговоры отдельными Threads одного Chat. Сохранить независимые сообщения и черновики.
- [x] Перенести заголовок, conversation, proposal, Working On и composer в Thread. Message отображает одну запись; Profile navigation, создание и настройки Thread имеют отдельные views.
- [x] Передавать Sources из Profile и фильтровать документную группу по slug. Working On выбирает Source IDs; рабочие Threads получают все Sources профиля без селектора разделов.
- [x] Проверить типы, тесты, Storybook без production-кода, отправку и Source updates, переключение тредов и mobile navigation. Обновить документацию и PR.

## Критерии

В коде Studio нет импортов из libs, apps/host или production aliases. Production не импортирует Studio. Storybook собирается из локальных Studio views. Сохраняются документы, чаты, настройка агентов, мобильный sidebar и Host composition. Проверки выявляют нарушение границы до сборки.

Ход работы: `thoughts/shared/handoffs/singlepagestartup/studio-isolation-2026-10-09.md`.

- [x] Реализация всех 42 вариантов AI Chat находится в Component.tsx; index.ts экспортирует компонент, публичные типы и необходимые вспомогательные компоненты. Fixture examples находятся в Component.stories.tsx. View.tsx удалены, импорты и тесты используют index.ts; адреса stories сохранены.

## Файлы и свободное создание тредов

- [x] Каждый Source показывает единый список Files, загрузку нескольких файлов, добавление существующего файла и detach выбранной связи. Оригиналы и delivery доступны отдельными файлами.
- [x] Удалить Save reviewed version, статусы документов, review snapshots и ограничения создания тредов. Новые ответы и Markdown export используют текущие знания; история сообщений сохраняет свой контекст.
- [x] Дать Start a thread до загрузки и анализа материалов. При переходе подготовить пустые разделы документов для последующего заполнения.
- [x] Согласовать stories, role guidance, генерируемые данные и документацию; проверить типы, тесты, изолированную сборку и браузер.

## Один Products и данные на уровне моделей

- [x] Проследить передачу aggregate Profile → Chat → Thread → Source и проверить поля Social Skill в production (только чтение).
- [x] Оставить один Products.md, один готовый Thread и один Source. Profile хранит только имя и навигацию; Chat соединяет Thread; состояния Thread, Source и File принадлежат своим локальным моделям.
- [x] Убрать из активного интерфейса выбор нескольких агентов, документов, разделов и создание дополнительных тредов. Working On: весь документ или единственный Source. Один агент использует один навык работы с продуктами.
- [x] Сохранить редактор, файлы, отправку Cmd/Ctrl Enter, применение предложений, переключение проектов и мобильную навигацию.
- [x] Обновить stories и проверки границ/состояния, выполнить типы, тесты и изолированную сборку, проверить в браузере.
- [x] Зафиксировать результат и обновить PR #371.
- [x] Показывать New thread в навигации проекта. Открывать страницу создания с названием, выбором одного агента, просмотром навыка и Cancel. Submit демонстрирует feedback без создания записей.

Новые локальные React providers живут рядом с компонентами соответствующей модели в существующих каталогах variants. В production ничего не переносим. Создание отдельных продуктов проектируем позже; этот шаг оставляет одну карточку знания Products.

## Отдельные страницы и доменные компоненты

- [x] Каждый Host Page отображает один экран: landing, register, login, account settings, help, tokens, project create, Products, project settings, thread create. Последние два получают отдельные маршруты и stories.
- [x] Host Layout владеет раскладкой и мобильным drawer. Page импортирует sidebar из Social Profile и содержимое из соответствующей модели.
- [x] Social Profile содержит идентичность, связи доступа, sidebar и формы создания/настройки профиля. Chat связывает Products Thread; Thread отображает разговор; Source отображает документ и карточку знания.
- [x] Компоненты получают названия по роли: sidebar, project select, products, document, card, document link. В Page и Profile нет внутреннего выбора экрана по URL.
- [x] Preview-адаптер Storybook переключает отдельные страницы и сохраняет локальные состояния моделей при переходах. Production-код не изменяется.
- [x] Проверить импортные границы, типы, существующие сценарии, отдельные страницы в браузере и мобильный drawer. Обновить handoff и PR.

Результат: десять конкретных Host Page, два Host Layout, Social Profile sidebar/create/settings/select. Каждый Page Component содержит 9–51 строку. Router находится в website/Preview.tsx; модельные providers сохраняют состояние при смене страниц. Проверки: 260 тестов, TypeScript, studio:validate, metadata/content checks и изолированная сборка Storybook. Browser подтверждает переходы, сохранение данных, форму без новой записи и мобильную иерархию navbar/sidebar.

## Header и граница Website Builder

- [x] Website Builder Header разрешает Logotype и Buttons Array через существующие типы отношений; Buttons Array разрешает Button. Help принадлежит Button, SVG — Logotype.
- [x] Profile Select и Subject Account передаются страницами через slots/props. Header не импортирует Social, RBAC или Host, включая зависимости через shared helpers.
- [x] Отдельный Host Layout `ai-chat-header` содержит Header. Все Pages с этим header используют этот Layout; общий ServicePage отображает только содержимое.
- [x] Обновить локальные stories, website adapters, manifests, inventory и карту компонентов.
- [x] Проверить направления импортов и отсутствие циклов, композицию, типы, существующие сценарии, изолированную сборку и браузер на desktop/mobile.
- [x] Зафиксировать результат и обновить PR #371. Production остаётся отдельной реализацией.

Результат Header: семь новых вариантов и девять Pages с общим Layout. 264 теста в 32 файлах, TypeScript и изолированная сборка Storybook проходят. Browser проверяет desktop/mobile меню, account navigation и границу sidebar/navbar. SHA и опубликованный PR head доступны в Git и PR #371.

## Общий вход моделей и имена связей

- [x] Layout `ai-chat-header` содержит собственный frame и не импортирует соседний Layout.
- [x] Пункт проекта — memoized Social Profile `ai-chat-project-item`; селектор использует этот вариант. Project остаётся Profile, отдельной модели project в Social нет.
- [x] Общие локальные Component/index модели выбирают AI Chat вариант по типизированному `variant`. Внешние вызовы используют имя ModuleModel; relation aliases совпадают с именами связей.
- [x] Pages, активные доменные компоненты, stories и website previews используют общие входы. Внутренние варианты одной модели остаются прямыми импортами внутри этой модели.
- [x] Проверить типы, import graph/cycles, model dispatch, relation scoping, stories и browser desktop/mobile. Обновить tracking, metadata и PR #371 отдельным Studio commit.

Результат: 16 общих входов моделей и девять отношений с native aliases. Шесть выделенных вариантов: пункт проекта, аватар и выбор агента, pending File, File preview и asset preview. Их stories используют общий вход. Cross-model вызовы выбирают variant; внутренние siblings не импортируют собственный dispatcher. 268 тестов, TypeScript в checkout и isolated copy, metadata/content checks, изолированная Storybook сборка и desktop/mobile браузер проходят.
