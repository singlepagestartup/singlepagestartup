# Framework journey: runtime и локальная приёмка

Дата: 2026-10-24. Ветка: `codex/issue-376-framework-visual`.
Область: перенос Product → Studio Modules → production-компоненты и сохранённую
локальную композицию. Финальный Code Review принадлежит пользователю.

Исходники и CMS-входы прошли независимое `review-pr` без открытых замечаний
в проверенной области. Реальные публичные страницы проверены в dev Host.
Полная production-сборка и браузерный проход документа в авторизованном AI Chat
остаются непроверенными; подробности ниже. Этот отчёт не объявляет их PASS.

## Реализация

`/en/framework` объясняет подготовку бизнеса в AI Chat, проверку и экспорт
документов и дальнейшую разработку с кодирующим агентом. Framework остаётся
бесплатным по MIT. Автоматическая публикация сайта описана как будущая услуга.
Сохранены галерея, восемь продуктовых примеров, валюты, корзина, quick checkout,
CRM-форма и категории ниже маркетинговых разделов.

Обзор модулей и 15 справочных страниц используют сохранённые Page/Widget
instances и ссылки на конкретные README. Общие header/footer связывают
Framework, Modules, Blog, Tokens и AI Chat. Изображения загружены через
File Storage; три delivery-файла совпадают с источниками и API-ответами по SHA-256.
Их карта находится в `ISSUE-376-framework-journey-assets.json`.

Website Builder содержит шесть новых Feature-вариантов и девять Widget-вариантов.
Композиция читает точные собственные default relations через SDK. Уже загруженные
записи передаются в props mode. Host упорядочивает внешние связи по позиции и ID.
Сохранённые Features и JSX children выводятся вместе: пустой Host slot больше
не скрывает данные. Компактный заголовок сохраняет собственные CTA.

Blog показывает сохранённые категории, статьи, обложки, даты и Social-авторов.
В статье доступны оглавление, код, GitHub-ссылки, карточка автора и переходы
по журналу. Последние используют курсор Article ID; они не заявлены как
хронологическая сортировка. Public Article reader и RBAC private-content callback
сохранены. Для комментариев оставлен явный JSX slot: существующего persisted
Comments endpoint/association в runtime нет, демонстрационные данные не публикуются.

Публичный Tokens Widget принадлежит RBAC и соединяет одну точную presentation
композицию с шестью сохранёнными Products. Free содержит 3000 токенов один раз
при регистрации. Pro даёт 5000 в месяц за 29 USD или 1900 RUB. Пять пополнений
стоят 100/300/500/1000/3000 RUB по 0.13 RUB за внутренний токен. Применяются
существующие Subject Product controls и checkout. Два сервисных продукта
остаются отдельными примерами. Расчёт списаний, возвратов и admission gate не меняется.

В RBAC-владельце документа находится одна панель передачи в разработку.
Она использует тот же scoped saved content и filename, что существующий
Thread Markdown export. Copy переносит инструкции; тело документа и
неподтверждённое предложение в них не включаются. Смена документа, содержимого
или proposal/read identity сбрасывает feedback и результат старого clipboard promise.
Существующие editor, Save, proposal и export operations сохранены.

## Публикация сохранённых данных

Все записи изменены явным SDK data-management flow
`tools/runtime/platform-example-content.ts`; repository snapshots не менялись.
Входы привязаны к текущей localhost-установке. Для другой установки нужны её
точные IDs, исходный граф, media и новый before-манифест.

| Вход                                     | Targets | Новые записи | Переключения | Защищённые selections |
| ---------------------------------------- | ------: | -----------: | -----------: | --------------------: |
| `ISSUE-376-framework-journey-input.json` |     666 |          661 |            5 |                   295 |
| `ISSUE-376-framework-journal-input.json` |      25 |           20 |            5 |                   324 |

Первый apply создал 661 запись и изменил пять consumer-связей. Повтор пропустил
все 666 targets. Rollback восстановил пять consumers, сохранил additive records;
последующий prepare содержал пять операций, reapply восстановил новую композицию.
Итоговый fresh prepare содержит 0 операций и 295 protected selections.

