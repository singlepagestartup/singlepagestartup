---
repository: singlepagestartup
branch: codex/studio-host-models
reviewed_head: ced0f3713a89d09c5627a9cc1f502a55e17d754e
comparison_base: ea69bb036ae9d0f60c5123ad0b72a7037297957c
includes_uncommitted: true
source_date: 2026-10-15
status: fixes-verified-with-gaps
execution: local
---

# Повторное code review ветки Studio и AI Chat

Проверка охватывает diff от общего предка с локальным `origin/main` до рабочей
копии, включая незакоммиченные исправления
[первого прохода](2026-10-14-branch-code-review.md). Основание — общий review
workflow, подтверждённый порядок модулей и обновлённый frontend contract.
Исправления находятся в рабочей копии; коммитов, remote writes и платных
AI-вызовов в этом проходе нет.

Область проверки: production variants, SDK, scoped backend APIs, Knowledge и
Thread metadata, shared cache/revalidation, Host, Studio и генераторы. Большие
перемещения Studio проверены через registries, manifests, тесты и build.
Снимки данных и схемы не редактировались для исправления поведения.

## Исправленные findings

### CR-11 — P2: сохранение второй секции теряло связь с первой

Источник:
`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat/ClientComponent.tsx:61`.

При двух сохранениях до обновления Thread props локальный render заменял
`documentRef` устаревшими `sourceIds`. Второй PATCH исключал первую секцию.
Ссылка синхронизируется при изменении входного документа; очередь attachment
сохраняет результат предыдущего PATCH. Regression воспроизводил потерю ID и
проверяет итоговый список из исходной и обеих новых секций. Частота неизвестна.

### CR-12 — P2: предложения документа теряли актуальный статус

Источник:
`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/document.ts:95`.

Поздний `reject` или `revise` возвращал отмену уже применённого предложения,
хотя Knowledge оставался сохранённым. Устаревшая генерация также могла вернуть
предложение того же ID из `rejected` в `pending`: CAS сравнивал свежую запись,
а не снимок исходного запроса.

Terminal statuses обрабатываются до новых действий. CAS сравнивает proposal
из исходного context. Перед записью Knowledge Thread атомарно сохраняет claim:
`pending` с `confirmationMessageId`. Пока исход записи неизвестен, reject и
revise возвращают `applying`. Повторный confirm проверяет сохранённые title,
notes и все staged Files, затем завершает статус Thread без повторной записи
текста. Conditional writes и уникальные relations защищают параллельные confirm.

Deferred regression воспроизвёл гонку confirm/reject до исправления. Tests
проверяют confirm/revise, повтор после ошибки, восстановление после Knowledge
commit с неуспешным Thread CAS, недостающий attachment, освобождение предложения для ревизии и конкурентные confirm.
PostgreSQL regression запускает шесть upserts одного document slug и получает
один Source. Общей транзакции Knowledge/Thread нет; восстановление использует
persisted claim и идемпотентные операции.

Удалённый staged File или изменённая версия Source переводят предложение в
`needs_revision`, когда исходная conditional write уже невозможна. Это снимает
блокировку следующей редакции. При первом Source текст и links могут быть
сохранены до ошибки attachment; ответ содержит `partialSave: true` и `sourceId`
и требует прочитать текущий Source.
Восстановление после первого Source также допускает новую редакцию, если
сохранённые title/notes изменились. Уже начатая обработка первоначальных Files
может завершиться; conflict не означает отмену сохранённой работы.
Неизвестная ошибка записи сохраняет claim.

### CR-13 — P2: сумма покупки оставалась устаревшей после изменения цены

Источники:
`libs/modules/ecommerce/models/order/sdk/client/src/lib/singlepage/total.ts:24`,
`libs/shared/utils/src/lib/topics/singlepage.ts`.

У aggregate query отсутствовал listener. HTTP-кеш независимо хранил результат
по буквальному topic `ecommerce.total`, который мутации цены не меняли.
Запрос подключает общий `subscription(...)`; SDK defaults и серверное правило
покрывают Order, количества, продукты, price attributes, их relations и валюты.

QueryObserver-тест проверяет refetch от удалённого store event и cleanup.
Девять Hono-сценариев прогревают HTTP-кеш, изменяют каждую зависимость и читают
новый результат. До исправления все девять возвращали прежнее значение.

### CR-14 — P2: мутации не обновляли фактические detail entries

Источник:
`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/update.ts:40`.

