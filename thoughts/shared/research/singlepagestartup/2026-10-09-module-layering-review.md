---
repository: singlepagestartup
date: 2026-10-09
revision: 3d153028fc38044af9104edbddb7565a5ec9cfe1
status: superseded
confirmation: historical-proposal
superseded_by: 2026-10-14-module-order-import-audit.md
scope: module dependencies and reusable code-review rules
---

# Порядок зависимостей SPS для код-ревью

Общие правила ревью находятся в
[review_pr.md](../../../../.agents/workflows/engineering/review_pr.md).
Текущий подтверждённый порядок и результаты исправлений находятся в
[аудите модульных импортов](2026-10-14-module-order-import-audit.md).
Ниже сохранён исторический разбор исходной группировки.

## Что проверено

Проверены корневые инструкции, README модулей, документы кэша и SDK,
backend bootstrap/service/repository, схемы relations и frontend-композиция.
Синтаксический разбор импортов и реэкспортов охватил 14 782 файла `.ts`/`.tsx`
в `libs/modules`, `libs/shared`, `libs/providers` и `libs/middlewares`.
Тесты, stories, миграции и каталоги data исключены из этого разбора.

Для определения порядка использованы подтверждённые ссылки на таблицы и
вызовы backend, отдельно от frontend-композиции. Явные type-only imports
отделены от остальных. Обычный TypeScript import также может использоваться
только как тип, поэтому сам по себе не доказывает runtime-зависимость.
Разбор не заменяет проверку разрешения всех aliases, выполнения кода и
циклов на уровне конкретных файлов. Обнаруженные импорты описывают текущее
состояние; они не означают, что каждое направление разрешено архитектурой.

## Предлагаемый порядок доменных зависимостей

Стрелка `A → B` означает: A использует B. Нижний уровень не получает бизнес-логику
своего потребителя. Модули внутри одной группы могут быть независимыми.

| Снизу вверх            | Модули/компоненты                                                  | Основание и предполагаемая граница                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0                      | `libs/shared`, инфраструктурные `libs/providers`                   | Общие типы, CRUD, SDK factories, утилиты и адаптеры DB/KV/Files. Интеграционные global middleware собираются выше, в API host.                                                    |
| 1                      | `file-storage`, `billing`, `notification`, `broadcast`, `analytic` | В проанализированных импортируемых реализациях этих модулей нет обращений к другим бизнес-модулям. Они предоставляют файлы, платежи, уведомления, сообщения broadcast и метрики.  |
| 2                      | `website-builder`, `knowledge`                                     | Оба используют Files через собственные relations. Knowledge отвечает за содержание и анализ материалов; File Storage — за хранение байтов и записи Files.                         |
| 3                      | `ecommerce`, `crm`                                                 | Ecommerce связывает свои модели с Billing, Files и Website Builder. CRM использует Files, Website Builder и Notification.                                                         |
| 4                      | `blog`                                                             | Статьи связываются с Ecommerce, Files и Website Builder.                                                                                                                          |
| 5                      | `social`                                                           | Профили, сообщения, потоки и навыки связываются с Blog, Ecommerce, Knowledge, Files и Website Builder.                                                                            |
| 6                      | Доменные операции `rbac.subject`                                   | Проверяют доступ пользователя и оркестрируют Social, Ecommerce, CRM, Knowledge и другие нижние возможности. Глобальный resolver permissions сохраняет свою узкую ответственность. |
| 7                      | Оркестрация `agent`                                                | Автоматизации и команды используют RBAC subject API и сервисы/модели других модулей; bootstrap также подключает модели Host.                                                      |
| Композиция интерфейса  | Frontend `host`, страницы/виджеты `telegram`                       | Собирают публичные компоненты разных модулей. Их UI-импорты рассматриваются отдельно от порядка доменных мутаций.                                                                 |
| Подключение приложения | `apps/api`, `apps/host`, `apps/mcp`, `apps/telegram`               | API host монтирует модули и global middleware; остальные приложения подключают интерфейсы и транспорт.                                                                            |

Эта таблица — предложение для доменной логики и владения данными. Она не задаёт
единый числовой порядок для каждого файла модуля. Например, независимые
`host.page/layout/metadata` используются другими моделями, а frontend Host
собирает виджеты RBAC, Social, Ecommerce и других модулей.

