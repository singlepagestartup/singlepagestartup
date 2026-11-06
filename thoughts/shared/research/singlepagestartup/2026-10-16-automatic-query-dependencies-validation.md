---
date: 2026-10-16
branch: codex/studio-host-models
base: 9bc26719ff85a14de91813407f2198fdd42043ed
status: implemented_with_validation_limits
plan: thoughts/shared/plans/singlepagestartup/2026-10-16-automatic-query-dependencies.md
---

# Проверка автоматических зависимостей запросов

Автоматические зависимости, transactional outbox, адресная инвалидация, восстановление подписок и сохранение состояния чата реализованы. Рабочий режим по умолчанию — `compatibility`: новый SDK использует приватные refs, старые клиенты сохраняют legacy bridge. HTTP response cache включается отдельной настройкой. Ручная приёмка PR остаётся открытой; численный бюджет полного no-store расчёта не выполнен.

## Реализация

- Каталог из effective Table/schema и SDK Configuration содержит 155 физических ресурсов. Дополнительной карты бизнес-связей нет. UUID equality/inArray дают точные области, остальные предикаты используют коллекции. Descriptor ограничен 256 ключами; collection snapshots сохраняются до укрупнения.
- PostgreSQL row/statement triggers меняют поколения и записывают outbox в транзакции исходной записи. Захвачены direct SQL, FK cascade и TRUNCATE. Генерация и проверка покрытия включены в существующие targets. Изменение capture-контракта создаёт generated migration с reset поколений и новой epoch.
- Общий repository и tracked SQL adapter записывают фактические чтения до SQL, включая пустые результаты и count. Transaction bindings локальны операции. Вложенные memory cache и доверенный self-HTTP передают зависимости родительскому чтению.
- Приватный API cache разделяет URL/params, principal/credential и locale, проверяет авторизацию и поколения до hit. Immutable version vectors защищают от позднего stale SET. Браузерные и приватные Next reads имеют `cache: no-store`; это не выключает серверный API cache. Явный HTTP `Cache-Control: no-store` выключает его.
- Dispatcher использует transactional advisory lock, фиксирует delivery cursor после Next invalidation и доставляет события во все API-процессы. LISTEN ускоряет обработку; polling подхватывает пропуски. Журнал ограничен retention. Операторские status/reset и opt-in диагностика не открывают query refs или содержимое данных.
- SDK связывает query key с входными параметрами и auth partition. Lease, replay, baseline нового GET, focus/online/visibility, heartbeat и общий fallback согласуют данные. Root WS обрабатывает каждый frame непосредственно в callback, включая несколько кадров в одном React batch.
- Cart totals используют effective services и repeatable-read; Message и его связи создаются атомарно. Внешние загрузки и AI/provider calls остаются вне коротких транзакций. Knowledge/CRM publisher setters и глубокие импорты из API bootstrap удалены.
- Shared find сохраняет mounted UI при фоне и ошибке. Production/Studio используют один pure scroll hook с anchor, ResizeObserver и явным follow-latest. Периодический GET messages раз в пять секунд удалён. Строки используют memo, стабильные IDs и callbacks.
- Ответ scoped message-create содержит `authorProfileIds` и `attachments`, как timeline DTO. SDK вставляет только полный DTO; неполный ответ вызывает scoped reconciliation. Обычный участник больше не обращается к закрытому generic File relation после отправки.

## Автоматические проверки

Команды Jest выполнялись напрямую с owning config и `--runInBand`, чтобы исключить задержки Nx daemon. PostgreSQL integration использует отдельные UUID fixtures; maintenance reset проверяется в изолированной schema из generated migrations.

