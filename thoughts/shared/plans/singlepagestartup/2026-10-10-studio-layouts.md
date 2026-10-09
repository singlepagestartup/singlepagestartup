# Studio: композиция страниц через Host Layout

Статус: реализация завершена; проверка и публикация.

## Границы

Host Page выбирает Layout и собирает содержимое из моделей. Host Layout
подключает Website Builder header/footer и передаёт в header Subject и Cart.
Website Builder использует только свои Widget, Logotype, Buttons Array и Button.
Данные и взаимодействия остаются локальными. Production `libs` не меняется.

## Работа

- Layout `ai-chat` становится layout лендинга с отдельными header/footer.
  Header принимает кнопку входа из Subject, использует логотип `ai-chat`
  и Buttons Array → Button для Try the chat.
- Лендинг состоит из отдельных Widget: hero, try (слот children для Chat),
  continue. Host Page вставляет Social Chat в try. Превью рабочего документа
  также собирается через Host Page, без импорта Social в Website Builder.
- Layout `ai-chat-header` сохраняет навигационные слоты и получает footer.
- Layout `website` собирает navbar и footer для существующих публичных страниц.
  Navbar принимает Subject/Cart слотами. Меню пользователя принадлежит Subject;
  Admin Panel доступен в этом меню после входа.
- Логотипы footer/navbar и навигационные ссылки используют модели Website Builder.
  Страницы больше не подключают navbar/footer самостоятельно.
- Stories, manifests, Figma metadata и генерация копии соответствуют композиции.

## Проверки

TypeScript; тесты публичных входов и ацикличности; проверки Studio metadata,
копии AI Chat и размещения файлов; Storybook build. В браузере: лендинг,
кнопки переходов, чат-превью, обычная страница, меню аккаунта, корзина и мобильная
навигация. Проверить отсутствие отдельной публичной ссылки Admin Panel.

## Состояние checkout

Ветка `codex/studio-host-models`, исходный HEAD `27d7553431`.
Существующие изменения business-документов, агентских инструкций и production
файлов не относятся к задаче. При публикации переносить только собственные
коммиты в ветку PR #371: `codex/ai-chat-ui-review`.