Journal apply создал 20 записей и изменил пять consumers. Повтор создал и
изменил 0 записей, пропустив все 25 targets. Fresh prepare содержит 0 операций
и 324 protected selections. Четыре Page roots сохраняют исходные Blog Widgets;
пятый switch меняет только вариант заголовка Tokens. Его пустые media/Feature
collections, action group и обе CTA отдельно захвачены и защищены.

Protected readbacks проходят до записи, перед переключениями и после apply.
Они покрывают private graph, Article/category/media/authorship, CRM и commercial
данные. Четыре намеренно изменённые journal root-связи проверяются собственным
before-манифестом второго прохода. Старый снимок первого прохода не считается
неизменным после этих явных переключений.

Окно публикации использует одного активного writer. Флаг exclusive maintenance
является предусловием, а не DB lock/CAS: API/MCP остаются технически способны
записывать данные. Другие агенты работали read-only, формы/платежи не запускались,
локальный cron и активные CMS/billing/webhook writers не обнаружены. Защита
от drift оставалась включённой. Private before-манифесты сохранены отдельно
от versioned файлов с mode 0600; их байты проверены по SHA-256.

Текущие manifests находятся в `.git/sps-runtime/issue-376/`:
`framework-journey-reapply-2026-10-24.json` и
`framework-journal-before-v3-2026-10-24.json`. Исходный journey before сохранён
рядом как `framework-journey-before-2026-10-24.json`. Старые journal v1/v2 не применялись.
Итоговые zero manifests: `/tmp/sps-framework-journey-final-zero.json` и
`/tmp/sps-framework-journal-zero-v3.json`.

## Проверки кода

Проверки выполнялись последовательно с ограниченной памятью.

| Проверка                                         | Результат                                                   |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Studio presentation suite                        | 401 PASS, 29993 assertions, 43 файла                        |
| Studio scoped TypeScript                         | PASS                                                        |
| Runtime scoped TypeScript                        | PASS: 96 entry files и их transitive closure, heap 1536 MiB |
| Blog card/detail/Widget                          | 26 PASS, 4 suites                                           |
| Protected Blog service/SDK/reader/UI             | 39 PASS, 4 suites                                           |
| Whole-document handoff                           | 16 PASS                                                     |
| Saved Features вместе с opaque/visible Host slot | 16 PASS, 8 вариантов                                        |
| Publication utility                              | 6 PASS, 23 assertions                                       |
| Module dependency check                          | 15274 source files, 0 violations                            |
| Diff whitespace check                            | PASS                                                        |

Отдельные результаты не означают полный repository type/test PASS. Старые
API baseline diagnostics не входят в clean scoped runtime TypeScript result.
Во время Bun-проверок встречается directory-mismatch diagnostic; перечисленные
команды завершились с exit 0.

Независимое ревью закрыло следующие конкретные замечания:

- Неправильный hit area карточки: основная ссылка растянута на карточку,
  вторичные ссылки остаются самостоятельными.
- Потерянные author/navigation slots и неточный timestamp cursor: slots
  проходят до владельца, соседние статьи читаются по точному Article ID.
- Повторные gallery/action reads: загруженные записи передаются в props mode.
- Opaque Host child скрывал Features: saved content и child slot аддитивны;
  отдельная регрессия проверяет все восемь затронутых вариантов.
- Порядок новых Host children был не определён: запрос и render сортируют
  `orderIndex asc, id asc`, используются ID keys.
- Journal header создавал пустую media-колонку; компактный вариант зарегистрирован
  со Skeleton и сохраняет точные собственные action associations.

Итоговые рабочие source reviews находятся в `/tmp/sps-framework-runtime-*-review-b.md`
и `/tmp/sps-framework-journal-input-review-b.md`. Вывод выше сохраняет их
существенные findings и закрытия независимо от временных файлов.

## Реальный браузер и доступ

- Framework: новый hero и изображения, 22 saved Features, FAQ, Copy request,
  Slider с переходом на 2 of 3, три настоящие Article-карточки. Продукты,
  currencies/cart/quick-checkout controls, CRM inputs/select/Submit и категории
  присутствуют. Платёж и CRM submit в этом проходе не выполнялись.
