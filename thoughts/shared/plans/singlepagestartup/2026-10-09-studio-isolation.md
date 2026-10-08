# Локальная реализация Studio

Статус: реализация и проверки завершены; code review ожидается. Основание: запрос в текущем чате и review PR #371. Ветка: `codex/studio-host-models`; исходный коммит прототипа: `a826615f6d`.

Studio содержит собственные React views, интерфейсы, локальные примеры и операции состояния. Данные и обработчики передаются через props. Каталоги `modules/<module>/{models,relations}/<entity>/singlepage/<variant>` сохраняют владельцев компонентов. RBAC Subject владеет account provider. Общие визуальные элементы находятся в существующем interface-kit, чистые операции — в workspace/utils. Studio не зависит от libs, Host, production SDK и production статики.

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

## Критерии

В коде Studio нет импортов из libs, apps/host или production aliases. Production не импортирует Studio. Storybook собирается из локальных Studio views. Сохраняются документы, чаты, настройка агентов, мобильный sidebar и Host composition. Проверки выявляют нарушение границы до сборки.

Ход работы: `thoughts/shared/handoffs/singlepagestartup/studio-isolation-2026-10-09.md`.
