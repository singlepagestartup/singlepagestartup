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

## Услуги бизнес-экспертов на страницах фреймворка

Проверено 26 ноября 2026 года на `9c3fe0f2e3`. Исследование расширяет #442 для сценария «два заказа у разных специалистов — знания одного клиента».

**Происхождение.** В тикете `thoughts/shared/tickets/singlepagestartup/ISSUE-ai-chat-production-integration.md:3` прямо указано `issue_number: none`. В нём зафиксированы материалы клиента, редактирование и экспорт документа, индексация и изоляция проектов. Проекции Studio и рабочее приложение вошли в PR #371 и #374. Issue #376 описывает перенос визуала на рабочие страницы фреймворка. За оформление услуг, версии результата, CRM, исполнителей и оплату отвечает продолжение в #418 / PR #422. [Studio](https://github.com/singlepagestartup/singlepagestartup/pull/371) · [Прежний помощник](https://github.com/singlepagestartup/singlepagestartup/pull/374) · [Framework](https://github.com/singlepagestartup/singlepagestartup/issues/376) · [Заказ услуги](https://github.com/singlepagestartup/singlepagestartup/issues/418)

**Публичное демо и реальные чаты.** Главная Host Page `c9d1562a-ff09-4381-a46d-23d67fa62643` подключает Website Builder Widget `631ec56d-556c-46c1-b6a4-f8d3f49560fd`. `landing-ai-chat/Component.tsx` читает настройки демо, `ClientComponent.tsx` держит его изменения локально. На Framework Page `23cdc964-5944-4114-92ea-021ac1669e1d` есть раздел `#cf-chat` со статическим контекстом проекта. В production уже действует переход со старой ссылки проекта в авторизованный Social thread. Публичный пример и сохранённые данные пользователей имеют разные владельцы. Маску старых адресов, проверку членства и ID тредов можно сохранить независимо от демонстрационного блока. При seed отсутствие JSON не удаляет старую связь из установленной БД.

- `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/landing-ai-chat/{Component,ClientComponent}.tsx`
- `libs/modules/rbac/models/subject/sdk/model/src/lib/ai-chat-project.ts:10`; `libs/shared/backend/api/src/lib/repository/database/index.ts:588`
- `apps/studio/modules/host/page/singlepage/framework/Landing.tsx:204`; `apps/studio/workspace/products/singlepage/singlepagestartup/website/Landing.tsx:428`

**Состав работы.** Актуальные разделы — brief, products, competitors, semantics, strategy, brand, design и materials. Продукты, исследования и материалы могут относиться к конкретному предложению; стратегия, бренд и общие правила дизайна — к проекту. Материалы включают изготовленный результат для конкретного канала. Studio использует статические проекции в `apps/studio/modules`; рабочие компоненты читают данные через SDK в `libs/modules`. Прогресс подготовки Studio, путь покупателя из `sales.yaml` и исполнение заказа в CRM имеют отдельные состояния.

- `.agents/workflows/pre-development.md:32`; `apps/studio/workspace/utils/index/singlepage.yaml:4`; `apps/studio/workspace/utils/pre-development/singlepage.yaml`; `.agents/workflows/design-to-implementation.md:8`

**Исполнитель и результат.** Product `kind=service`, предложение магазина, версия воронки `individual-service`, назначения сотрудника и навыков этапа поддерживаются сейчас. Воронка допускает выдачу через chat, pdf или image. В Studio есть предложение «Стратегия продвижения» за 4 900 ₽. Документированная сквозная приёмка #418/#442 относится к обложке. В PDF-пути шрифт читается из Studio, исключённого из контекста Docker. Локальные проверки генератора не подтверждают его работу в образе.

- `libs/modules/crm/models/{funnel,stage}/sdk/model/src/lib/workflow.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/product-agent.ts:32`
- `apps/studio/modules/ecommerce/product/singlepage/overview-customer-work/fixture.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/work/utils.ts:182`; `.dockerignore:76`

**Знания между заказами.** Приватная выдача заказа проверяет покупателя, файл и право на оригинал. Отдельно профилю можно сохранить текстовый Source и индекс. Формирование контекста уже различает источники отправителя, обученного сотрудника и навыков выбранного этапа. В Knowledge есть закрытые копии материалов и индексирование. В исследованном коде нет команды «сохранить выданную версию этого заказа в знания покупателя». Открытие PDF, заметка в истории чата и чтение результата другим экспертом требуют отдельных проверок.

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/work/index.ts:931`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/knowledge.ts:453`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/{personal,sources}.ts`; `libs/modules/knowledge/models/source/backend/app/api/src/lib/service/singlepage/index.ts:632`
