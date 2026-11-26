---
date: 2026-11-26
researcher: flakecode
git_commit: d4b1e2473e2c3288dd1b9fa185e8debe47012fce
branch: codex/issue-442-profile-orders-chats
repository: singlepagestartup
topic: Заказы покупателя и Social Chat
tags: [research, host, rbac, ecommerce, social]
status: complete
last_updated: 2026-11-26
last_updated_by: flakecode
---

# Заказы и переписка покупателя

## Путь из профиля

Виджет настроек на странице `/ai-chat/settings` содержит вкладку покупок с чеками и повтором оплаты. По адресу `/rbac/subjects/settings` установлен более ранний виджет управления способами входа. Основная навигация использует меню Subject. Ссылки в нём и в мобильном переключателе настроек определяют, найдёт ли покупатель новый раздел. Исторические AI-проекты и материалы имеют отдельные ссылки.

- `libs/modules/rbac/models/widget/frontend/component/src/lib/singlepage/subject-me-profile-settings/ClientComponent.tsx:43`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/account-ai-chat/ClientComponent.tsx:157`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/button-default/Component.tsx:140`

## Маршруты и наследование

Для списка, чата и треда уже есть Host Pages. Страница списка с ID f6ca9dac-8c24-4afb-9922-446656e91a6f через связь с Host Widget и External Widget загружает RBAC Widget списка. У него есть отдельная связь с оформлением Website Builder. Страницы чата и треда используют один экземпляр виджета обзора. Host уже передаёт в RBAC параметры `ecommerce.orders.id`, `social.chats.id` и `social.threads.id`. Виджеты запускают чтение текущего Subject в браузере. Registry объединяет базовые варианты singlepage с переопределениями startup. Для заказа покупателя отдельные страницы в проверенных снимках отсутствуют.

- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/Component.tsx:38`
- `libs/modules/rbac/models/widget/frontend/component/src/lib/singlepage/subject/me/social-module/profile/chat/list-default/Component.tsx:13`
- `.agents/contracts/engineering/frontend-components.md` и `.agents/contracts/engineering/module-dependencies.md`

## Данные заказа

RBAC проверяет текущего владельца, ограничивает выборку его связями с заказами и исключает тестовые заказы продавца. Фильтр history охватывает услуги в работе и оформленные покупки. Отображение чеков и продлений использует отдельное расширение purchaseDetails. Сохранённые строки заказа содержат количество и ссылку на родительскую позицию. Для оплаченных позиций доступны снимки начислений. У старых заказов может отсутствовать переписка. Чтение discussionForOrder с customerId и orderId находит единственную задачу и существующий Social Chat с тредом. Создание задачи для просмотра меняет смысл операции.

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.ts:34`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/index.ts:491`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/cart-details.ts:43`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/purchase-details.ts:151`
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/work/index.ts:142`

## Чаты и проверка результата

Social проверяет связь профиля с Subject, собирает членство по профилям и проверяет доступ к обсуждениям CRM. У администратора есть отдельные права. Существующий список получает одну страницу до 100 чатов. Отправка сообщения в тред работы использует механизм customerWork, а кабинет исполнителя в CRM читает тот же тред. Подтверждение результата и тестовая оплата уже существуют. Провайдер dummy проводит платёж через локальный callback. Статус оплаты, реакция агента и появление реплик у второй стороны требуют отдельных наблюдений.

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/chat/collection.ts:39`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find.ts:28`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:221`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/checkout.ts:333`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/payment-dispatch.ts:208`

## Предыдущие проверки

В PR #422 проверяли отдельные браузерные сессии и оплату 500 ₽. Эти результаты относятся к прежним точкам входа. Сценарии и фикстуры лежат в `apps/api/specs/scenario/singlepagestartup/issue-418`. Отчёт — `thoughts/shared/plans/singlepagestartup/ISSUE-418-store-service-followup.md`, строки 84–103. План #407 описывает отдельное изменение владения заказами между профилями одного аккаунта. В исследованной ветке действует текущий контракт владения Subject.
