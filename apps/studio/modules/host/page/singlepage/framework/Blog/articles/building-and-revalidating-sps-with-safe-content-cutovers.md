---
confirmation: { confirmed: false }
slug: "building-and-revalidating-sps-with-safe-content-cutovers"
createdAt: "2026-10-23"
category: "devops"
title: "Публикация изменений: сборка, кеши и сохранённые связи"
excerpt: "Как проверить собранный Host, порядок проверок доступа и повторяемое переключение компонентов страницы."
cover: "safe-build-rollout"
coverAlt: "Команда проверяет изменения проекта за рабочим столом."
author: "Редакция SinglePageStartup"
authorRole: "Архитектура и разработка"
---

Перенос дизайна из Storybook в работающий SPS меняет код и сохранённую композицию. Новый вариант может быть зарегистрирован, но Host Widget всё ещё указывает на прежнюю рамку. Новая рамка может отображаться, а корзина отправлять неполный запрос. Проверка включает собранный Host, точные связи записей и результат операций.

## Соберите приложение, которое будет работать

Корневые команды `host:build` и `host:start` используют обёртку Host с ожидаемым окружением Node. Проверяйте сборку с локальным API и его сохранёнными записями. Чтение cookie сессии внутри ISR fallback может сломать собранный маршрут, даже если переход в dev работал.

```sh
npm run host:build
npm run host:start
```

Публичный каталог может остаться серверным, а RBAC Widget текущего пользователя — монтировать свою операцию на клиенте. Параметр `isServer: false` внутри произвольного серверного дерева сам по себе не создаёт клиентскую границу. Проверьте публичный вход, параметры reader и готовые JSX-слоты.

## Различайте кеши

Nx кеширует результаты задач. API кеширует ответы HTTP. React Query хранит результаты смонтированных запросов. В Host также есть кеши Next.js для данных и страниц. Очистка одного не делает остальные актуальными. Определите слой, который возвращает прежнюю статью, до удаления состояния.

API регистрирует разбор запроса и проверку закрытого содержимого до кеша ответа. Защищённые ресурсы исключены из прежнего и нового путей кеширования. Проверка байтов файла выполняется до статической отдачи.

```ts
app.use(parseQueryMiddleware.init());
app.use(protectedBlogContent.init());
// The response cache is registered after these guards.
app.route("/api/blog", blogApp.hono);
```

Отрывок показывает относительный порядок, а не всё приложение. Условная регистрация кешей и остальные middleware находятся в `apps/api/app.ts`.

## Отправляйте обновления после записи

Общий publisher mutation-effects инвалидирует темы API до отправки прежнего события revalidation. Вызывайте его после commit транзакции. Иначе другой браузер может получить событие и перечитать прежний кеш или незавершённую запись. Механизм согласованности учитывает реальные зависимости чтений и сохраняет доставку при сбое последующего обновления.

Маршрут Host revalidation принимает пути или ограниченный набор тегов. [Next.js revalidateTag](https://nextjs.org/docs/15/app/api-reference/functions/revalidateTag) инвалидирует связанные с тегом данные. Используйте действующий маршрут и транспорт; отдельный endpoint для одного Widget создаёт ещё один путь. Сбой обновления кеша учитывается отдельно от успешной записи в базу.

## Переключайте точные сохранённые связи

Инструмент переноса Framework разделяет prepare, apply, verify и rollback. Его вход задаёт конкретные связи Host, CRM, Article и представлений. Общая hero-рамка отделяется от контактной формы до переключения потребителя. Результирующие связи читаются обратно; повтор уже выполненного манифеста пропускает удовлетворённые операции.

Неподдерживаемое совместное использование приватного графа блокируется на подготовке. Перед приватной отметкой граф изолируется. Откат оформления сохраняет классификацию безопасности и принятый период там, где это предусмотрено манифестом: возврат прежней рамки не разрешает открыть материалы подписчиков.

## Проверьте действия и восстановление

Используйте несколько атрибутов, две валюты, сохранённое количество в корзине и checkout, возвращающий реальную ссылку Invoice. Измените сохранённую цену перед checkout и прочитайте связи после него. После разрешённого чтения закрытого материала проверьте отказ другому пользователю.

Завершите проверкой широкого и узкого экранов, консоли, сети, точных связей и повторной операции. При rollback так же внимательно проверьте восстановленные связи. Укажите сборку, маршруты, реальный провайдер или тестовый транспорт и пределы проверки.

## Исходный код

- [package.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/package.json)
- [nx.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/nx.json)
- [tools/runtime/host.mjs](https://github.com/singlepagestartup/singlepagestartup/blob/main/tools/runtime/host.mjs)
- [apps/api/app.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/api/app.ts)
- [libs/shared/backend/api/src/lib/mutation-effects/index.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/backend/api/src/lib/mutation-effects/index.ts)
- [libs/middlewares/src/lib/revalidation/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/middlewares/src/lib/revalidation/README.md)
- [apps/host/app/api/revalidate/route.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/host/app/api/revalidate/route.ts)
- [tools/runtime/framework-widget-links.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/tools/runtime) (каталог; файл пока находится в рабочей ветке)
- [tools/runtime/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/tools/runtime/README.md)
- [apps/api/specs/integration/commerce-checkout.integration.spec.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/apps/api/specs/integration) (каталог; файл пока находится в рабочей ветке)
