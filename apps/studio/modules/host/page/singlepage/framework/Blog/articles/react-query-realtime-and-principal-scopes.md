---
confirmation: { confirmed: false }
slug: "react-query-realtime-and-principal-scopes"
createdAt: "2026-10-23"
category: "frontend"
title: "React Query в SPS: изменения и актуальность данных"
excerpt: "Как обновлять данные после действий пользователя и изменений в другом браузере. Как отделять кеш одного аккаунта от другого."
cover: "react-query-realtime"
coverAlt: "Человек работает за ноутбуком в светлой студии."
author: "Редакция SinglePageStartup"
authorRole: "Архитектура и разработка"
---

Количество товара может измениться по кнопке, в другом браузере или на сервере. React Query хранит результаты SDK. Хранилище действий содержит события запросов и диагностику обновлений. Временный выбор и состояние отправки остаются в компоненте. Снимок событий не заменяет базу данных в браузере.

## Опишите запрос полностью

Операции `find`, `findById` и `count` используют `consistencyQueryKey`: маршрут, параметры и адрес API. Разделение учитывает и текущего пользователя, не помещая в ключ его секретные данные. Фильтр, страница или другой API означают другой набор данных.

```ts
import { consistencyQueryKey } from "@sps/shared-frontend-client-api";

const key = consistencyQueryKey("/api/blog/articles", { filters: { and: [{ column: "slug", method: "eq", value: articleSlug }] } }, clientHost);
```

Переменные примера получает владеющий reader. [Руководство TanStack Query](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys) объясняет включение параметров в ключ. SPS добавляет правила адреса API и текущего пользователя.

## Применяйте изменения к кешу

Общая фабрика мутаций обновляет кеш до пользовательского `onSuccess`. Создание исключает дубли по ID и согласует количество записей; изменение обновляет существующие записи; удаление убирает совпадения. Самописные SDK используют те же helpers и сохраняют учёт действий.

Новая статья не обязательно относится к текущей категории или странице списка. Прямая вставка допустима только там, где принадлежность известна; в остальных случаях нужен повторный запрос. Неизменённые строки сохраняют ссылки на объекты, чтобы `memo` и ключи по ID работали при изменении соседней строки.

## Учитывайте другие источники изменений

Общее WebSocket-соединение принадлежит Host. Успешный ответ API может связать запрос с непрозрачным идентификатором согласованности. Сервер определяет зависимости по реальным чтениям, включая пустые связи и подсчёты. Запросы без такого покрытия продолжают использовать прежние подписки.

Используйте общий жизненный цикл подписки и её очистку. Отдельный сокет в каждой карточке или таймер обновления сущности создают дополнительные владельцы. Общий транспорт уже обрабатывает переподключение, срок действия и проверку версии. Обновления, пришедшие во время запроса, не должны теряться после его завершения.

## Сменился аккаунт — изменился срок жизни данных

При смене пользователя сбрасываются приватные результаты, подписки и курсор событий. Обновление JWT того же пользователя может сохранить интерфейс до согласования данных. Ответы 401 и 403 очищают недоступное содержимое: одного скрытого блока недостаточно, если прежняя запись осталась в общем кеше.

Закрытый контент Article использует `QueryScopeProvider` с существующим QueryClient. Область содержит несекретный ключ ресурса и уникального владельца смонтированного экземпляра. Вложенные запросы наследуют область и `gcTime: 0`. Удаление области отменяет только её запросы, сохраняя публичные списки и соседние закрытые блоки. Сервер проверяет доступ при каждом защищённом чтении.

## Проверьте независимость областей

Прочитайте страницу от двух пользователей и откройте два закрытых блока. Истечение доступа или закрытие одного не должно удалять данные другого. При повторном открытии отмена прежнего экземпляра не должна затрагивать новый запрос.

Для действий строк используйте отдельные ID ожидания и стабильные callbacks. Подписка формы остаётся в нижнем компоненте, которому нужны значения. После перезагрузки `sessionStorage` со снимком действий не восстанавливается как данные сущностей.

## Исходный код

- [libs/shared/frontend/client/api/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/frontend/client/api/README.md)
- [libs/shared/frontend/client/store/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/frontend/client/store/README.md)
- [libs/middlewares/src/lib/revalidation/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/middlewares/src/lib/revalidation/README.md)
- [libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default/client.tsx](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default) (каталог; файл пока находится в рабочей ветке)
- [libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default/ClientComponent.tsx](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default/ClientComponent.tsx)
