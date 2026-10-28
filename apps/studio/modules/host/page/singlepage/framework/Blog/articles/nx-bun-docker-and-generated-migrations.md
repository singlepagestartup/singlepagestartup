---
confirmation: { confirmed: false }
slug: "nx-bun-docker-and-generated-migrations"
createdAt: "2026-10-23"
category: "devops"
title: "Запуск SPS: Nx, Bun, Docker и миграции"
excerpt: "Как запустить локальные приложения и обновить схему базы через команды репозитория."
cover: "nx-bun-docker"
coverAlt: "Рабочий стол с ноутбуком и материалами проекта."
author: "Редакция SinglePageStartup"
authorRole: "Архитектура и разработка"
---

SPS — монорепозиторий Nx с API на Bun и Hono, Host на Next.js и модулями в `libs/modules`. API и Host запускаются отдельными командами. PostgreSQL и Redis работают через Docker Compose. Готовность одного процесса ещё не означает, что вся связка доступна.

## Подготовьте окружение

Проверьте версии Node.js и npm в `package.json`, наличие Bun и запущенного Docker. `npm install` устанавливает зависимости. Скрипт `./up.sh` подготавливает env-файлы, запускает инфраструктуру и применяет миграции API. Затем запускаются `npm run api:dev` и `npm run host:dev`.

Проверяйте доступность базы, Redis и API отдельно. Если Host открыл страницу, но данные не загружаются, сначала определите адрес и ответ API. Не подменяйте неработающий запрос статическим объектом в компоненте.

## Генерируйте миграцию у владельца схемы

Таблица модели принадлежит её пакету. После изменения схемы запускается соответствующий target `repository-generate`. Drizzle сравнивает объявленную схему с предыдущими снимками; [документация генератора](https://orm.drizzle.team/docs/drizzle-kit-generate) описывает этот процесс.

```sh
npm install
./up.sh
npm run api:dev
npm run host:dev
```

Это пример для Order. Выберите target той модели или связи, которую меняете. `api:db:generate` нужен при намеренном обновлении миграций всех модулей. Не пишите SQL, snapshots и журнал Drizzle вручную. Проверьте название поля, nullable, defaults и историю. Поле периода, которое устанавливает сервер, дополнительно требует правил записи на уровне приложения.

## Отделите схему от содержимого

Каталоги `backend/repository/database/src/lib/data` содержат снимки данных. Их правка не обновляет работающий CMS и не реализует исправление интерфейса. Статьи, категории, связи Widget и изображения изменяются через SDK владельца.

Перед переносом содержимого прочитайте текущие записи и входящие связи. Общая рамка hero может использоваться и контактной формой. Её изменение затронет обоих потребителей. Явное копирование и переключение нужной связи сохраняет владельца. Запишите возвращённые ID и прочитайте точные связи после операции.

## Проверяйте границы по очереди

Разделяйте готовность инфраструктуры, применённую схему, ответ API и рендеринг Host. Обёртка Host отключает экспериментальный web storage Node для дочернего процесса, чтобы определение браузерного SDK при серверном рендеринге соответствовало среде. Сохраняйте это поведение при сравнении dev и production start.

Созданная миграция — файл для проверки, применённая миграция — состояние базы. Видимое TypeScript-поле не доказывает наличие столбца в запущенной базе. Обновлённая база не доказывает, что API загрузил новую реализацию. Укажите проверенные процессы и маршрут, чтобы результат можно было повторить.

## Исходный код

- [AGENTS.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/AGENTS.md)
- [package.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/package.json)
- [up.sh](https://github.com/singlepagestartup/singlepagestartup/blob/main/up.sh)
- [apps/api/project.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/api/project.json)
- [apps/api/package.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/api/package.json)
- [tools/runtime/host.mjs](https://github.com/singlepagestartup/singlepagestartup/blob/main/tools/runtime/host.mjs)
- [apps/db/docker-compose.yaml](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/db/docker-compose.yaml)
- [apps/redis/docker-compose.yaml](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/redis/docker-compose.yaml)
- [libs/shared/backend/database/config/src/lib/postgres.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/backend/database/config/src/lib/postgres.ts)
