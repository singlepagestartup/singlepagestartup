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

Текущая Webpack production compile завершилась V8 OOM при heap 1536 MiB.
Отдельная Turbopack compile с тем же heap, native target 1024 MiB и одним
потоком остановлена watchdog через 6.1 s: process-group RSS достиг 3364.2 MiB
при пороге 3 GiB. Ни одна попытка не даёт production PASS; режим compile также
не заменяет полный typecheck/static generation. Лимиты не повышались.
Логи: `/tmp/sps-framework-runtime-compile.log`,
`/tmp/sps-framework-runtime-turbo-compile.log` и соответствующий result JSON.

Source review не установило небезопасного импорта server implementation в
проверенные клиентские entrypoints. Обычный HTTP SDK с каталогом `server`
сам по себе не является таким импортом. Широкие публичные registries расширяют
compiler graph; это не доказательство причины нагрева или бесконечного запроса.
Историческое объяснение границ находится в
`ISSUE-376-rbac-client-boundary-review.md`; оно не подменяет текущий bundle review.
Перед релизом нужна успешная production-проверка в подходящем окружении.

Панель документа имеет source review и 16 passing runtime-component regressions.
Product/Modules copy и существующий Markdown download проверялись в браузере.
Цепочка из авторизованного runtime-документа целиком ещё не выполнена: текущая
сессия гостевая, старые test accounts удалены. Исторический Blue Kiln/Products.md
не доказывает текущего доступа. При готовой обычной сессии нужен read-only проход
saved document → Copy instructions → existing Download Markdown → Framework,
с проверкой одинакового filename и отсутствия body/proposal в инструкциях.

API и Host возвращены к `npm run api:dev` и `npm run host:dev`; Storybook остаётся
на 4321. Host использует heap 1536 MiB, Turbopack target 1024 MiB и ограниченные
worker pools. Тяжёлые production-процессы остановлены. GitHub PR, push, merge,
deploy и подтверждение владельческих Strategy/Brand/Design не выполнялись.
После возврата API `/api/blog/articles` и Host `/en/framework` вернули HTTP 200;
Framework повторно открыт в браузере, изображения загружены. Storybook Product
остаётся доступным в исходной вкладке. Временный include dev output в Host
tsconfig удалён из diff.