| Проверка                           | Результат                                                                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared backend API                 | 9 suites, 70 passed, 1 skipped                                                                                                                                        |
| Shared client API                  | 6 suites, 48 passed; burst/coalescing, replay, expiry, auth switch, 20 active queries                                                                                 |
| Shared client utils                | 7 suites, 26 passed; append/prepend/delete anchor, resize                                                                                                             |
| Shared utils                       | 15 suites, 86 passed; request cache boundary и legacy aggregate bridge                                                                                                |
| Middlewares                        | 86 passed                                                                                                                                                             |
| KV provider                        | 7 passed                                                                                                                                                              |
| RBAC, окончательный запуск         | 144 suites, 764 passed                                                                                                                                                |
| Host                               | 6 suites, 37 passed; повторный frame batching regression прошёл                                                                                                       |
| Knowledge unit / integration       | 91 unit; 2 integration suites, 20 passed                                                                                                                              |
| CRM integration                    | 2 suites, 5 passed                                                                                                                                                    |
| Ecommerce unit                     | 42 passed; generic total/quantity дополнительно проверены браузером                                                                                                   |
| Consistency PostgreSQL integration | Direct SQL, rollback, FK cascade, empty membership, late/early commit, два runtime, foreign ref, reconnect baseline, dedup/renew, maintenance rollback/reset — passed |
| Production Message rows            | 100 и 1 000 rows: одинаковый JSON refetch — 0 новых renders, edit — 1, append — 1                                                                                     |
| Shared find state                  | Draft, focus и selection сохраняются при fetching/error                                                                                                               |
| Capture coverage                   | 155/155; повторная генерация: `Capture unchanged: 155 resources`                                                                                                      |
| Module direction                   | 14 782 исходных файла, 0 нарушений                                                                                                                                    |
| Code placement                     | Same-name file/folder pairs отсутствуют                                                                                                                               |
| API Bun bundle                     | 6 004 modules, 13.14 MB, successful                                                                                                                                   |
| Host Webpack production            | Successful compile, type check и page generation; окончательный DTO build успешен                                                                                     |
| Storybook production               | Successful; RealtimeHistory открыт в браузере                                                                                                                         |
| API TypeScript                     | 20 существующих diagnostics; исходный HEAD — 22. Новые файлы не добавили diagnostics                                                                                  |

Исходный API type baseline получен compiler host, читающим tracked исходники из HEAD без замены рабочего дерева. Оставшиеся ошибки относятся к существующим Blob/Bun/third-party response types. Зелёная Host сборка не означает зелёный API type check.

## Браузер: dev

Webpack dev Host работал на `localhost:3000` с отдельным API. В двух Chrome-вкладках открыт один тестовый Thread. Отправка `DEV consistency message 01` обновила вторую вкладку без reload. Draft остался; scroll anchor offset изменился с −80.14648 до −79.77539 px: 0.37109 px после стабилизации layout. Кнопка New messages возвращает к концу.

В двух вкладках товара Add to cart создал отдельный тестовый Order: 125 T. Изменение quantity 1 → 2 обновило вторую вкладку до 250 T без reload.

Studio RealtimeHistory показывает 30 сообщений и добавление сообщения в нативную scroll pane. Story использует публичный pure subpath hook, без импорта production SDK barrel.

## Браузер: production build/start

Отдельные Chrome и in-app browser с разными Subjects открыли общий Thread; третий чат оставался несвязанным. Проверены создание, редактирование и удаление сообщений. Финальная обычная отправка с enriched DTO появилась у второго участника; его заполненный draft сохранился. В Notifications нет Permission error. Платные model keys тестового API отключены: ожидаемые сообщения об ошибке AI provider не являются проверкой генерации ответа моделью.

При остановленном тестовом API пользователь видел Reconnecting. Во время разрыва сообщение изменено прямым SQL в собственной fixture. После восстановления API новое тело появилось без reload; scroll anchor offset сохранился точно (−68.876953125 px), draft остался. Несвязанный чат не получил сообщений и сохранил свой draft.

Удаление собственного сообщения вызвало один reconciliation GET общего timeline; у несвязанного timeline — ноль. В спокойной видимой вкладке периодических GET messages не наблюдалось. Счётчики URL включались только через `SPS_CONSISTENCY_DIAGNOSTICS=true`; в них сохраняются SHA256, без raw URL, JWT и тел сообщений.

Удаление только тестовой membership немедленно убрало timeline у участника и показало unavailable. Восстановление этой relation вернуло чат без reload. Пользовательские grants и личные профили не удалялись.

Production-корзина второго пользователя: новый Order, 125 T → quantity 2 → 250 T во второй вкладке. Checkout и внешняя оплата не выполнялись.

Скриншоты локального запуска находятся в `.artifacts/consistency/`: `dev-chat.jpg`, `dev-cart.jpg`, `studio-history.jpg`, `production-offline.jpg`, `production-recovered.jpg`, `production-message-dto.jpg`, `production-cart.jpg`. Эта папка gitignored; скриншоты не являются долговечными CI-артефактами.

## Задержки и ограничения измерений

Два отдельных API-процесса и два реальных WS-клиента получили 20 последовательных direct SQL commits. В спокойном локальном запуске p50 = 69.90 ms, p95 = 91.08 ms, max = 106.41 ms; response metadata = 359 bytes. Проверка измеряет commit → WS invalidation, а не полный React paint. При одновременной работе capture migration и других проверок один ранний запуск завершился timeout, повтор дал p95 около 4.3 s и max около 7 s. Бюджет 2 s подтверждён только для здорового спокойного запуска; degraded recovery проверяется отдельно.

