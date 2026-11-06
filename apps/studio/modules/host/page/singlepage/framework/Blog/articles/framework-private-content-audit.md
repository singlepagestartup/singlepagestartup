---
confirmation: { confirmed: false }
slug: "framework-private-content-audit"
createdAt: "2026-10-23"
category: "backend"
title: "Закрытые материалы: доступ после оплаты и проверки на сервере"
excerpt: "Как защитить раздел статьи и его файлы, проверить срок оплаченного доступа и оставить публичную часть открытой."
cover: "subscription-access"
coverAlt: "Два человека изучают материалы на ноутбуке."
author: "Редакция SinglePageStartup"
authorRole: "Архитектура и разработка"
---

Закрытый раздел статьи — это правило доступа к сохранённым ресурсам. Замок на странице не мешает запросить Widget, вложенный Slide, связь или файл напрямую. Поэтому SPS классифицирует закрытое содержимое на сервере и проверяет чтения до кеша ответа. Заголовок и публичный текст статьи остаются открытыми; закрытый блок загружается отдельной операцией текущего Subject.

## Отметьте связь явно

Связь Article → Website Builder Widget с вариантом `private` отмечает защищённый корень. Связь Article → Ecommerce Product с вариантом `subscription` задаёт подходящий продукт подписки. Обычные связи `default` сохраняют смысл рекомендации товара. Вариант страницы и иконка замка эти связи не заменяют.

Чтение графа проходит поддерживаемые связи Features, Sliders, Slides, Buttons Arrays, Buttons, Logotypes и File Storage. Записи связей тоже являются ресурсами. Общий потомок или внешний неуправляемый файл требуют отдельного решения об изоляции. Один защищённый объект, одновременно используемый публичной страницей, создаёт неоднозначность. Сначала подготовьте и проверьте граф, затем публикуйте приватную отметку.

## Проверьте оплаченный период

RBAC сопоставляет заказы текущего Subject, позиции товаров, действующие Role и явные продукты подписки статьи. Подходящий заказ должен быть историческим, иметь разрешённый статус доставки, относиться к подписке и содержать нужный Product. Серверные начало и конец периода, принятый Invoice и отсутствие отзыва обязательны. Текущее время должно попадать внутрь периода.

Гостевой Subject может владеть оплаченной подпиской и действующим правом без подключённого способа входа. Заказ другого пользователя не даёт доступ. Состояние интерфейса входа и владение подпиской проверяются отдельно.

```ts
const content = await subjectApi.blogModuleArticleFindByIdContentFind({
  id: currentSubjectId,
  blogModuleArticleId: articleId,
  options: {
    headers: {
      Authorization: "Bearer " + sessionToken,
      "Cache-Control": "no-store",
    },
  },
});
```

Операция SDK возвращает упорядоченное содержимое и проверенный сервером доступ. Контроллер требует собственный ID Subject из JWT. Название ресурса и boolean из интерфейса не предоставляют право. Токен остаётся в существующем механизме сессии; пример не вводит новое хранилище.

## Не отправляйте закрытые данные при отказе

Результат сохраняет публичные узлы и непрозрачные закрытые позиции по `orderIndex`. При отказе закрытый элемент содержит состояние доступа, но не Widget, ID потомков, связи или текст. Разрешённый элемент содержит срок действия для удаления данных из интерфейса и повторной проверки после истечения.

Прямое чтение защищённого объекта по ID запрещено. Списки и счётчики получают ограничения до пагинации и агрегации. Проверка выполняется после разбора запроса и до обоих кешей API. Защищённые ответы используют `private`, `no-store` и учитывают авторизацию.

## Защитите содержимое файлов

ID файла и псевдонимы управляемого пути должны приводить к одной классификации доступа. Проверяются GET, HEAD и запросы диапазона. Закрытое изображение загружается через авторизованный SDK File Storage и временный object URL браузера. Обычный адрес картинки или оптимизатор не обязаны передавать bearer-токен посетителя.

## Проверьте отзыв доступа

Период заказа задаётся при доверенном принятии оплаченного счёта. Обычные create/update и изменения метаданных не должны его продлевать. Удаление предоставляющей Role отзывает связанный доступ; повтор операции не должен восстанавливать намеренно удалённое право.

Проверьте границу срока, другого Subject, прогретый кеш, прямые чтения ресурсов и файлы. Отдельно проверьте завершение доступа в уже открытом браузере. Доказательством служат сохранённое состояние и последующее чтение, а не один ответ интерфейса.

## Исходный код

- [libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/access.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage) (каталог; файл пока находится в рабочей ветке)
- [libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/graph.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage) (каталог; файл пока находится в рабочей ветке)
- [libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/protected-blog-content/index.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/backend/app/middlewares/src/lib) (каталог; файл пока находится в рабочей ветке)
- [libs/modules/rbac/models/subject/sdk/model/src/lib/blog-article-content.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/sdk/model/src/lib) (каталог; файл пока находится в рабочей ветке)
- [libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/subscription-period/index.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage) (каталог; файл пока находится в рабочей ветке)
- [libs/modules/file-storage/models/file/sdk/server/src/lib/singlepage/content.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/file-storage/models/file/sdk/server/src/lib/singlepage) (каталог; файл пока находится в рабочей ветке)
- [apps/api/specs/integration/private-content.integration.spec.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/apps/api/specs/integration) (каталог; файл пока находится в рабочей ветке)