- Modules: 15 карточек, нажатие в центре карточки открывает `/en/framework/modules/host`;
  страница содержит точную ссылку на Host README.
- Blog: один новый h1 перед Categories/Popular/Latest, три категории и текущие
  feeds. Backend содержит две статьи и подготовительный offer. Нажатие в центре
  Hono-карточки открывает Article; доступны реальный author card, code block,
  GitHub, TOC с переводом focus на H2, соседние статьи и offer с двумя CTA.
- Tokens: пять пакетов, default 500 RUB; выбор 1000 показывает 7692.307692 токена.
  Pro поддерживает RUB 1900/месяц. Компактный header сохраняет ссылки `/en`
  и `/en/framework`.
- На 320 CSS px Framework, Tokens и Article имеют scrollWidth=clientWidth=320;
  mobile menu работает, сломанных изображений нет. Viewport сброшен.
  В проверенных сценариях console errors отсутствуют.
- Guest private Article показывает публичное тело и subscription gate; private
  Widget ID отсутствует в DOM. Прямой GET этого Widget без cookies и operator
  headers возвращает 403, `Cache-Control: private, no-store`, без record.

Private fixture: Article `5ade2625-007e-4c90-86bd-989a33e534fa`, slug
`framework-private-content-audit`; защищённый Widget
`6580e777-393d-4255-94b9-58f3607ce465`. Его текущий outgoing closure захвачен
через SDK и не изменяется этим переносом. Paid/revocation поведение покрыто
профильными тестами и прежней integration matrix; новый paid browser login
в этом проходе не выполнялся.

Локальные screenshots: `/tmp/sps-framework-runtime-landing-final.png`,
`/tmp/sps-framework-runtime-journal.png`, `/tmp/sps-framework-runtime-tokens.png`,
`/tmp/sps-framework-runtime-landing-320.png`,
`/tmp/sps-framework-runtime-article-320.png`,
`/tmp/sps-framework-runtime-tokens-320.png`,
`/tmp/sps-framework-runtime-guest-gate.png`.

## Непроверенные части и состояние запуска

Production-проверка остаётся незавершённой. Выполнены следующие отдельные попытки:

| Режим                                                     |     Heap | Результат                                             |
| --------------------------------------------------------- | -------: | ----------------------------------------------------- |
| Webpack compile-only                                      | 1536 MiB | V8 heap OOM                                           |
| Turbopack compile-only, native target 1024 MiB            | 1536 MiB | RSS watchdog: 3364.2 MiB, 6.1 s                       |
| Полный Webpack build без compiler workers                 | 2304 MiB | Wall watchdog: 903.6 s, peak RSS 2879.3 MiB, exit -9  |
| Полный Webpack build с compiler workers                   | 2304 MiB | RSS watchdog: 3097.9 MiB, 750.0 s, exit 143           |
| Полный Webpack build с compiler workers                   | 2048 MiB | RSS watchdog: 3126.2 MiB, 514.4 s, exit 143           |
| Полный Webpack build, module parallelism 1                | 2048 MiB | Wall watchdog: 720.2 s, peak RSS 2537.5 MiB, exit 143 |
| Полный Webpack build, parallelism 1, wall limit 1800 s    | 2048 MiB | RSS watchdog: 3173.5 MiB, 770.3 s, exit 143           |
| Диагностический full build `--no-mangling`, parallelism 1 | 2048 MiB | RSS watchdog: 3086.3 MiB, 783.0 s, exit 143           |

В Host custom webpack отключал worker по умолчанию. Коммит `53ca2a4098`
явно включает `experimental.webpackBuildWorker`; независимый source review
проверил повторную загрузку Nx, SVGR и externals в Next 15.4.8 и ожидаемое
завершение каждого compiler worker. В обеих последующих попытках server compiler
завершился и был заменён новым процессом с освобождением памяти. Сохранённый trace
последней попытки содержит завершённый `webpack-compilation` для `server`
длительностью 216623722 µs. Общая сборка остановлена позже на стадии compile.
Это частичное доказательство, не client/typecheck/static-generation PASS.