Фиксированный Order total benchmark: одна БД и fixture, по 40 чередующихся последовательных запросов каждого режима, одинаковое тело ответа:

| Режим                   | p50, ms | p95, ms | Cache hits |
| ----------------------- | ------: | ------: | ---------: |
| HEAD baseline, no-store |   5.815 |   7.698 |       0/40 |
| Current, no-store       |  13.806 |  17.756 |       0/40 |
| Current, warm API cache |   2.627 |   4.113 |      40/40 |

Warm cache быстрее baseline на этом aggregate, metadata = 284 bytes, outbox lag = 0. Полный no-store расчёт примерно в 2.3 раза дороже; требование не более +20% для него **не выполнено**. Автоматически включать `enabled` на всех окружениях по этому отчёту нельзя. Нужна оптимизация/повторный замер uncached generation reads перед таким переключением. Измерение не доказывает нагрузочную ёмкость production.

Диагностика одного спокойного API: RSS около 572 MiB, heap used около 65 MiB, lag 0. Это снимок процесса, не memory growth test. Пооперационные SQL count, PostgreSQL lock-wait histogram, production React commit profiler и браузерная матрица всех Host slug/404/mask переходов не измерены полностью. Проверки rows в Jest не заменяют React production profiler.

## Сборка и рабочее окружение

На локальной машине с 16 GB RAM production build прошёл с `NODE_OPTIONS=--max-old-space-size=8192`, `SPS_HOST_WEBPACK_CACHE=false` и `webpackMemoryOptimizations`. Запуски с heap 4/6 GB закончились OOM. Dev Turbopack дал внутреннюю Rust panic; Webpack dev работает. In-app browser не исполнял крупные dev eval chunks; dev проверен Chrome, production проверен обоими браузерами.

После проверки собственные серверы 4005/4006/4007 и Storybook остановлены. API dev возвращён на 4000 с обычным `.env`, Host dev — на 3000 через Webpack. Пользовательские uploads и ISSUE-373 документы не изменены. Собственные fixtures удалены по manifest; API подтвердил отсутствие всех 10 записанных профилей/чатов/тредов/товара/атрибута/заказов. Инфраструктурные migrations, generations и journal остаются установленными.

## Условия дальнейшего переключения

- [x] Реализован механизм и публичные адаптеры без ручной карты связей.
- [x] Проверены два участника, изоляция несвязанного чата, reconnect, revoke и корзина в dev/build.
- [x] Legacy bridge и отдельный переключатель response cache сохранены.
- [ ] Выполнен бюджет no-store p95 ≤ baseline +20%.
- [ ] Получены полный production UI/SQL profiling и матрица всех кастомных Host views.
- [ ] Пройдено ручное code review и подтверждено переключение production-окружения.

## Стабильность навигации при ревалидации

Host Page `url-segment-value` и `find-by-url` сохраняют загруженное содержимое при background refetch. Skeleton относится к первоначальной загрузке. Вложенные project/account menus не размонтируются вместе с URL reader. Regression до исправления воспроизводил потерю меню и состояния для обычного ID и результата null; окончательный Host suite — 17 suites, 41 passed, TypeScript — passed.

На dev-маршруте проекта реальная ревалидация вызвана созданием и удалением собственной временной Host Page через SDK. Registry подтвердил новые URL responses; раскрытое account menu осталось открытым после обеих операций. Fixture удалена. Скриншот — `.artifacts/consistency/header-stable.jpg`. Production build именно этого изменения отдельно не повторялся.

## Настройки, покупки и доставка обновлений

Profile settings показывает успех через Sonner справа внизу, с зелёным статусом,
иконкой и закрытием. Inline alert остаётся для ошибок. Studio `Saved` воспроизводит
тот же вид уведомления и сообщает о сохранении только в preview.

Purchases использует существующий Subject-scoped список с
`includePurchaseDetails=true`. Проверка JWT и принадлежности Order предшествует
расчёту totals и чтению связанных receipt Files; весь ответ собирается в одном
consistency snapshot. Дочерний Ecommerce view получает `dataSource="props"` и
не вызывает generic total/receipt endpoints. Regression проверяет, что чужой
Order и чужой File не попадают в ответ, а total 0 сохраняется. В dev и production
обычный пользователь видит `0 ⭐️` и доступную квитанцию без Permission error.
Связанный продукт — Free Subscription; нулевая сумма не подменяет ошибку чтения.