`libs/modules/startup` сейчас содержит проектные виджеты без межмодульных
relations. Его потребляют frontend-композиции Host и Telegram. Его положение
нужно определять по конкретному проектному расширению. Слой `startup` внутри
пакетов — отдельная ось наследования, а не этот модуль.

### Примеры, на которых основан порядок

- `website-builder → file-storage`:
  [widgets-to-file-storage-module-files/schema.ts](../../../../libs/modules/website-builder/relations/widgets-to-file-storage-module-files/backend/repository/database/src/lib/schema.ts), импорт File и foreign key.
- `knowledge → file-storage`:
  [sources-to-file-storage-module-files/schema.ts](../../../../libs/modules/knowledge/relations/sources-to-file-storage-module-files/backend/repository/database/src/lib/schema.ts), импорт File и каскадная relation;
  [Knowledge README](../../../../libs/modules/knowledge/README.md), ответственность за реконструкцию Source.
- `ecommerce → billing / website-builder / file-storage`:
  [Ecommerce README](../../../../libs/modules/ecommerce/README.md), список relations и граница `rbac > ecommerce`.
- `crm → notification`:
  [Form bootstrap](../../../../libs/modules/crm/models/form/backend/app/api/src/lib/bootstrap.ts), подключение Notification через DI; остальные relations перечислены в
  [CRM README](../../../../libs/modules/crm/README.md).
- `blog → ecommerce`:
  [articles-to-ecommerce-module-products/schema.ts](../../../../libs/modules/blog/relations/articles-to-ecommerce-module-products/backend/repository/database/src/lib/schema.ts).
- `social → blog / knowledge`:
  [profiles-to-blog-module-articles/schema.ts](../../../../libs/modules/social/relations/profiles-to-blog-module-articles/backend/repository/database/src/lib/schema.ts) и
  [skills-to-knowledge-module-sources/schema.ts](../../../../libs/modules/social/relations/skills-to-knowledge-module-sources/backend/repository/database/src/lib/schema.ts).
- `rbac.subject → доменные сервисы`:
  [Subject bootstrap](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/bootstrap.ts), DI-внедрение сервисов/репозиториев;
  [RBAC README](../../../../libs/modules/rbac/README.md), граница resolver и ресурсных проверок.
- `agent → rbac / social / host`:
  [Agent bootstrap](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts) и
  [Agent README](../../../../libs/modules/agent/README.md), владение Telegram-командами и вызовы через subject SDK.
