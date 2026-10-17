---
repository: singlepagestartup
source_date: 2026-10-14
branch: codex/studio-host-models
revision: ced0f3713a89d09c5627a9cc1f502a55e17d754e
working_tree: includes-uncommitted-changes
status: verified-with-runtime-gap
order_confirmation: operator-confirmed
scope: production-module-import-direction
---

# Порядок модулей и удаление Telegram module

В рабочей копии удалён `libs/modules/telegram`: его модели, relations, SDK,
API, админка и Studio placeholders. `apps/telegram` и код бота в Agent сохранены.
Прямых импортов нижнего бизнес-модуля в верхний по согласованному порядку нет.

## Порядок сверху вниз

```text
agent
host
analytic
rbac
startup
social
crm
blog
ecommerce
billing
website-builder
knowledge
notification
file-storage
broadcast
```

Стрелка `A → B` означает «A использует B». Нижний модуль не импортирует верхний,
включая типы и UI-компоненты. Список отражает подтверждённую оператором структуру
и закреплён в общем контракте review, указанном ниже.

## Изменения

### Telegram

- Удалены бизнес-модуль и пустая Studio-проекция Telegram.
- Убраны module mount в `apps/api`, seed/dump, migration/generation targets,
  alias `@sps/telegram/*`, module choices генераторов и обе админские навигации.
- Удалены ссылки OpenAPI на page/widget/relation CRUD; `/telegram/run` и
  `/telegram/stop` сохранены как endpoints отдельного сервиса.
- `telegram:dev/start/build`, деплой сервиса, RBAC bootstrap Telegram,
  Notification delivery и Agent-команды сохранены.
- MCP registry обнаруживает модули по каталогам; удалённый модуль больше не
  участвует в discovery.

Независимый [Telegram app](../../../../apps/telegram/README.md) принимает updates,
публикует командный каталог Agent и защищает operator control routes.
[Agent](../../../../libs/modules/agent/README.md) интерпретирует команды и ведёт
assistant conversations. Исходники этих двух runtime-компонентов не менялись.
Старые таблицы `sps_tm_*` не удалялись из работающей БД; их код и Nx targets
больше не входят в приложение. Dump, seed и миграции в этой проверке не запускались.

### Social и Blog

Управление profile/article links находится в Social:

- [Legacy Profile](../../../../libs/modules/social/frontend/component/src/lib/admin/profile/Component.tsx#L25).
- [Admin-v2 Profile](../../../../libs/modules/social/frontend/component/src/lib/admin-v2/overview/profile/admin-v2-form/ClientComponent.tsx#L62).

Обе формы сохраняют relation filtering по текущему `profileId`. Admin-v2
позволяет открыть редактор связанной Blog Article. Обратные Social imports
и relation panels убраны из двух Blog composers; остальные связи и редактор
статьи сохранены. Social владеет связью авторства, Blog — содержимым статьи.

### Analytic

Analytic расположен ниже Host. Существующие Host readers и редактор Analytic
Widget соответствуют этому порядку и не требуют изменения исполнения.

## Проверки

| Проверка                                                 | Результат                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Повторный AST audit                                      | 15 132 TS/TSX/JS/JSX/MJS/CJS файлов; 1031 межмодульная ссылка production-кода; 0 импортов вверх |
| Разрешение aliases                                       | 0 неразрешённых `@sps/*` ссылок; 0 синтаксических ошибок                                        |
| `npm run test:unit:scoped`                               | 22 проекта, 259 suites, 1105 tests прошли; включает Agent, Social и Host                        |
| `jest --config apps/telegram/jest.config.ts --runInBand` | 5 suites, 45 tests прошли                                                                       |
| Bun build `apps/telegram/server.ts`                      | Успешен: 799 modules, 1.52 MB bundle в `/private/tmp`                                           |
| MCP registry suite                                       | Прошла                                                                                          |
| `npm run studio:validate`                                | Прошёл: 99 design-system и 339 presentation tests; pipeline сообщает 5 существующих gaps        |
| Host TypeScript                                          | Прошёл                                                                                          |
| API TypeScript                                           | Те же 22 diagnostics, что до удаления; новых нет                                                |
| OpenAPI references                                       | 788 локальных ссылок существуют; Telegram paths содержат только run/stop                        |
| Bash syntax, code-placement, git whitespace              | Прошли                                                                                          |

Проверка импортов использует TypeScript AST и resolver `tsconfig.base.json`.
В `libs/modules` разобрано 14 561 source file, из них 14 293 вне test/story,
fixture, migration и data категорий. Типовые импорты учитываются в проверке
направления. Производственный код не содержит вычисляемых dynamic imports;
три таких вызова находятся в shared PDF visual tests и загружают внешние npm
пакеты. `apps/*`, Studio prototypes и generator templates не считаются
бизнес-модулями в проверяемом графе.

Граф найденных межмодульных импортов соответствует линейному порядку и
ацикличен. Поиск всех внутренних циклов каждого модуля не выполнялся.

Первый Studio presentation прогон завершился таймаутом одного isolation test
при лимите 5 секунд. Отдельно прошли все восемь isolation tests, затем полный
`studio:validate` завершился успешно. Report-mode pre-development pipeline
сохраняет четыре approval gaps и одно несоответствие registry mascot assets;
эти результаты не являются подтверждением бизнес-документов.

## Runtime verification

Браузерная проверка обновлённой админки не завершена: после запуска локального
Host browser control возвращает CDP timeouts. TypeScript и тесты подтверждены
отдельно. Внешние Telegram webhook, bot commands и платежи в этой проверке
не вызывались; транспорт проверен unit tests и сборкой.

## Общие инструкции review

Общий [контракт зависимостей](../../../../.agents/contracts/engineering/module-dependencies.md)
содержит подтверждённый порядок пятнадцати модулей и запрет импортов вверх.
`AGENTS.md`, `CLAUDE.md` и общий workflow `review_pr.md` требуют читать его
при review PR и локальных diff. Правило охватывает backend, schema, SDK,
frontend, типы и reexports; приложения собирают модули вне этого порядка.
Codex skill и Claude command используют этот же общий workflow.

[План подключения](../../plans/singlepagestartup/2026-10-14-module-dependencies-contract-draft.md)
имеет статус applied. В design-to-implementation workflow отражено покрытие
пятнадцати модулей Studio. Отдельный CI gate для порядка импортов не добавлен.

## Основание исправлений

До удаления модуля и исправления Blog исходный список имел девять импортов
вверх в семи файлах: Host → Analytic (2), Telegram → Host (3), Blog → Social
(4, из них один стираемый импорт интерфейса). Telegram relation ошибочно
ссылалась на Host Widget и серверный Host SDK. Blog импортировал более высокий
Social для article-side управления профилями. Эти направления устранены
удалением ненужного модуля, передачей владения связью Social и уточнением
положения Analytic.