Profile, Identity и Source SDK обновляли `[route/id]`, а factory readers
использовали `[route/id, params]`. Учитываются все существующие detail entries
через `setQueriesData` по префиксу. Tests прогревают реальные factory keys и
проверяют изменение detail вместе со списками. Для Thread сохранены scoped и
global readers, а полный consumer `onSuccess` вызывается и ожидается после
внутреннего обновления кеша.

### CR-15 — P2: ручные SDK теряли caller metadata и часть subscriptions

Источники:
`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/queries-revalidation.spec.ts`,
`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/projects.ts`.

Profile, Identity, Avatar и Balance queries заменяли переданную metadata.
Authentication Me и прямое чтение project contexts не имели полного штатного
subscription path. SDK сохраняют default topics и caller metadata; явное
переопределение caller topics остаётся доступным. Projects имеет публичный
client SDK; прямой `useQuery` и server action удалены из visual.

Profile create обновляет count и пишет action. Email verification пишет
служебные actions без кодов и challenge. Tests проверяют metadata merging,
реальный общий listener, cleanup, count и порядок callbacks.

### CR-16 — P2: Profile update терял заголовок авторизации

Источник:
`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/update.ts`.

Object spread не сохранял заголовки из `Headers` и tuple arrays. Перед
добавлением внутренних headers SDK нормализует все поддерживаемые формы.
Три regression cases проверяют сохранение Authorization для object, tuple и
`Headers`.

### CR-17 — P2: Host смешивал URL и кешировал устаревшие lookup responses

Источники:
`libs/modules/host/models/page/sdk/client/src/lib/singlepage/index.ts:70`,
`libs/middlewares/src/lib/http-cache/routes/singlepage.ts:32`.

`findByUrl` использовал один QueryClient key для разных URL. Ключ содержит URL
и параметры; оба client lookup reader подписаны на `host.pages`.

HTTP-кеш отдельно держал lookup responses по буквальным RPC topics. Эти
операции разворачивают Page masks с данными произвольных модулей, поэтому
фиксированный Page-only topic не покрывает их зависимости. `find-by-url`,
`url-segment-value` и `urls` исключены из HTTP response cache.
Шесть Hono-проверок подтверждают свежий результат после изменений Page и
внешней коллекции; обычный model cache сохраняется.

### CR-18 — P2: raw Studio preview не загружал runtime и стили

Источник: `tools/studio/design-system/dev.ts:168`.

Default указывал на отсутствующий каталог. HTML на `/` и перенесённые ссылки
ломали относительные assets; исходный CSS содержал необработанные Tailwind
директивы. Preview выбирает существующий вариант, направляет на канонический
`index.html` и обрабатывает runtime CSS общим PostCSS plugin. HTTP regression
проверяет redirect, directory URLs, CSS utilities, runtime, script и image.

### CR-19 — frontend contract: загрузка и публичная регистрация вариантов

Источник-образец:
`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me-social-module-profile-id-chat-id-thread-id-ai-chat/index.tsx:11`.

В 13 RBAC variants дополнительные initial reads находились в интерактивных
views. 21 SDK hook перенесён в локальные `client.tsx`/`server.tsx`.
Shared Subject reader сохраняет Provider и получение Subject. Входы и
загруженные поля описаны в интерфейсах через SDK result types; интерактивные
состояния и стабильные keys остаются в `ClientComponent.tsx`.

Purchase использует тот же подход для дополнительного total read поверх
общего Order reader. Avatar имеет server-compatible `Component.tsx`, явные
client props и `isServer={false}` у вложенных client readers. Публичный Social
registry проходит воспроизводившийся Jest/SWC сценарий import initialization.
Named auth form имеет index, registry и props union; четыре существующих
auth wrappers сохраняют один Provider.

Проверены 39 изменённых RBAC variant interfaces и matching registration.
Публичные tests проходят через shared Parent и локальный reader; проверяют
загрузку и отсутствие SDK/Provider bindings в UI props. Error/retry,
partial-save и draft-lifetime сценарии сохранены.

Четыре новых server reader пропускали `apiProps.options` при дополнительном
чтении. Передача восстановлена; отдельные 13 cases проверяют сохранение
Authorization и Cache-Control во всех server paths.

Во вложенных model components сохраняются scoped `queryFn` из client
composers. Их выполняют штатные `default`/`find` readers, callbacks остаются
внутри client subtree. Initial data ограничивает повторную загрузку при
первом mount; при invalidation возможны повторные scoped collection reads.
Перенос 21 прямого hook не устраняет этот существующий контур.