- `telegram → host` на уровне схемы внешних виджетов:
  [widgets-to-external-widgets/schema.ts](https://github.com/singlepagestartup/singlepagestartup/blob/ced0f3713a89d09c5627a9cc1f502a55e17d754e/libs/modules/telegram/relations/widgets-to-external-widgets/backend/repository/database/src/lib/schema.ts).

## Что требует отдельного решения

Админская форма Blog уже подключает Social relation:
[blog/admin/article/Component.tsx](../../../../libs/modules/blog/frontend/component/src/lib/admin/article/Component.tsx), строка 3.
Social relation в своей схеме ссылается на Blog Article. На укрупнённом графе
модулей это даёт направления `Blog ↔ Social`, относящиеся к разным видам кода.
Это ещё не доказывает runtime-цикл конкретных файлов. Нужно подтвердить,
допустима ли такая обратная UI-композиция в админском варианте или её владелец
должен находиться выше обоих модулей.

Global middleware обращаются к RBAC, Broadcast и Agent через SDK. Например,
[is-authorized](../../../../libs/middlewares/src/lib/is-authorized/index.ts) использует Subject SDK,
а [actions-logger](../../../../libs/middlewares/src/lib/actions-logger/index.ts) — Action и Agent SDK.
Их нельзя считать общими нижними утилитами только из-за расположения в `libs`.
Для них нужно проверять интеграционный поток, повторный вход через API и
действующие route exclusions.

Внутренняя DI-композиция описана как допустимый путь в
[Broadcast README](../../../../libs/modules/broadcast/README.md) и
[RBAC README](../../../../libs/modules/rbac/README.md).
При межмодульных мутациях сохраняется отдельное требование проверить кэш,
авторизацию и границы транзакции. Риск из [issue #372](https://github.com/singlepagestartup/singlepagestartup/issues/372)
касается именно неполной инвалидации внешнего маршрута.

## Документы, использованные для правил ревью

| Источник                                                                            | Что применено                                                                                                        |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`, `CLAUDE.md`, корневой README                                           | SDK, relations, backend layers, размещение middleware, Drizzle generation, BDD и scoped-проверки, frontend checklist |
| README изменяемого модуля и модели/relation                                         | Владение данными, направление зависимости, допустимая DI-композиция, каскады и доменные ограничения                  |
| `libs/middlewares/src/lib/http-cache/README.md`                                     | Identity-blind ключи, `Cache-Control: no-store`, exclusions, поколения/TTL и fallback при сбое KV                    |
| `libs/middlewares/src/lib/revalidation/README.md`                                   | Общий resolver topics, bump-before-broadcast, уведомления только с метаданными и проверка второго клиента            |
| `libs/shared/frontend/client/api/README.md`                                         | `meta.topics`, подписки, внутренние callbacks, patching списков/деталей/count и WS reconciliation                    |
| `.agents/contracts/engineering/code-placement.md`                                   | Файл рядом с сущностями того же вида, существующие каталоги, отсутствие file/folder с одним именем                   |
| `.agents/contracts/engineering/knowledge-first.md`                                  | Повторное использование ранее исследованного с проверкой утверждений по текущему коду                                |
| `.agents/contracts/inheritance.md`, `.agents/workflows/design-to-implementation.md` | Владение singlepage/startup, граница Studio-прототипов и production, данные production через SDK                     |

Cursor backend rules содержат пример порядка middleware, который недостаточен
для текущего требования bump-before-broadcast. Revalidation README также
содержит исторический раздел о cart route fallback, тогда как Client API README
описывает обязательные topics для ручных queries. Ревью проверяет фактические
регистрацию и options, отмечая конфликт документации. Эти фрагменты не
перенесены как самостоятельные новые правила.

## Состояние правил

Навык `review-pr` и общая инструкция включают проверки API-кэша, инвалидации
всех изменённых моделей, подписок, авторизации, транзакций и формат замечания
с условиями, последствиями и известной либо неизвестной частотой.
Разработчик выбирает исправление или обоснованное исключение.
Предлагаемая группировка модулей и решение по обратной UI-композиции ждут
подтверждения; проверка подтверждённых границ уже применима.

## Точечная проверка текущей ветки

```yaml
verification_date: 2026-10-14
verification_branch: codex/studio-host-models
verification_revision: ced0f3713a89d09c5627a9cc1f502a55e17d754e
verification_scope: documented-boundaries-and-eslint
```

Связи `website-builder → file-storage`, `blog → ecommerce` и
`social → knowledge` присутствуют в приведённых выше схемах relations.
CRM Form bootstrap внедряет Notification repositories; Agent bootstrap
подключает Social, RBAC и Host. README Ecommerce сохраняет запрет обратной
зависимости от RBAC subject, а README Knowledge разделяет анализ Source и
хранение Files. Админская форма Blog по-прежнему импортирует Social relation,
чья схема ссылается на Blog Article. Полный граф импортов в этой проверке не
пересобирался; отсутствие runtime-циклов не установлено.

Предлагаемые уровни не закодированы в действующем ESLint-конфиге.
В [eslint.config.mjs](../../../../eslint.config.mjs) правило
`@nx/enforce-module-boundaries` находится в блоке `**/*.js` / `**/*.jsx`,
а TypeScript-блок его не включает. `depConstraints` использует
`sourceTag: "*"` и `onlyDependOnLibsWithTags: ["*"]`; направления между
уровнями этим условием не ограничены. Проверенные `project.json` модулей
Agent, Blog, Ecommerce, File Storage, Host, Knowledge, RBAC и Social имеют
пустой массив `tags`.

Статус таблицы остаётся `proposal`, подтверждение — `pending`.
Для обязательной автоматической проверки нужны утверждённые границы и
правила, различающие доменную реализацию, схемы, типы и UI-композицию.
Один уровень на весь модуль не выражает описанные здесь роли RBAC и Host.

## Проверка линейного списка оператора

[Полный аудит импортов](2026-10-14-module-order-import-audit.md) сравнивает
текущую рабочую копию с явно предложенным порядком шестнадцати модулей.
Он устанавливает девять импортов вверх в семи файлах: `host → analytic`,
`telegram → host`, `blog → social`.

Приведённый выше пример `telegram → host` не следует считать основанием для
разрешённой архитектурной зависимости. README relation и форма связывают
Telegram Widget, тогда как schema и миграция используют Host Widget;
серверные readers двух Telegram admin tables также используют Host SDK.
Этот конфликт владельца данных описан в полном аудите.
