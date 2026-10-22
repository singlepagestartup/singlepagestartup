---
issue_number: 376
repository: singlepagestartup
branch: codex/issue-376-framework-visual
status: implementation_complete
---

# ISSUE-376: реализация и проверка

Runtime использует визуал Studio на сохранённых SDK-данных. Корзина, валюты,
количество, checkout, динамическая CRM-форма и связи Blog сохранены. Private
Article content проверяется по текущему Subject и действующей оплаченной
подписке до cache и выдачи любых зависимостей или байтов. Guest JWT имеет право
на собственную оплаченную подписку без обязательной Identity.

Финальная остановка — Code Review для пользователя. PR, push и merge не входят
в результат. Промежуточные review-pr выполнялись независимо от авторов.

## Изменения

| Область                | Результат                                                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Website Builder / Host | Общий контейнер, mobile navbar, footer groups, сохранённые hero/media/CTA; одна навигация Slider, keyboard/focus/touch и одиночные skeletons.                                             |
| Product / Category     | Все сохранённые media/attributes, раскрытие длинных атрибутов, currency/quantity, оба действия покупки в catalog/category/detail. Компактный drawer сохраняет поля и операции корзины.    |
| CRM                    | Функциональный RBAC Widget связывает точные CRM Widget/Form и независимый WB frame. Порядок Form→Step→Input→Option, validation, submissionId и отдельный результат уведомления сохранены. |
| Blog                   | Category/Article cards и detail, rich text/media, curated links, связанные товары, упорядоченные public/private slots.                                                                    |
| Subscription           | Четыре server-owned поля Order, неизменяемая Invoice.createdAt, атомарные period/Role/credit writes, ранний и поздний renewal, explicit revoke отдельно от expiry.                        |
| Resource access        | Все 13 видов WB edges, list/count до pagination, by-ID, File metadata и GET/HEAD/range bytes. Изоляция public/private графов и запрет unsafe sharing/declassification.                    |
| Client lifecycle       | Private body отсутствует в SSR/RSC. Request-start deadline, identity/error reset, отдельный query scope на subtree и освобождение Blob URLs.                                              |
| Data cutover           | Prepare/apply/verify/rollback через operator SDK, exact IDs и protected manifests, повтор без дубликатов. Rollback сохраняет privacy/requirements/periods.                                |

## Проверки

Числа в строках относятся к отдельным запускам; пересекающиеся suites не
суммируются в общий счётчик.

| Проверка                               | Подтверждённый результат                                                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Website Builder / shared find          | 9 + 2 focused tests PASS; независимый source review PASS.                                                                                                            |
| Commerce frontend                      | 11 tests PASS; expired history compatibility 9 PASS; cart/drawer/checkout 9 PASS после browser finding.                                                              |
| Blog / CRM / RBAC frontend             | 49 focused tests PASS.                                                                                                                                               |
| Shared frontend API                    | 56 tests / 8 suites PASS, standalone TypeScript PASS.                                                                                                                |
| Protected File                         | 12 tests PASS, включая native audio/video source replacement.                                                                                                        |
| Period / Invoice / revoke / proceed    | Независимый прогон 70 tests / 8 suites PASS, включая две реальные PostgreSQL suites.                                                                                 |
| Access / Role                          | Независимый финальный прогон 20 tests / 2 suites PASS; точная native Date граница и guest-paid case покрыты.                                                         |
| Real API access                        | 1 integration matrix PASS, 31.3 s: настоящие controllers/services/PostgreSQL, оба Redis-backed response caches, 13 WB edges и bytes.                                 |
| Real commerce                          | Actual Subject SDK→Hono→services/PostgreSQL: cart CRUD/foreign denial и dummy checkout PASS; независимый повтор 1/1 PASS, 12.7 s.                                    |
| Real CRM                               | Actual Subject service + PostgreSQL: шесть invalid cases, failed/sent/queued notification outcomes, replay одного Request PASS; независимый повтор 1/1 PASS, 12.6 s. |
| Cutover                                | Независимый Framework + engine прогон 36 tests, 154 assertions PASS.                                                                                                 |
| Studio                                 | Полный npm run studio:validate exit 0: TypeScript, 147 design-system tests, 380 presentation tests, 5 GitHub tests, 16 pipeline tests.                               |
| Module / placement / consistency reads | 14864 source files, 0 module violations; no same-name file/folder pairs; 9 SQL reads с adapters, 24 raw fetch и 1 explicit API-origin read через responsePipe.       |
| Schema consistency                     | Generated migrations применены; capture validation 155/155, lag 0, degraded false.                                                                                   |
| Host production                        | Frozen build .next-issue376-final exit 0, включая validity of types; собранный Host запущен на :3000.                                                                |
| Final HTTP                             | 16 ответов 200: EN/RU Framework/Blog/Category, Product, private Article HTML/RSC и публичный alias, без private marker/Widget ID.                                    |
| Targeted lint                          | 221 changed TypeScript files проанализированы ESLint с 8 GB heap; замечания пяти файлов исправлены, повтор этих пяти exit 0.                                         |
| API TypeScript                         | Exit 2: 20 baseline diagnostics, 20 current, new 0/absent 0; полные diagnostic blocks совпадают с изолированным HEAD archive. Это существующий failing check.        |

Real API matrix подтверждает настоящий HIT контрольного public response в обоих
cache режимах. Затем protected resources читаются как A, anonymous, signed-in B
и nonpaying guest. Protected families обходят cache lookup/write; результат A
намеренно не сохраняется в общем response cache. A использует guest JWT без
Identity. Проверены ordered content, exact expiry, Role delete/revoke, raw paths,
encoded/aliased IDs, GET/HEAD/range и доступ к собственному Subject. Отсутствие
private marker в built HTML/RSC проверено отдельно.