Диагностика локального API выявила 151 ожидающее событие и зависшую очистку Next
тегов: первая пачка затрагивала 279 уникальных тегов. Вместо 279 параллельных GET
диспетчер отправляет 3 последовательных POST (128/128/23). Ошибка Next оставляет
batch неподтверждённым, но не останавливает heartbeat. После обработки pending=0,
lagMs=0. Проверки охватывают retry, legacy 405 fallback и heartbeat при сбое.

Индикатор установлен в корневом Host layout и относится ко всем страницам.
При открытом сокете и отставании он сообщает о задержке обновлений; при разрыве —
о переподключении. Он не сохраняет формы и не делает запросов к AI. Invalidate
frame без поля degraded не сбрасывает полученный heartbeat-статус.

Дополнительные проверки: RBAC 765, Ecommerce 43, Social 76, Host app 43,
Middleware 89, shared backend 71 passed / 1 skipped; Studio 188 passed.
Host и Studio TypeScript проходят. API сохраняет 20 прежних диагностик.
Bun bundle собирается с external native bcrypt/canvas/sharp. Окончательный Host
production Webpack build проходит вместе с проверкой типов. Браузерная проверка
сохранения/покупок пройдена в dev и production. Module direction: 14 785 файлов,
0 нарушений; placement и formatting проходят. Повторная диагностика после
нескольких dev-компиляций: pending=0, lagMs=0, lastError пустой; накопительный
счётчик dispatchFailures сохраняет 3 уже восстановленные попытки.

Studio разрешает только два точных pure chat-scroll subpath; transitive SDK
import и широкий shared barrel отклоняются. Общий контроллер соответствует
плану Studio/production, а Modules и Workspace сохраняют независимость.
Проверка Social истории сохраняет scroll position при входящем сообщении до
явного нажатия New messages.

Скриншоты: `.artifacts/consistency/profile-toast.jpg`,
`story-profile-saved.jpg`, `production-profile-toast.jpg`,
`production-purchases-scoped.jpg`. Пользовательские uploads не включаются в коммит.

## Общие уведомления и иконки

`Modules/Shared/Toast` содержит зарегистрированные `singlepage/default` и
`singlepage/icons` с эффективными `startup` registries и публичными интерфейсами.
В Default доступны обычное уведомление, Success, Error, Warning, Info, Loading,
Action, LongText, AllStates, Stacked и AutoDismiss. Controls меняют текст,
состояние, действие, длительность и положение; Persistent сохраняет превью
видимым. AllStates использует тот же renderer в сетке, чтобы не обрезать стопку.

Host root layout и Studio используют `@sps/ui-adapter/toast`. В
`libs/shared/ui/adapter/src/lib/toast/Component.tsx` находится оформление карточки
и контролов; `icons.tsx` выбирает Phosphor glyph для статуса. Локальные
richColors/position/closeButton из сохранения профиля удалены. Существующие
Sonner-вызовы SDK используют тот же store и общий смонтированный renderer.
Карточки светлые с рамкой и семантическими цветами темы; лаймовый относится к
иконке успеха, destructive — к ошибке. API, cache и данные моделей не меняются.

Toast Icons показывает bell, check-circle, x-circle, warning, info, spinner-gap и
x. Три недостающих SVG взяты из официальной MIT-коллекции Phosphor Regular;
лицензия находится и в runtime icons. Общая Studio-коллекция содержит 90 glyphs.
Отдельный UI subpath и транзитивная проверка не допускают SDK, app imports или
широкие barrels; разрешены React, Sonner и Tailwind Merge.

Проверки: Studio — 192 passed, Social — 27 suites / 76 passed, Studio TypeScript —
passed, module direction — 14 785 файлов / 0 нарушений, placement — passed.
В браузере пройдены действие через Enter, Loading → Success, закрытие,
автозакрытие и редактирование Controls. На фактической ширине 390 px
scrollWidth=390, границы длинной карточки — 16…374 px. В dev сохранение профиля
показывает общий Toast; отправленные поля не менялись.

Production Host Webpack build, включая проверку типов, и Storybook build проходят.
На отдельном production Host сохранение профиля показывает тот же белый Toast
с Phosphor-иконками; browser warning/error log пуст. В существующей Saved story
проверены один Toaster и одно уведомление. Поля профиля при проверке не менялись.
Скриншоты находятся в `.artifacts/toast/`: `dev-profile.jpg`,
`production-profile.jpg`, `catalog.jpg`, `mobile-long-text.jpg`, `icons.jpg`.
Storybook остаётся доступным на 4321; тестовый production Host после проверки
останавливается, пользовательские API/Host продолжают работать.
