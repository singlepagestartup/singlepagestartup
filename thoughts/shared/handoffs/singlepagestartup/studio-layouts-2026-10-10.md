# Studio Layout: ход работы

Статус: реализация и все проверки завершены; коммит опубликован в PR #371.
План: `thoughts/shared/plans/singlepagestartup/2026-10-10-studio-layouts.md`.

## Композиция

Host Layout `ai-chat` собирает Website Builder `ai-chat-landing-header` и
`ai-chat-footer`. Host Page `ai-chat` вставляет Subject `ai-chat-sign-in` в header
и собирает Widget `ai-chat-hero`, `ai-chat-try`, `ai-chat-continue`. Social Chat
`ai-chat-preview` передаётся в children второго Widget на уровне Host Page.
Header использует Logotype `ai-chat` и Buttons Array → Button для Try the chat.

Layout `ai-chat-header` сохраняет слоты Profile Select и Subject Account и
подключает тот же footer. Layout `website` собирает обычный navbar/footer,
Subject `navbar-account` и Ecommerce Cart. Все 15 публичных страниц с обычным
navbar используют этот Layout. Управляемая корзина Product Page передаётся
слотами; остальные страницы используют локальную корзину Layout.

Website Builder navbar использует свои Logotype и Buttons Array/Button и
принимает account/cart через ReactNode. Admin Panel находится в меню Subject
после входа. Старые `HostNavbarDefault` и Widget `ai-chat-landing` удалены.
AdminV2 страницы сохраняют свой отдельный shell.

## Данные и метаданные

Publisher `tools/studio/products/publish-ai-chat.ts` создаёт отдельные копии
hero/try/continue/footer и общий локальный fixture
`apps/studio/workspace/utils/products/ai-chat-website.generated.json` для Chat.
Workspace website preview вызывает тот же Host Page. Stories, manifests,
Figma metadata и inventory соответствуют новым вариантам. Новые Figma записи
имеют статус `not-created` и пустые идентификаторы.

## Проверки

Итоговый проход: 280 тестов в 38 файлах, Studio TypeScript, metadata,
AI Chat copy, code placement и Storybook build прошли. Inventory содержит
61 модель в 15 модулях, 838 production вариантов и 164 покрытых варианта.
Повторная генерация не создаёт дополнительных файлов. Сборка опубликованной
версии в `/private/tmp/studio-layout-isolation` также прошла: в копии находятся
только Studio, её инструменты, package.json и ссылка на установленные зависимости;
`libs`, `apps/host` и корневой tsconfig отсутствуют. Лог:
`/private/tmp/studio-layout-isolated-build.log`.

В браузере проверены Try the chat, Sign in, Check materials, меню профиля с
Admin Panel, обычная корзина с изменением количества, Product Add to cart,
мобильное меню и Escape с возвратом фокуса. При ширине превью 320px header и
main не имеют горизонтального переполнения; Try the chat прокручивает к секции.
Размеры браузера и Storybook viewport восстановлены. Последние ошибки в журнале
относятся к промежуточной записи story-файла до успешной сборки.

Storybook работает на 4321; вкладка пользователя возвращена к `/ai-chat/`.
Снимок: `/private/tmp/studio-layouts-landing.png`. Логи проверок:
`/private/tmp/studio-layout-{tests,types,validation,build}.log`.

## Git и продолжение

Рабочая ветка: `codex/studio-host-models`, исходный HEAD `27d7553431`.
PR #371: `codex/ai-chat-ui-review`, исходный опубликованный HEAD `9f01dbaec3`.
Локальный коммит реализации: `a7baa646d2`. Опубликованный коммит реализации:
`f3e2a814755614f62be338869fdd957afb2c06b7`. Все 131 изменённый путь в checkout
публикации совпадают с локальными файлами. Production-коммит `94f63c6a75`
отсутствует в истории ветки PR. Push выполнен без force.

Новые агенты не запускались. Посторонние изменения business-документов,
агентских инструкций, API-файлов и production сохранять и не включать в коммит.
