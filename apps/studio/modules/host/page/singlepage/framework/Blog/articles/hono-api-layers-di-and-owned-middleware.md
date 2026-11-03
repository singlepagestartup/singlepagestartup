---
confirmation: { confirmed: false }
slug: "hono-api-layers-di-and-owned-middleware"
createdAt: "2026-10-23"
category: "backend"
title: "Hono в SPS: путь запроса от API до базы данных"
excerpt: "Контроллер, сервис, репозиторий и middleware: где проверять запрос, выполнять операцию и ограничивать доступ к записям."
cover: "hono-layered-api"
coverAlt: "Коллеги обсуждают устройство проекта за столом."
author: "Редакция SinglePageStartup"
authorRole: "Архитектура и разработка"
---

API SPS работает на Hono в `apps/api`. Host подключает приложения бизнес-модулей по адресам `/api/blog`, `/api/ecommerce` и другим. Запрос Blog проходит общий конвейер приложения, а контроллер, сервис и репозиторий остаются в пакете модели. Второй обработчик той же операции в Next.js создал бы отдельный серверный путь с другими проверками и кешем.

## Начните с bootstrap модуля

Bootstrap Article создаёт контейнер Inversify и связывает App, Controller, Service, Repository, Configuration и обработчик исключений с общими DI-токенами. Он загружает связи, получает App и запускает его. Обычная модель использует `CRUDService` и `DatabaseRepository`.

```ts
@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {}

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {}
```

Особая операция располагается рядом с сервисами того же вида. Контроллер разбирает вход HTTP и вызывает операцию. Фильтрация, проверка схемы и сохранение проходят через владеющий репозиторий. Запрос базы данных, скопированный в представление или контроллер, обходит ожидаемое поведение этого слоя.

## Проверьте порядок middleware

Hono выполняет middleware в порядке регистрации до обработчика и возвращается через них после `await next()`. [Руководство Hono](https://hono.dev/docs/guides/middleware) описывает ранние ответы и обработку результата. В SPS разбор запроса создаёт типизированные параметры; проверка ресурса может добавить ограничения; кеш защищённого ответа не должен срабатывать до этой проверки.

Middleware маршрута принадлежит `backend/app/middlewares` своего модуля. Контроллер соединяет определения, экземпляры middleware и обработчики. Чтение своей корзины, чужой корзины и действие оператора имеют разные условия доступа, даже если используют одну модель.

## Ограничьте данные до пагинации

Ограничение владельца входит в запрос репозитория. В чтении корзины Subject разрешённые ID заказов объединяются с фильтрами через `filters.and`. Фильтрация готовой страницы после `limit` даёт неполную страницу и неверный счётчик. Один набор ограничений нужен списку, подсчёту, чтению по ID и дополнительным связанным данным.

Общий ParseQuery сохраняет уже разобранный запрос при вложенном выполнении приложений Hono. Повторный разбор сырого URL мог бы стереть ограничения. Проверяйте реальную вложенную композицию, а не один обработчик с подставленными параметрами.

## Сохраните направление зависимостей

Операции RBAC Subject могут координировать нижележащие Blog, Ecommerce и Billing. Сам Blog не импортирует RBAC, чтобы узнать подписку пользователя. API Host соединяет интеграцию и передаёт владеющие сервисы. Инфраструктура хранит общие правила транспорта, базы и кеша.

Ограничение действует и для типов, экспортов и схем. Авторство между профилем и статьёй принадлежит Social, который расположен выше Blog. Композиция остаётся у потребителя, которому разрешено читать обе стороны.

## Проверьте сохранённый результат

Приёмочный тест отправляет запрос формы SDK через middleware, контроллер и сервис в локальный PostgreSQL. Он читает сохранённые связи и проверяет отказ другому Subject. Для нескольких записей проверяются откат и повтор операции в границах транзакции.

Внутри одного процесса сервис читает переданные ему возможности напрямую. Вызов своего HTTP API из контроллера добавляет повторные авторизацию, разбор и кеширование. Команда `audit:controller-read-self-http` помогает найти такие границы; её вывод сопоставляют с реальным путём запроса.

## Исходный код

- [apps/api/app.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/api/app.ts)
- [libs/modules/blog/models/article/backend/app/api/src/lib/bootstrap.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/backend/app/api/src/lib/bootstrap.ts)
- [libs/modules/blog/models/article/backend/app/api/src/lib/service/index.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/backend/app/api/src/lib/service/index.ts)
- [libs/modules/blog/models/article/backend/app/api/src/lib/repository.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/backend/app/api/src/lib/repository.ts)
- [libs/shared/backend/api/src/lib/service/crud/actions/find/index.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/backend/api/src/lib/service/crud/actions/find/index.ts)
- [libs/shared/backend/api/src/lib/middleware/parse-query/index.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/backend/api/src/lib/middleware/parse-query/index.ts)
- [.agents/contracts/engineering/code-placement.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/.agents/contracts/engineering/code-placement.md)
- [.agents/contracts/engineering/module-dependencies.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/.agents/contracts/engineering/module-dependencies.md)
