# Единые настройки аккаунта Studio

Статус: завершено. План: `thoughts/shared/plans/singlepagestartup/2026-10-10-studio-account-settings.md`.

## Реализация

- Обе страницы настроек используют Widget `subject-me-account-settings`; оболочки сайта и AI Chat остаются в Host. Токены регулируются `showTokens`.
- Редактор Subject `me-profile-information` показывает текущего пользователя, исходный маскот, имя, headline, описание и slug. Изображение загружается здесь и применяется после Save profile; меню Social Profile не содержит загрузки аватара.
- Subject `me-identity-find-information` собирает Identity `card-default`, `account-change` и `provider-connect`. Карточка получает `renderFlow` от Subject, без импорта собственного dispatcher.
- Почта: подтверждение текущего адреса → новая почта → подтверждение нового адреса → локальное обновление аккаунта. Пароль: подтверждение почты → текущий/новый/повтор → результат. Демо-код `123456`; письма не отправляются, пароли не сохраняются.
- Реестр методов: email/password, Google, Telegram, кошелёк. Локально работают удаление, повторное подключение и добавление метода. Отдельного модуля Telegram нет.
- Subject `account-data` сохраняет покупки, обработку материалов, восстановление и подтверждение удаления. Старый Subject `ai-chat-settings` заменён общим Widget; content publisher обновлён.

## Проверки и публикация

285 тестов в 40 файлах проходят; после последней правки проверены ещё 10 тестов аккаунта, общего виджета и импортов. TypeScript, metadata/content checks, inventory, code placement и diff check проходят. Storybook собран в основном checkout и в отдельной копии Studio без `libs`, `apps/host` и root tsconfig.

В браузере проверены оба экрана, 320 px без горизонтального скролла, ошибочный код, два подтверждения почты, несовпадающие пароли, загрузка маскота, кошелёк, удаление/повторное подключение email, покупки и отмена удаления. Ошибок браузера нет. Исходный адрес `alex@example.com` восстановлен; временные вкладки закрыты, viewport сброшен. Снимок: `/private/tmp/studio-account-settings-desktop.png`.

Коммит реализации в корневой ветке: `d57de4680d`. Опубликованная реализация: `29034920c43bcb260e1bf0a9071cb6ef3fef3244`. PR: https://github.com/singlepagestartup/singlepagestartup/pull/371, ветка `codex/ai-chat-ui-review`. Голова реализации и описание PR проверены. Собственные файлы в checkout публикации совпадают с локальными; `94f63c6a75` не включён.

Корневая ветка `codex/studio-host-models` содержит посторонний production-коммит: напрямую её не отправлять. Будущие изменения публиковать точным cherry-pick в checkout актуальной головы PR, затем обычным push без force. Чужие изменения `.agents`, workspace, `libs/modules` и файлы ISSUE-372 сохранены и не входят в коммит этой задачи.