### CR-20 — проверки пропускали Knowledge

Источник: `package.json`, `test:unit:scoped` и `test:integration:scoped`.

Оба списка проектов не включали `@sps/knowledge`, хотя ветка меняет его
repository и frontend. Модуль включён в обе команды. Unit охватывает все
15 бизнес-модулей и вспомогательные проекты; integration — все 15 и API.

## Проверки

| Проверка                                                           | Результат                                                                                                                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Финальный `test:unit:scoped -- --maxWorkers=2`                     | 23 проекта, 286 suites, 1254 tests; exit 0                                                                                                                                 |
| `test:integration:scoped -- --maxWorkers=1` с локальным PostgreSQL | 16 проектов; 24 suites, 71 tests; exit 0; ещё одна Social suite и 5 tests пропущены                                                                                        |
| Отдельные document/context PostgreSQL tests                        | 2 suites, 2 tests; exit 0                                                                                                                                                  |
| Telegram transport                                                 | 5 suites, 45 tests; exit 0                                                                                                                                                 |
| SDK regressions                                                    | 12 suites, 46 tests; входят в scoped unit                                                                                                                                  |
| HTTP-cache и middleware                                            | 10 suites, 86 tests; прогретые aggregate GET и privacy checks                                                                                                              |
| Shared Utils                                                       | 14 suites, 82 tests; topic rules, aliases и остальные utils                                                                                                                |
| OpenRouter и token estimator                                       | 19 + 1 tests; все внешние ответы подменены, платных вызовов нет                                                                                                            |
| RBAC frontend                                                      | 17 suites, 80 tests; auth registration и все server headers включены                                                                                                       |
| Остальные затронутые frontend flows                                | 11 suites, 39 tests                                                                                                                                                        |
| Studio design-system                                               | 95 tests; два rebuild сохраняют 429 keys в 63 registries                                                                                                                   |
| Studio и Storybook                                                 | TypeScript, manifests, publisher check и production build прошли                                                                                                           |
| Host TypeScript                                                    | Exit 0 после полной миграции readers и регистрации auth                                                                                                                    |
| Module import audit                                                | 15 132 source files, 14 601 внутри модулей; 1066 cross-module imports; ноль обратных прямых и транзитивных импортов через shared/providers, ноль неразрешённых SPS aliases |

Свежая вкладка браузера открыла существующий workspace с Brief.md editor,
настройки аккаунта и Purchases с реальной оплаченной строкой. Меню и навигация
работают; console errors отсутствуют. Данные пользователя, сообщения и
настройки аккаунта через браузер не изменялись.

## Оставшиеся границы проверки

- Общий API TypeScript возвращает 22 диагностики. Все строки, на которые они
  указывают, присутствуют в comparison base. Среди них старые File/Blob,
  payment-provider response types, Page и Telegram response types, Z-AI.
  Новые readers и изменённые SDK проверены отдельно; общий API check остаётся
  красным.
- Живой WebSocket transport с двумя клиентами и Redis не проверялся заново.
  Store → subscription → QueryObserver и HTTP-cache invalidation проверены
  отдельно; это не заменяет полный транспортный сценарий.
- Гонки document confirmation проверены управляемыми параллельными unit
  сценариями; уникальность первого Source дополнительно проверена на PostgreSQL.
  Неоднозначная связь первого Source с чужим slug требует проверки данных;
  автоматическое освобождение claim ограничено ожидаемым document slug.
  Падение отдельного процесса в точке между Knowledge commit и Thread CAS
  воспроизводится ошибкой записи, без остановки живого API-процесса.
- Полный `test:scenario` не запускался: существующие ISSUE-152/154 fixtures
  очищают cart/chats фиксированного Subject из `.env`, а ISSUE-158 вызывает
  реальный OpenRouter. В этом проходе использованы изолированные DB fixtures,
  component/SDK tests и Hono cache scenarios.
- Browser smoke не выполнял новые AI-запросы, загрузку/удаление пользовательских
  файлов, смену email/password, оплату или удаление аккаунта. Эти операции
  проверялись локальными fixtures и SDK/component tests в соответствующем scope.

Первый `Page.navigate` сообщил timeout, но та же вкладка открыла целевой URL;
последующая проверка AX state подтвердила загруженный workspace. Первый sandbox
запуск PostgreSQL tests завершился `AggregateError`; те же tests с разрешённым
локальным соединением прошли. Оба случая относятся к среде проверки.