Последние полные попытки используют `node node_modules/next/dist/bin/next build apps/host`,
отдельный dist, отключённый Webpack cache и один Next/Rayon/UV worker. Node запущен
с `--single-threaded-gc --no-concurrent-marking`, nice 15; duty cycle составляет
150 ms работы / 300 ms паузы. Предыдущая полная попытка без workers использовала
150/600 ms. Общий process-group RSS watchdog во всех этих проходах остаётся
3 GiB; меньший heap не устранил превышение. Сборки выполнялись последовательно
при остановленном dev Host. Первый диагностический проход дополнительно
задаёт `NEXT_WEBPACK_PARALLELISM=1` и сохраняет compiler labels и числовые PID/RSS
samples. Он завершён по 12-минутному wall limit, без наблюдаемого пересечения
RSS-порога. Server завершился за 565.817 s, Edge за 1.435 s; client работал
ещё не менее 144.021 s и не завершился до остановки. Общий production PASS
по-прежнему отсутствует.

Следующий full build на `7a117ea787` сохраняет эти CPU/RSS настройки и увеличивает
только wall limit до 1800 s. Server завершился за 542.230 s, Edge за 1.421 s.
Client compiler остановлен RSS watchdog через 770.3 s от старта: sampled peak
группы 3173.5 MiB, отдельного client PID — 3027.39 MiB. Это устанавливает фазу
наблюдаемого превышения, но не конкретную причину расхода памяти. Типы и static
generation не достигнуты; V8 fatal OOM в логе нет. Exit 143, cleanupError и
executionError — null; root подтвердил отсутствие PGID 77673. Receipts:
`/tmp/sps-framework-runtime-memory-extended-result.json` и `-analysis.json`.
Raw trace сохранён отдельно: 8947644 bytes, SHA-256
`52836603c51db863d21a91ebfd21ab0ee052b1482aef8245b31e17fe980aba3e`.

Последний диагностический full build на том же HEAD использует поддержанный
`--no-mangling`. По installed Next source этот флаг отключает mangling, сохраняя
JS compression, CSS minification, production/RSC transforms, type checking и
static generation. Next предназначает флаг для debugging; обычной release-проверкой
его считать нельзя. Временная config injection и правки приложения не требовались.

Server завершился за 549.017 s, Edge за 1.453 s; client снова не завершён.
RSS watchdog остановил группу при 3086.3 MiB через 783.0 s, exit 143. Types/SSG
не достигнуты, V8 fatal OOM нет, cleanupError/executionError — null. Группа
80530 отсутствует. Отключение mangling не позволило завершить сборку в том же
RSS-бюджете; это не доказывает причину предыдущего пика. Receipts:
`/tmp/sps-framework-runtime-no-mangling-result.json` и `-analysis.json`.
Raw trace: 8947563 bytes, SHA-256
`260ad79330e5c58654f42523c7d37ffe1b702e31f528c40f393979e109e71ba5`.
Дальнейших тяжёлых запусков на этом компьютере не планируется. Production gate
остаётся открытым; нужен успешный полный результат без ослабления проверок.

Логи: `/tmp/sps-framework-runtime-compile.log`,
`/tmp/sps-framework-runtime-turbo-compile.log`,
`/tmp/sps-framework-runtime-throttled-build.log`,
`/tmp/sps-framework-runtime-worker-build.log`,
`/tmp/sps-framework-runtime-worker-2048-build.log` и соответствующие result JSON.
Последний raw trace сохранён отдельно как
`/tmp/sps-framework-runtime-worker-2048-build-trace.jsonl`;
его summary — `/tmp/sps-framework-runtime-worker-2048-build-trace-summary.json`.

Raw trace не связывает второй PID или RSS-пик с конкретным compiler. Каждый
worker заново строит все три Webpack config, хотя сам запускает один compiler;
middleware bundle уже записан, а завершённых edge/client spans в trace нет.
Поэтому причина превышения памяти пока не установлена.

