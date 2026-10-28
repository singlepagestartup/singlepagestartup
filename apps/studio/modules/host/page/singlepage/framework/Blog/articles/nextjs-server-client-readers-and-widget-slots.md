---
confirmation: { confirmed: false }
slug: "nextjs-server-client-readers-and-widget-slots"
createdAt: "2026-10-23"
category: "frontend"
title: "Next.js в SPS: загрузка данных и компоненты страницы"
excerpt: "Как статья проходит от сохранённой записи через SDK к интерфейсу. Где загружать данные и как передавать содержимое между компонентами."
cover: "next-server-client"
coverAlt: "Два человека обсуждают проект за рабочим столом."
author: "Редакция SinglePageStartup"
authorRole: "Архитектура и разработка"
---

Статья в SinglePageStartup — это сохранённая запись, результат запроса SDK и выбранное представление на странице. Карточку можно изменить, сохранив её идентификатор, тексты, файлы и операции. Перед изменением интерфейса проследите, какой компонент загружает запись и кто отвечает за её состояние.

## Проследите путь записи

В стандартном варианте Article файл `index.tsx` связывает клиентский и серверный SDK, Provider, загрузку и представление с общим компонентом. `Component.tsx` получает готовую запись и выводит её. Повторный запрос внутри представления создаст ещё один цикл загрузки той же статьи.

Название варианта задаётся в `interface.ts`, регистрируется в `variants.ts` и входит в публичный тип параметров. Одного файла с JSX недостаточно: сохранённая запись должна выбирать вариант через публичный вход. Слой `startup` заменяет соответствующую реализацию `singlepage` вместе с её контрактом.

## Выберите сторону выполнения

Серверные компоненты Next.js и клиентские компоненты имеют разные возможности. [Документация Next.js](https://nextjs.org/docs/15/app/getting-started/server-and-client-components) описывает передачу сериализуемых параметров и композицию через `children`. В SPS точку чтения выбирает `index.tsx`, данные получают reader-компоненты, а hooks и состояние браузера принадлежат `ClientComponent.tsx`.

Для обычной записи используется общий reader. Для особой операции допустимы локальные `client.tsx` и `server.tsx`, которые передают представлению одинаковый тип результата. Они заменяют чтение, а не оборачивают прежний reader ещё одним Provider. Параметр `isServer` выбирает способ чтения SPS; границу клиентского JSX всё равно нужно задать явно.

## Передайте уже загруженную запись

Если родитель уже получил результат SDK, `dataSource="props"` позволяет дочернему компоненту вывести его без второго запроса. Подписки, загрузка и ошибки остаются у родителя. После повторного запроса он передаст обновлённые параметры.

```tsx
<Article variant="overview-default" isServer={props.isServer} dataSource="props" data={props.data} language={props.language}>
  {props.children}
</Article>
```

Через границу сервера и клиента передавайте только объявленные параметры интерфейса. Произвольный spread может перенести SDK, Provider или конструктор компонента. Приведение TypeScript не делает функцию сериализуемой. Серверный callback нужно выполнить на сервере, а клиенту передать готовый React-узел.

## Разделите операцию и оформление

Доменный Widget отвечает за пользователя, формы, изменения данных и состояние операции. Website Builder Widget — за тексты, изображения, раскладку и слоты. Доменный Widget читает точную сохранённую связь с оформлением и передаёт в него готовое содержимое через renderer связи `default`.

Связь хранит идентификаторы, порядок и ссылки. Она не выбирает экран бизнеса и не создаёт форму оплаты. Нижележащий модуль принимает готовый JSX в слот, когда не может импортировать владельца операции по порядку зависимостей.

## Проверьте страницу целиком

Используйте статью с обложкой, локализованным текстом и упорядоченными связями Widget. Проверьте конкретные записи, загрузку и ошибки, затем откройте собранный Host. Сессия браузера и кешируемая публичная страница могут требовать разных путей чтения.

Именованные значения URL выбираются в callback конечной Host Page. Передайте Blog конкретный slug статьи; полная карта маршрута остаётся в этом callback.

## Исходный код

- [.agents/contracts/engineering/frontend-components.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/.agents/contracts/engineering/frontend-components.md)
- [libs/modules/blog/models/article/frontend/component/src/lib/singlepage/default/index.tsx](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/frontend/component/src/lib/singlepage/default/index.tsx)
- [libs/modules/blog/models/article/frontend/component/src/lib/singlepage/overview-default/Component.tsx](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/frontend/component/src/lib/singlepage/overview-default/Component.tsx)
- [libs/modules/blog/relations/articles-to-website-builder-module-widgets/frontend/component/src/lib/singlepage/default/Component.tsx](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/relations/articles-to-website-builder-module-widgets/frontend/component/src/lib/singlepage/default/Component.tsx)
- [.agents/contracts/engineering/module-dependencies.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/.agents/contracts/engineering/module-dependencies.md)