Commerce test сохраняет реальные Order/line/currency associations и количество,
перечитывает изменённые цены и создаёт настоящие dummy PaymentIntent/Invoice.
Cart quantity 4 / currency A даёт Invoice 500; quick checkout quantity 3 /
currency B даёт 675. Проверены exact metadata IDs/attributes и provider-generated
paymentUrl. Это синтетические fixture-значения, а не оценка демонстрационных цен.

CRM test проверяет реальное сохранение Request и Form-связи до уведомления.
Повтор одного submissionId не создаёт вторую запись или доставку; изменённые
значения отклоняются. Только transport уведомления подменён. Оба functional
harness откатывают fixtures и перечитывают их отсутствие. Внешние платежи,
письма, Telegram и app.ts schedulers не запускались этими тестами.

## Локальный перенос данных

Исходный manifest: 9 operations, 0 freezes; apply создал 6 записей и обновил 3,
verify подтвердил 9 operations / 1 private graph. Повтор apply пропустил все 9.
После rollback contact/Host связи вернулись к before, private classification и
subscription requirement сохранились. Fresh prepare дал 2 operations; reapply
переиспользовал additive records, создал 0 и обновил 2; verify подтвердил private
graph. Before manifests mode 0600 содержат protected snapshots, хранятся вне Git.

Локальные exact IDs:

- Host contact association: a5a0855a-08bd-482c-bc82-e2330ef351b7.
- CRM Widget: d947bcab-0873-40a5-8c91-66ec59c54c3b; Form: 744eb654-aac3-4aac-af93-f9fb5e290b23.
- Private Article: 5ade2625-007e-4c90-86bd-989a33e534fa; URL /en/framework/blog/articles/framework-private-content-audit.
- Subscription Product: e939ed88-22ba-4630-86e4-9743ad94338c. Type, Role, interval и currency/price связи прочитаны SDK.

Apply/rollback выполнялись в локальном exclusive CMS window. Browser не
отправлял CRM/checkout; integration writers работали в rollback transactions.
Generic full-record PATCH не обеспечивает CAS между GET и PATCH. CLI требует
--exclusive-maintenance; при параллельных CMS writers запуск недопустим.

Новая curated Blog relation читает GET /api/blog/widgets-to-categories. В локальной
конфигурации Permission отсутствовал; соседние count и widgets-to-articles
были roleless/public. Дополнительный missing GET categories-to-website-builder-module-widgets
выявлен на Category. Полный аудит 14 list/count reads семи Blog relations нашёл
только эти два пробела. Operator SDK создал отсутствующие GET, ids
4cea3bc3-1549-40da-8cf5-c166f2eec7b8 и c4ed950e-6d6d-48f6-bec8-1a172913ee6f;
оба anonymous reads теперь 200. Category links/write isolation не допускают
публичное переиспользование private graph.
Воспроизводимый rollout prerequisite с запретом ослабления существующей Role
policy находится в tools/runtime/README.md. Snapshots не менялись.

## Ограничения и существующее поведение

- Неизвестные URL используют существующий Next streaming not-found: HTTP 200
  после начала потока, noindex и NEXT_HTTP_ERROR_FALLBACK;404. Буквальный HTTP 404
  не подтверждён и не добавляется визуальным переносом. Catchall/layout/loading
  совпадают с исходной ревизией; browser not-found state проверяется отдельно.
- Browser использует собственную тестовую сессию: cart create/update/delete,
  currency/quantity/provider options и guest gate. Granted/expired/revoked bytes
  подтверждены реальной API matrix, клиентское закрытие — React/SDK tests.
  Активная платная browser session этим отчётом не заявляется.
- Native video/audio keyboard и Blob cleanup проверены focused tests; сохранённая
  runtime Gallery в browser содержит изображения.
- Studio validation сообщает 5 существующих pre-development gaps: 1 structural,
  4 approval. Они не превращены в одобрение и не относятся к реализации issue.
- API TypeScript остаётся с исходными 20 diagnostics, новых нет. Остальные
  упомянутые checks обозначены PASS только при соответствующем exit 0.

## Evidence

Durable review: thoughts/shared/research/singlepagestartup/ISSUE-376-reviews.md.
Browser report: thoughts/shared/research/singlepagestartup/ISSUE-376-browser.md.
Progress: thoughts/shared/handoffs/singlepagestartup/ISSUE-376-progress.md.
Локальные logs: /tmp/sps-376-real-api-integration.log,
/tmp/sps-376-commerce-integration.log, /tmp/sps-376-studio-validate-final.log,
/tmp/sps-376-host-final-build.log, /tmp/sps-376-final-host-check.json,
/tmp/sps-376-final-api-types-comparison.md. Browser evidence и итоговый reviewer
report сохраняются отдельно до финализации.

## Независимое принятие

Reviewer phase_reviewer применил review-pr к 6a9be42bb6 и дал PASS без
неустранённых замечаний. Его полный отчёт включён в ISSUE-376-reviews.md.
Browser report сохранён в ISSUE-376-browser.md; финальный runtime включает
cart fix, оба Blog permission prerequisites и frozen build.

Source commits: 84087145cf, 6d7e1f09c9, cb4296b6f0, 6a9be42bb6.
Все commit messages содержат проверенные downstream instructions. Финальный
человеческий Code Review остаётся пользователю.

GitHub Project status Code Review подтверждён shared helper 2026-10-22T23:58:52Z. Итог: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6353992295.