Source review установленного Next 15.4.8 выявило две дополнительные очереди:
Webpack по умолчанию обрабатывает до 100 модулей, а Next MinifyPlugin передаёт
assets в SWC через `p-limit(Infinity)`. `CIRCLE_NODE_TOTAL=2` задаёт Next `cpus=1`,
но не ограничивает эти очереди. SWC wrapper создаёт входные Buffers вне V8 heap.
Это возможные источники дополнительной памяти, не диагноз текущего RSS-пика.
Первый 720-секундный диагностический запуск использует process-only
`NEXT_WEBPACK_PARALLELISM=1`, compiler debug labels и числовые PID/heap/RSS
samples. Внешние samples связывают server с PID 70979, Edge с 72926 и client
с 72958. Наблюдаемый group peak — 2537.45 MiB; per-process peaks нельзя складывать,
поскольку они получены в разные моменты. Предыдущий RSS stop и текущий wall stop
не составляют контролируемое сравнение и не доказывают причину прежнего пика.

Probe не различает Node threads: одинаковый PID содержит samples разных isolates.
RSS относится ко всему процессу, heap-поля — к текущему thread; последнее малое
значение heap не является heap всего compiler. По этим samples нельзя вычислить
native memory как разность RSS и последнего heap. Это ограничение соответствует
[Node process.memoryUsage](https://nodejs.org/download/release/v25.4.0/docs/api/process.html#processmemoryusage).
Файлы: `/tmp/sps-framework-runtime-memory-diagnostic-result.json`,
`-processes.jsonl`, `-trace.jsonl`, а также
`/tmp/sps-framework-memory-diagnostic-analysis.json`. Watchdog cleanup завершился
без ошибки; root подтвердил отсутствие PGID 70972. Общий порог остаётся 3 GiB.

Source review не установило небезопасного импорта server implementation в
проверенные клиентские entrypoints. Обычный HTTP SDK с каталогом `server`
сам по себе не является таким импортом. Широкие публичные registries расширяют
compiler graph; это не доказательство причины нагрева или бесконечного запроса.
Историческое объяснение границ находится в
`ISSUE-376-rbac-client-boundary-review.md`; оно не подменяет текущий bundle review.
Перед релизом нужна успешная production-проверка в подходящем окружении.

Панель документа имеет source review и 16 passing runtime-component regressions.
Product/Modules copy и существующий Markdown download проверялись в браузере.
Цепочка из авторизованного runtime-документа целиком ещё не выполнена.
Исторический Blue Kiln/Products.md не доказывает текущего доступа.

Для неё подготовлен disposable runner на обычных owning SDK с точным журналом
human/Agent/project/document graph и hash/FK/CAS проверками. Независимое review
принимает топологию с одним новым UUID-hostname для browser Host 3007 и API/WS
4000, ранними Host/Origin guards, новым dist, blank analytics, проверкой ресурсов,
обычным logout и точной очисткой. Изменение только frontend origin при прежнем
API `localhost:4000` по-прежнему не изолирует API cookie jar.

Реальный первый preflight остановился до baseline/app/listen: в Subject обнаружена
единственная дополнительная `tokens_valid_after`, которой нет в текущей модели.
Read-only проверка всех 158 ресурсов не нашла других отличий формы. Временный
runner допускает только эту nullable `timestamp without time zone` без default,
generated/identity и constraints; остальные неизвестные колонки запрещены.
Whole-row hashes, actual UUID trigger coverage и FK/JSON проверки сохранены.
Происхождение колонки неизвестно; схема и данные не менялись. Независимое review
принимает точную коррекцию; harness SHA-256:
`e80379040b63e1c1c87595a78383877222cf2478fdd128621b6e0960046f9eba`.
Первое отклонённое состояние сохранено отдельно и не переиспользуется.

Следующий свежий запуск прошёл реальный read-only preflight: 54 required topics,
158 actual tables, их формы, primary keys и row/truncate capture triggers.
API слушал только 127.0.0.1:4000 с точными временными bindings. Host начал работу
на 127.0.0.1:3007, heap 1024 MiB, Turbopack target 768 MiB, один Rayon/UV worker,
nice 10 и process-group RSS watchdog 3 GiB. На первом cookie-free прогреве
`/en/ai-chat/sign-in` группа достигла 3169.6 MiB и была остановлена watchdog.
Прогрев не завершён; register, seed, resource inventory и браузер не запускались.
Подготовлены только private credentials: тестовых аккаунтов, Subject/Agent IDs,
данных документа и query refs нет. Пользовательские cookies/storage не читались
и не менялись. Native CUA всё ещё сообщает блокировку macOS; новая Safari Private
Window не создана.

Два отдельных fresh Webpack Host используют module parallelism 1, CIRCLE=2,
один Rayon/UV worker и тот же RSS watchdog. Heap 1536 MiB завершился V8 OOM
при peak 2018.6 MiB; heap 2048 MiB — V8 OOM при peak 2577.8 MiB. В обоих случаях
родительский Next CLI вернул 0, но обязательный прогрев не завершился. Это не
readiness и не auth PASS. Регистрация, seed, inventory и браузер также не запускались.
Санитизированные результаты: `/tmp/sps-framework-document-webpack-1536-receipt.json`
и `/tmp/sps-framework-document-webpack-2048-receipt.json`.

Временный API завершён через SIGUSR2 с дренированием запросов; его группа и группа
Host отсутствуют. Общий cleanup-командный путь отказал до удаления из-за отсутствия
final CAS audit: аккаунт, для которого он создаётся, не зарегистрирован. Это не
cleanup PASS. Отдельный read-only readback подтверждает полное равенство current
и baseline: 158 resource keys, все 9006 ID/whole-row hashes, 0 changed/missing/new
rows, 0 owned IDs, 0 query refs и отсутствие seed receipt. Cleanup targets
отсутствуют, SQL DELETE не выполнялся. Readback после каждого из двух Webpack
OOM также подтверждает все 9006 исходных строк без changed/missing/new rows и
нулевые аккаунты, Agent IDs и query refs. Дополнять CAS state или повторять DELETE
cleanup не потребовалось. Private state и receipts сохранены.
Санитизированный результат:
`/tmp/sps-framework-document-resource-stop-receipt.json`.

Авторизованный путь saved document → Copy instructions → existing Download
Markdown → Framework остаётся непроверенным. Нужны фактические совпадение
filename/двух прикреплённых Sources, исключение постороннего Source и body/proposal
из инструкций, обычный logout и точный cleanup после успешного прохода.

API работает через `npm run api:dev`; Host после обеих последних диагностик
возвращён к `npm run host:dev`, Storybook — на 4321. Host использует heap
1536 MiB, Turbopack target 1024 MiB, один Rayon/UV worker и nice 10. Тяжёлые
production-процессы остановлены. GitHub PR, push, merge, deploy и подтверждение
владельческих Strategy/Brand/Design не выполнялись.

Итоговый `/tmp/sps-framework-final-diagnostics-readiness.json` подтверждает
cookie-free HTTP 200 для API `/api/blog/articles`, Host `/en/framework` и
Storybook на 4321. Все 12 перечисленных закрытых process groups отсутствуют.
Только автоматически добавленные Next includes удалены из Host tsconfig;
остальной файл совпадает с HEAD. После browser reload реальный Framework
показывает один h1 «Turn your business brief into a product.»,
scrollWidth=clientWidth=1250 и 0 сломанных изображений. Два изображения в viewport
загружены; 12 изображений вне него ещё pending, их полную загрузку этот срез
не доказывает. Captured console и serialization/hydration errors после reload — 0.
Screenshot: `/tmp/sps-framework-runtime-final-diagnostics.png`. Вкладки Product
Storybook и Framework сохранены для просмотра.

Нужны успешная полная production-проверка и отдельная авторизованная сессия
для document journey. Native CUA снова сообщает блокировку macOS; приватное
окно недоступно. Три изолированных cold Host завершились до регистрации при
сохранённых ограничениях ресурсов. Оба ограничения сохраняются; ещё один тяжёлый
запуск без изменения окружения не запланирован.
