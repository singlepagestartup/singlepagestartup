# Исправление границ Studio

Статус: реализация и проверки завершены; code review ожидается. План: `thoughts/shared/plans/singlepagestartup/2026-10-09-studio-isolation.md`.

PR: https://github.com/singlepagestartup/singlepagestartup/pull/371. Локальная ветка: `codex/studio-host-models`; PR branch: `codex/ai-chat-ui-review`. Исходный HEAD: `893f21a367`. Исправление зафиксировано коммитом `fix(studio): isolate local module previews from production`; точный SHA доступен через `git log -1`.

Review требует локальных Studio views без импортов production. Ошибочный прототип находится в `a826615f6d`; последующие Knowledge/MCP-коммиты сохраняются. Изменённые документы бренда, брифа, стратегии и singlepagestartup product принадлежат другим задачам.

24 варианта AI Chat имеют локальные View.tsx и index.ts; Storybook wrappers передают примеры и callbacks. Account provider находится в RBAC Subject. Host имеет локальные interface.ts четырёх моделей и пяти связей, helpers в workspace/utils/host-studio, composition UI в Host Page. Удалены production AI Chat variants, route, preset, статика и alias. Knowledge/MCP runtime сохраняется.

Проверки: 245 Bun-тестов по tools/studio, workspace и локальному Host Page, включая Host graph и проверки Markdown/агентов, Studio TypeScript, генератор контента --check, inventory, validator, code-placement и diff --check. Storybook build проходит как в checkout, так и в копии apps/studio + tools/studio без libs, apps/host и корневого tsconfig. Изолированная копия использует установленные сторонние зависимости через node_modules. Логи: /private/tmp/studio-correction-all-tests.log, studio-correction-tests.log, studio-correction-isolated.log, studio-correction-types.log.

Host production build проходит с NODE_OPTIONS=--max-old-space-size=8192; исходная попытка с обычным лимитом исчерпала память Node. Итоговый лог: /private/tmp/studio-correction-host-final.log. Прототипные production-реестры очищены; lint в Next build отключён существующей конфигурацией, это отдельная проверка.

Браузер: desktop Host composition; mobile 390 CSS px без переполнения; sidebar начинается на 72 px под navbar; Ctrl+Enter отправляет сообщение; редактирование и review Brief открывают New thread; создание чата и настройки контекста работают. Скриншот: /private/tmp/studio-isolation-mobile.png. Storybook остаётся на 4321.

Следующий шаг: code review исправления в PR #371. Production-перенос локальных views остаётся отдельным этапом. Бизнес-документы и загруженные файлы других задач не включать в commit.

Project selector и контейнер проектов относятся к Social Profile: `ai-chat-project-select` и `ai-chat-workspace`. Header получает готовый selector через `projectNavigation`; список, создание и selected state находятся в Profile workspace. Исправлены owner paths, manifests и термин `IProjectProfile`. В Studio используются локальные данные; API-запрос профилей при production-переносе должен находиться в компоненте Social Profile.

Проверки владельца профилей: 246 тестов, TypeScript, content check, inventory/validator и независимая Storybook-сборка прошли. Логи: /private/tmp/studio-profile-selector-tests.log, /private/tmp/studio-profile-selector-build.log. В браузере создание второго профиля, переключение и сохранение документа проверены; на 390 CSS px меню закрывается после выбора/создания и фокус возвращается на navigation trigger. Скриншот: /private/tmp/studio-project-profile-selector.png. Дополнительный commit: `fix(studio): own project navigation in Social Profile`.

Текущая работа: центральная область перенесена из Social chats-to-threads в Social Profile `ai-chat-project`. Меню аккаунта выделено в Profile `ai-chat-user-menu` и разрешается RBAC Subject `ai-chat-account` через subjects-to-social-module-profiles. Варианты `ai-chat-user` и `ai-chat-project` разделяют владельцев. Проекты разрешаются через profiles-to-chats и chat с вариантом проекта; ID маршрута должен соответствовать доступному профилю. Отсутствие связи отображает unavailable, без подстановки первого проекта.

Локальные find-компоненты трёх существующих связей используют apiProps.params.filters.and. Profile Sources проецируются из разделов текущего редактора; documentId — локальный ключ группировки, не новое production-поле. Chat navigation разрешается через profiles-to-chats. Сам редактор и операции пока используют прежний локальный агрегат; отдельное хранение Sources, файлов, сообщений и default Thread — следующий этап декомпозиции. API и векторный индекс этим изменением не подключаются.

Проверки текущего исправления: 250 тестов, Studio TypeScript в checkout и изолированной копии, publish --check, inventory и независимая Storybook-сборка прошли. Логи: /private/tmp/studio-user-profile-tests.log, /private/tmp/studio-user-profile-types.log, /private/tmp/studio-user-profile-isolated-types.log, /private/tmp/studio-user-profile-build.log. В браузере проверены владельцы current-user/pottery, ссылки Settings/Buy tokens и возврат к выбранному проекту, создание второго профиля и независимость его заметок, выбор документов, mobile 390 CSS px без overflow и sidebar на 72 px под navbar. Console errors отсутствуют. Скриншот: /private/tmp/studio-user-project-profiles.png. Production-код этим исправлением не изменён. Чужие workspace и workflow файлы не включать в commit.
