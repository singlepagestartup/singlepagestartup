---
issue_number: 376
repository: singlepagestartup
branch: codex/issue-376-framework-visual
reviewer: phase_reviewer
review_skill: review-pr
last_updated: 2026-10-23
status: subscription_period_passed
---

# Независимые проверки ISSUE-376

## Research

**Результат: PASS для перехода к планированию.** Замечаний, требующих доработки research, нет. Это проверка полноты исследования и его опорных утверждений; работающий перенос и исправление доступа ещё не проверены.

Область проверки: ticket `thoughts/shared/tickets/singlepagestartup/ISSUE-376.md`, исследование `thoughts/shared/research/singlepagestartup/ISSUE-376.md`, исходный аудит и карта Studio. Runtime проверен на `710ae5329d5b42b1577f4b3e3b175301b33916f2`; визуальная база — `652cabd9bf6cedbb578e26254c7bb887ace73bf8`. Проверка использует `.agents/workflows/engineering/review_pr.md` и frontend, module-dependencies, code-placement и cache contracts. GitHub status и публикация остаются у координатора.

Опорные утверждения подтверждаются кодом:

- RBAC Subject-композиции карточки и страницы товара сохраняют категорию, профиль, cart и checkout slots. Публичная Ecommerce presentation не владеет сессией. В категории сейчас есть cart, но нет быстрого checkout; research отделяет исходное поведение от требования ticket.
- CRM Request использует динамическую цепочку Form → Steps → Inputs/options, текущий Subject, `submissionId` и существующий SDK. Saved Request и доставка уведомления — разные результаты. Фиксированные поля Studio не предлагаются вместо runtime-схемы.
- Blog Article `overview-default` и закрытая композиция читают один relation-граф. Текущий приватный Subject-контрол проверяет маршрут связи целиком; generic Blog relation и WB Widget controllers не добавляют resource entitlement. Схема не содержит готовой семантики приватности или требуемой подписки.
- Публичные WB list/count/id охватывают связанные модели и relations. GET/HEAD `/public/*` зарегистрированы до общего authorization. Проверка только relation или скрытие JSX не защищают прямые записи и bytes.
- В `apps/api/app.ts` response cache расположен до module controllers. Consistency cache учитывает credentials, legacy cache требует исключений. В текущем subscription check срок вычисляется от изменяемого `Order.updatedAt`, а поздний invoice проверяется без paid status. Research не выдаёт существующие Roles за достаточное доказательство актуального права.
- Shared QueryBuilder принимает `filters.and` и отклоняет другие filter types; исследование не предполагает поддерживаемую OR-выборку. Попытка расширить запрос через OR остаётся отрицательным тестом.

Для плана остаются обязательными конкретные решения, уже обозначенные исследованием:

1. Сохранённая классификация публичного/закрытого содержимого, соответствие ресурса subscription Product, источник времени подтверждённого права, отзыв и истечение без ожидания jobs. Финальный план не должен оставлять их открытыми вопросами.
2. Защита relation/model list/count/id, дочерних записей и bytes при соблюдении порядка модулей, включая данные, одновременно связанные с публичным и закрытым блоками. Нужно описать проверку до ответа из кэша и отсутствие защищённого содержимого в HTML/RSC/props.
3. Повторяемый data-management flow с точными instances, сохранением ID/порядка, fork общего hero для CRM, readback и rollback. Локальные UUID не являются глобальной конфигурацией приложения.
4. Проверки реальных cart/checkout и полного CRM payload, EN/RU, всех runtime-разделов, model/Widget loading и матрицы доступа. Несуществующее в runtime `optionValues` нельзя переносить как рабочую серверную возможность.

Ограничения: анонимные HTTP probes и локальный DB graph взяты из исследования; reviewer проверил их механизмы по коду, но не повторял HTTP-запросы. Browser-сценарии, подписки, прогретые кэши, migrations и новый runtime пока не выполнены. Исторические 142 Studio tests относятся к подготовленному визуалу и не доказывают серверное исправление.

## Plan: первая проверка

**Результат: CHANGES REQUESTED.** В `thoughts/shared/plans/singlepagestartup/ISSUE-376.md` проверены все шесть фаз, правила доступа, scoped content API, cutover и матрица проверки. Runtime-код не менялся. Два опорных правила требуют уточнения перед реализацией.

### [P1] Отзыв Role должен сохраняться после обычного proceed

Место: plan, правило доступа 3, строка 70; Phase 1, строка 83. План считает удаление Role немедленным отзывом, но `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:336`–`:355` восстанавливает отсутствующие product Roles для `delivering` Order.

Триггер: удалить Subject→Role при ещё действующем периоде, затем выполнить штатный proceed. До proceed fresh-role проверка откажет; после автоматического восстановления тот же Order и Product снова дадут доступ без новой оплаты. Это установленный путь кода; частота зависит от запуска proceed и в review не измерялась.

Нужно определить устойчивый серверный отзыв: например, доверенная revoke operation переводит соответствующий owned Order в состояние, которое не выдаёт и не восстанавливает право. Если удаление Role остаётся независимым сигналом отзыва, delivering-ветвь должна отличать его от незавершённого provisioning. В проверку включить Role removal → реальный proceed → повторное чтение контента, а не только прямой вызов entitlement predicate.

### [P2] Comparator принятого invoice требует защищённого createdAt

Место: plan, правило доступа 3, строка 70. Выбор нового invoice опирается на «immutable createdAt», но `libs/modules/billing/models/invoice/backend/app/api/src/lib/service/singlepage/index.ts:5` — обычный CRUDService, а `libs/shared/backend/api/src/lib/repository/database/index.ts:282`–`:299` обновляет поля insertSchema, включая createdAt. Invoice schema не запрещает это поле.

Триггер: после принятия invoice B изменить createdAt ранее принятого paid invoice A на дату после B и повторить proceed. Сравнение с текущим anchor B сочтёт A новым и сможет повторно продлить период. Это установленная возможность generic write; доступность такого writer обычному пользователю не доказана. Риск касается корректности replay и доверенных admin/provider write paths, частота неизвестна.

Нужно явно закрепить неизменяемость существующего Invoice.createdAt в owning write operation либо выбрать эквивалентный неизменяемый comparator. Новый paidAt для этого не требуется. Проверка должна отвергать retimestamp старого invoice и подтверждать, что последующий proceed не продлевает период повторно.

Других замечаний к плану нет. При реализации отдельно проверить, что scope mutation guards сохраняют graph-инварианты в общей транзакции при конкурентных mark/link/unlink и покрывают прямые service/job entrypoints; один middleware preflight этого не доказывает. Scope, public/private ordering, API/cache-before-controller и byte guard, отсутствие body в denied placeholders, текущие payloads и точный CRM fork/cutover в плане определены.

## Plan: повторная проверка

**Результат: PASS для реализации.** Повторно прочитан полный план с исправлениями в Key discoveries, правиле доступа 4, Phase 1 и сквозной матрице. Замечания первой проверки закрыты на уровне плана:

- Для activated Order отсутствие свежего product Role остаётся отзывом после delivering proceed, повторного paid transition и автоматического renewal того же Order. Автоматический repair удаляется; initial grant разрешён только при первой активации новой явной покупки. Предусмотрен integration-сценарий через настоящий proceed, включая новый paid invoice отозванного Order и отдельную новую покупку.
- Invoice.createdAt получает серверное значение на create и защищён от изменения в owning Billing write operation. Совместимый provider update с прежним значением сохраняется. Tests включают A → B → попытку retimestamp A → proceed без повторного продления; новый Invoice paidAt не вводится.

План сохраняет полный interval для поздней подтверждённой оплаты, conditional atomic запись трёх Order period fields, одноразовый anchor и legacy freeze от прежнего Order.updatedAt без продления. Все research open questions имеют решения; production owners, data cutover, rollback и автоматические/браузерные критерии указаны.

Ограничение PASS: это проверка проекта изменений, а не выполненных миграций, API, payment/CRM сценариев, защищённых файлов или браузера. Реализация должна доказать эти свойства через заявленные проверки, включая конкуренцию graph mutations и реальные middleware/cache entrypoints. Финальный Code Review остаётся пользователю; reviewer не создавал PR и не менял GitHub status.

## Implementation: subscription period, первая проверка

**Результат: CHANGES REQUESTED; slice ещё дорабатывается.** Сравнение — рабочий diff против `d5add8923d56ea6fcbb6a89ea6994de8d053ac75`. Область ограничена Order schema/generated migration/repository/period service/check, Invoice repository, Subject proceed/freeze и их tests/docs; другие параллельные изменения не входят в эту проверку.

### [P1] Активация периода не должна терять незавершённый top-up

Место на проверенном diff: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:689`–`:696`, balance writes на `:779`–`:807`; `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/subscription-period/index.ts:76`.

Subscription period CAS переводит Order в delivering до начисления предусмотренных продуктом валют/токенов и referral bonus. Если последующий SDK balance write завершится ошибкой, внешний proceed её запишет, но следующий запуск попадёт в delivering-ветвь и не повторит эти операции. Подписка останется активной без обещанного начисления. Это установленный путь кода; частота зависит от ошибок API/DB и не измерялась. В исходном flow статус менялся после этих writes.

Коррекция: общий атомарный и повторяемый fulfillment охватывает fresh Order/Role reads, period claim и owning Role/balance writes; либо сохраняется явное долговечное состояние незавершённого выполнения. Self-HTTP SDK calls не участвуют в одной DB transaction. При замене на owning service calls нужно сохранить DB capture/outbox, cache и WebSocket reconciliation, lock order и post-commit notification semantics. Требуется failure → rollback → retry без потерянных или двойных начислений, включая реальную DB проверку полного набора writes. Владелец slice подтвердил риск и готовит транзакционную коррекцию.

Повторная проверка стабильного diff выявила связанную ошибку успешного выполнения: после активации реальный `collectTopupCurrencies` читает уже delivering текущий Order как существующий продукт и пропускает его top-up attributes. Поэтому одной транзакции недостаточно: нужно исключить текущий Order из этой проверки либо вычислять начисление до смены статуса внутри той же транзакции. Тест с подменённым collector этого не покрывает; требуется настоящий collector с настроенными product attributes.

### [P2] Устаревшая проверка срока может завершить уже продлённый Order

Место: `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:315`–`:329`; `libs/modules/ecommerce/models/order/backend/app/api/src/lib/repository.ts:49`–`:60`.

Expiry handler передаёт старую запись периода A в generic update со статусом delivered/canceling. Repository проверяет неизменность protected fields отдельным чтением и удаляет их из SQL patch, а затем обычный update меняет статус по ID без условного anchor. Если renewal B проходит между этой проверкой и SQL update, устаревший expiry завершает новый действующий период. Следующий proceed может удалить Roles и завершить оплаченный Order. Это установленный конкурентный путь кода; в первой проверке он не воспроизводился, частота неизвестна.

Коррекция: проверка срока и изменение статуса должны быть одной условной owning write operation с ожидаемым invoice/period/status и условием истечения либо использовать общий с renewal lock и свежий read. Generic update со старой записью не устанавливает такого условия. Нужен DB concurrency test: renewal B против устаревшего expiry A сохраняет B и доступ; действительное истечение без renewal завершает Order ровно на границе.

### [P1] Поздняя recurring оплата требует отличать обычное истечение от отзыва

Место: `proceed.ts`, выбор lifecycle statuses и delivered cleanup; `subscription-period/index.ts`, допустимые статусы активации. После обычной цепочки check → delivered → completed удаляется product Role. Поздний paid invoice существующей Stripe subscription связан с тем же PaymentIntent/Order, но completed Order больше не участвует в proceed. Проверка только отсутствующего Role не отличает эту ситуацию от явного отзыва.

Триггер: paid renewal подтверждён после выполнения обычного expiry cleanup. Ожидается полный новый interval после подтверждения согласно плану; текущий путь оставляет доступ закрытым после оплаты. Это установленный путь кода, подтверждён владельцем slice; внешний Stripe webhook reviewer не вызывал. Частота зависит от задержки оплаты относительно job.

Нужна сохранённая причина прекращения права и проверяемый переход для поздней подтверждённой оплаты после обычного истечения. Явный отзыв/отмена не восстанавливаются ни новым invoice того же отозванного Order, ни автоматическим proceed. Решение уточняет lifecycle плана; сценарии должны покрывать ordinary expiry → cleanup → paid renewal и отдельный explicit revoke → paid renewal. Владелец поднял конфликт координатору; ослабление missing-grant проверки не является закрытием замечания.

До стабильного READY и повторной проверки slice не принят. Invoice ordering/immutability, server-owned period columns и conditional write просмотрены; итоговая проверка включает свежий diff и команды после исправления fulfillment.

## Implementation: subscription period, повторная проверка

**Результат: PASS для проверенного backend slice.** Рабочий diff по-прежнему сравнивается с `d5add8923d56ea6fcbb6a89ea6994de8d053ac75`. Открытых замечаний в этой области нет. Остальные frontend/access/cutover изменения и финальная приёмка issue не входят в этот результат.

Исправления подтверждены кодом и проверками:

- Paid fulfillment выполняется в общей DB transaction с Subject → Order advisory-lock order и row lock через owning Ecommerce capability. Свежие ownership/Order/Role reads, period CAS и Role/balance writes участвуют в одном scope. Notifications вызываются после commit. Реальный collector выполняется до активации периода, поэтому текущий Order не исключает своё начисление.
- PostgreSQL проверка использует настоящий collector с настроенным top-up, откатывает period/Role/balance и consistency generations при отказе начисления, затем конкурентно повторяет операцию без потери или двойного начисления. Conditional balance update сохраняет проверку прежней суммы.
- Expiry использует одну conditional write operation с ожидаемыми status/invoice/end и условием deadline. Устаревший expiry A не завершает уже принятый renewal B. Точная граница — `now >= endsAt`.
- Root-approved уточнение плана добавляет server-owned `subscriptionRevokedAt` и состояние `expired` для обычного recurring истечения. Поздний paid renewal после нормального cleanup восстанавливает полный interval; явно отозванный Order не возобновляется. Досрочный renewal сохраняет непрерывное начало покрытия. Generic writes не меняют эти поля, CAS включает revokedAt и прежний полный anchor.
- Cancellation помечает только свой Order и использует доверенное order-fulfillment снятие Role. Helper сохранения другого действующего grant исключает revoked Orders. Пагинация owned IDs и bounded recurring cursor проверены на backlog больше одной batch; synthetic timestamp updates не добавлены.
- Invoice.createdAt остаётся server-assigned/immutable, provider spread с прежней датой совместим. Реальный DB сценарий проверяет конкурирующий приём invoice, OPEN renewal, A → B → попытку повторного retimestamp A и revoke против устаревшего CAS.

Reviewer повторно запустил следующие команды с `--runInBand --runTestsByPath`:

| Jest config                                         | Проверенные файлы                                                                                 | Результат                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| `libs/modules/ecommerce/jest.config.ts`             | Order `repository.spec.ts`, `subscription-period/index.spec.ts`, `find-by-id/check/index.spec.ts` | 3 suites, 27 tests PASS     |
| `libs/modules/billing/jest.config.ts`               | Invoice `repository.spec.ts`                                                                      | 1 suite, 5 tests PASS       |
| `libs/modules/rbac/jest.config.ts`                  | `ecommerce/order/proceed.spec.ts`, `freeze-subscription-period.spec.ts`                           | 2 suites, 36 tests PASS     |
| `libs/modules/ecommerce/jest.integration.config.ts` | `subscription-period/index.integration.spec.ts`                                                   | 1 real PostgreSQL test PASS |
| `libs/modules/rbac/jest.integration.config.ts`      | `ecommerce/order/proceed.integration.spec.ts`                                                     | 1 real PostgreSQL test PASS |

Итого: 70 tests в 8 suites, все с exit 0. Scoped `git diff --check` проходит. Проверены schema и две generated additive migrations; reviewer не редактировал migrations и не запускал повторную генерацию. Прямой Order row-lock read отмечен `trackRepositoryRead`, включая пустой результат. Новых upward module imports в проверенных путях нет; foreign table lock вынесен из Subject repository к владельцу Order.

Ограничения PASS: DB tests используют настоящий PostgreSQL и owning repositories/services, но формируют часть Product/payment graph через тестовые readers. Реальные внешние provider webhook, полный app HTTP stack, configured Role-revocation callback, legacy freeze endpoint authorization, WS delivery в другом клиенте и новый статус в purchase-history UI проверяются интеграцией всего issue. Факты passing Host TypeScript и capture check сообщены владельцем slice и координатором; reviewer не выдаёт их за свои повторные запуски. Финальный Code Review остаётся пользователю.

---

# ISSUE-376 — final independent local review

Reviewer: phase_reviewer, review-pr. Branch: codex/issue-376-framework-visual. Final source revision: **6a9be42bb6**, including cb4296b6f0, 6d7e1f09c9 and 84087145cf. Comparison base: d5add8923d56ea6fcbb6a89ea6994de8d053ac75. Only Core artifacts remain uncommitted. This reviewer changed no implementation, commits, GitHub comments or Project status.

## Result

**PASS for the implementation preflight. No remaining actionable finding in the reviewed source and rollout scope.** The final frozen Host build, runtime/browser checks, independent source reviews and real database functional checks support moving the issue to human Code Review. This does not accept the user's final Code Review or authorize a PR, push or merge.

The review applies the canonical review_pr workflow, confirmed module order, frontend/Widget ownership and registration contracts, code-placement and cache/read/write contracts. It checks the approved plan with its explicit guest-entitlement, revocation, maintenance-window and streaming-not-found clarifications. Runtime semantics have remained frozen since the final build; later lint changes consolidate imports/types, format tests and remove an invalid lint comment.

## Resolved findings

- Subscription fulfillment and expiry races are closed. The prior durable review independently accepted server-owned periods/revocation, immutable Invoice ordering, continuous early and full late renewal, atomic period/Role/credit writes, generation rollback, actual topup collection, concurrent retries, stale-expiry CAS, explicit revocation provenance and bounded fair processing. This reviewer executed **70 tests across 8 suites**, including two real PostgreSQL suites. Details remain in thoughts/shared/research/singlepagestartup/ISSUE-376-reviews.md.
- Cutover Product.type must equal subscription. Missing type and one_off fail before writes. CLI apply/rollback require `--exclusive-maintenance` before credentials, origin selection, SDK imports, manifest reads, locks or network calls. Both modes have regressions.
- The general GET→PATCH gap is bounded by a documented local exclusive CMS window. Root confirms other CMS writers were stopped; browser QA did not submit forms/checkout, and integration fixtures rolled back. A per-manifest lock does not protect remote edits. Parallel CMS editors require conditional writes before this tool can be used; no general CAS guarantee is claimed.
- New Blog association reads required two missing public GET policies: widgets-to-categories and categories-to-website-builder-module-widgets. The final README contains an exact idempotent operator SDK prerequisite: select path + GET, reject ambiguity, refuse existing Role bindings, create only when absent, then verify anonymous reads. The reviewed deployment must require public Blog categories. Both local reads now return 200, and the full 14-read audit found no other missing policy. This does not weaken the private graph guard. Existing public incoming references and later public reuse of protected WB/File graphs are rejected.
- The narrow cart three-column layout is replaced with a compact vertical layout. Gallery's original default media scope, all attributes, middleSlot and actions remain. The responsive drawer has scrolling, its accessible label and description. Source inspection and the final 320px screenshot confirm the former letter wrapping is gone.

## Final access delta

Native repository Date values use getTime; numeric epochs retain milliseconds. Boundary tests use .487Z at start−1 ms, start, end−1 ms and end. Invalid Date/object/non-ISO/calendar-overflow values deny access. The entitlement closes at now >= end.

Identity affects guest/locked presentation only. A legitimate paid guest still needs the verified current Subject, owned history Order and Product line, subscription Product and checkout attributes, all fresh Product Roles, an allowed active status, a valid invoice-anchored period and no revocation marker. Anonymous, unpaid guest, another account/Product, expired or revoked grants remain denied.

Independent final reruns:

- Framework/engine cutover: **36 tests, 154 assertions**, exit 0.
- Access and SubjectsToRoles: **20 tests / 2 suites**, exit 0.
- Protected File frontend: **12 tests / 1 suite**, exit 0; public/SSR behavior, authenticated Blob requests, abort/scope/principal cleanup, 403 clearing, Strict Mode and native audio/video replacement.
- Real commerce SDK→Hono→Services→PostgreSQL: **1 integration test, 12.7 s**, exit 0.
- Real CRM effective Subject Service→PostgreSQL: **1 integration test, 12.6 s**, exit 0.

Commerce persists cart CRUD/cascades, preserves exact IDs/currency/quantity, denies a foreign owner, rereads changed prices and creates actual dummy PaymentIntent/Invoice records with provider-generated paymentUrl. CRM validates six invalid cases without an orphan Request, preserves stored Form/Step/Input/Option order and values, saves before notification, and replays failed/sent/queued outcomes without another Request or delivery. Only external observer/webhook/notification transport is captured. Both fixtures roll back and verify their absence.

## API, build and browser evidence

The private-content integration source and its passing log were inspected: **1 matrix, 31.3 s**, run by planner/root. It composes effective production controllers/Services, real PostgreSQL repositories and both Redis-backed response cache implementations. A public control establishes a real cache HIT in each mode. Protected reads as paid guest A and anonymous/registered B/unpaid guest establish bypass of cache lookup/write. The matrix covers all 13 WB edge kinds, File aliases, list/count/by-ID scope, ordered content, own-Subject isolation, byte GET/HEAD/Range denial, public media, exact expiry and persisted Role revocation.

The integration intentionally avoids app.ts schedulers and injects its revocation callback. Actual app.ts wiring was read separately: effective owner injection, configured Role callbacks, guards before caches and before static bytes. Payment acceptance/transaction invariants have separate real PostgreSQL coverage.

Final Host build `.next-issue376-final` passed compile, type validation, static generation and the Nx target. Its running production Host returned 16 inspected EN/RU Framework/Blog/Product/Category/private Article HTML/RSC responses, including the public Article alias, all 200 without the protected marker or Widget ID. Task-specific generated tsconfig includes are removed.

The final browser report is PASS with no open blocker. It covers desktop and real 320×900 Framework, Slider controls/keyboard, saved Product media/attributes/currencies/quantity/providers, cart create/update/delete and corrected drawer, CRM fields/options, Product Category alignment, Blog index/category/Article, guest private aliases, RU links/Back, mobile menu focus and hydrated not-found UI. Final console capture contains zero errors/warnings. This reviewer independently inspected cart-final-320.jpg; other browser operations were executed by research_runtime. Product detail/media checks on unchanged source precede the final cart-only patch; their screenshots are labelled accordingly rather than claimed as a new retest. Evidence: /tmp/sps-376-browser-report.md and its linked screenshots.

Other reviewers' scoped acceptances were inspected in /tmp/sps-376-access-review.md, /tmp/sps-376-content-review.md and /tmp/sps-376-wb-review.md. They cover effective Services, graph/byte/write guards and shared deadlines, ordered client content, immutable request-start lifetime, per-instance cache cleanup, frontend registries/readers, CRM/commerce ownership and Slider/Host presentation. The original File frontend source was additionally read and its full focused suite rerun by this reviewer.

## Structural checks and limits

- Independent consistency-read audit: exit 0, 9 SQL reads have adapters; 24 raw fetch calls and 1 explicit API-origin read use responsePipe.
- Independent code-placement and final diff checks: exit 0. Final source tree is committed; outstanding files are Core artifacts.
- Final module audit supplied by root: 14,864 source files, 0 violations. Generated schema/capture checks and targeted lint corrections are recorded by root.
- Full studio:validate supplied by root: exit 0; 147 design-system, 380 presentation, 5 GitHub and 16 pipeline tests. Its report still contains 5 existing pre-development gaps (1 structural, 4 approval); those are not approvals.
- Independent final API TypeScript exits 2 with **20 baseline/current diagnostics, 0 new, 0 absent**. Complete blocks retain paths/line/column/TS code and continuation text; only the isolated archive prefix is normalized. Raw log: /tmp/sps-376-final-api-types-review.log; comparison: /tmp/sps-376-final-api-types-comparison.md. Existing failures are not described as a passing typecheck.
- Browser entitlement coverage is the guest gate. Granted/expired/revoked/multiple-principal graph and bytes use actual API/PG/Redis coverage; client deadline/media/cache disposal use focused React/SDK coverage. No paid browser session, browser CRM Submit, external notification delivery, external payment or provider settlement is claimed.
- Saved browser Gallery media are images; native audio/video handling uses focused tests. Unknown URLs preserve Next streaming not-found UI/noindex/digest; literal HTTP 404 is not established.
- Live cutover has 9 operations and zero legacy freezes. Apply/readback/repeat, rollback retaining private classification and reuse/reapply are recorded. Live legacy backfill is not claimed; its service/adapter behavior has separate coverage. Manifests remain outside Git.

---

# ISSUE-376 — Blog follow-up independent review

Verdict: **PASS** for local source revision `129dd65f92` and the published local demonstration, within the evidence limits below. No open source, publication-tool or access finding remains. Final human Code Review remains with the user; this review does not create a PR or approve a merge.

Comparison: `698713c331` → frontend `4db50ba65f`, editorial/publication `2457eebd1e`, Cart trigger `129dd65f92`. The reviewer used review-pr, inspected the actual source and tool, independently reran the tests listed below, and read the final operator/build/browser artifacts. Implementation, data mutations, commits and statuses remain owned by root and the implementing agents.

## Resolved findings

1. **P2 — unnamed links for empty card titles.** Article and Category stretched primary links now have localized accessible names when the saved title is empty or whitespace. EN/RU regressions cover both models.
2. **P2 — missing byline loading layout.** One Profile-owned BylineSkeleton is wired to the model reader, author association reader, linked Profile find and Host association find. Actual shared-client pending paths pass for both xs and sm. There is no extra Provider or query owner.
3. **P2 — rich-text renderer used for plain Profile subtitle.** Byline now uses the existing getLocalizedPlainText helper and a normal paragraph. Plain EN/RU saved data is restored; legacy serialized TipTap remains readable. EN/RU plain/legacy regressions verify no TipTap invocation or console diagnostic. Profile schema, admin text fields and existing overview behavior remain compatible.

The browser's Cart styling finding is also resolved in the owning RBAC component: a 44px neutral rounded-xl trigger and right-aligned quantity badge replace the old circular primary-colored treatment. Subject/cart readers, Sheet content and mutations remain unchanged.

## Source and composition

Host queries Social ProfilesToBlogArticles using the actually loaded Article ID. Blog receives a rendered author node through a same-runtime callback; it does not import Social or RBAC. Default association renderers forward the typed callback and resolve it after loading their linked Article. Social byline/author-default literals, registries, public exports and props unions are registered.

Categories use actual CategoriesToArticles links and saved records/order. Their cover is the first ordered attachment of the first ordered linked Article. Article retains its attachments, rich text and scoped private-content slot. The primary stretched anchor covers the card without nested anchors; category/description links and native media controls remain above it. Both Studio cards use the same primary-link behavior. Primary keyboard focus outlines the card.

Navbar retains saved logo/button relations and Host-provided JSX slots, with one responsive navigation instance. Opening focuses its first link; Escape closes it and returns focus. The unchanged Host default-navbar wrapper supplies Cart only. Studio's full Framework fixture supplies an optional account entry; runtime preserves its existing cart-only composition. Identical fixture content or a newly added Sign-in operation is not claimed. Session logic remains in RBAC/Host composition.

## Independent verification

- Blog: 13 tests / 3 suites PASS.
- Final Social byline/reader: 10 tests / 2 suites PASS.
- Host Blog bridge: 3 tests / 1 suite PASS.
- Navbar: 4 tests / 2 suites PASS.
- Final RBAC Cart trigger: 3 tests / 1 suite PASS.
- Frontend total: **33 tests / 9 suites**, independently rerun.
- Publication tool: `bun test --tsconfig-override ./tsconfig.base.json tools/runtime/blog-example-content.test.ts`: **9 tests / 36 assertions PASS**. Bun's directory-mismatch warning does not change exit 0.
- Code-placement check PASS. Author focused TypeScript programs cover nine frontend roots and the final Byline source/spec with zero diagnostics. Final module audit reports 14,877 sources and 0 violations; diff check passes.

The final production build passes compilation, full Host type validation, static generation and trace collection: `/tmp/sps-376-blog-accepted-retry-build.log`. An earlier attempt failed with ENOSPC while writing Webpack cache. Root removed four inactive task build outputs and reran using the existing `SPS_HOST_WEBPACK_CACHE=false` and `NX_SKIP_NX_CACHE=true` settings without source changes. Final source/config worktree is clean; only Core artifacts remained dirty at review.

The asset pipeline has no new Blog registration gap. Its remaining gaps are eight existing mascot items under one structural check and four existing approval gaps. No approval stamp is granted by this review. Root's Studio validation exits 0; the pipeline gap report is retained separately in `/tmp/sps-376-blog-assets-pipeline.json`.

## Editorial and media

All six EN/RU articles were inspected against their listed repository sources; every listed local path exists. TipTap descriptions parse and code blocks contain actual line breaks, without literal escaped newline/quote sequences. Public Article bodies contain no protected marker. The private revocation appendix remains separate and uses explicit local fixture inputs, current-subject reads without operator bypass, and deletion of only the fixture's exact Role grant. Its protected list/count examples distinguish filtered denial from unfiltered public collections.

External technical statements match primary documentation: [Next.js 15 component composition](https://nextjs.org/docs/15/app/getting-started/server-and-client-components), [Next.js 15 revalidateTag](https://nextjs.org/docs/15/app/api-reference/functions/revalidateTag), [Hono middleware order](https://hono.dev/docs/guides/middleware), [Drizzle migration generation](https://orm.drizzle.team/docs/drizzle-kit-generate), and [TanStack Query keys](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys). SPS ownership, query scope, cache lifecycle and private-access claims match the reviewed code/contracts. Code examples use illustrative isolated fixtures; they are not live credentials or drop-in commands for an existing account.

Six photographic masters and square outpainted deliveries are retained. Their prompts/adaptation metadata live under workspace/utils/media; the registry records the current proposal. Root verified the seven uploaded managed assets byte-for-byte. The byline uses a real saved editorial Profile and brand avatar, without invented person credentials.

## Publication safety and actual state

The tool uses explicit localhost:4000 and rejects apply without `--exclusive-maintenance` before credentials/network. It snapshots exact ID/slug retirements and metadata-declared incoming Article links, the selected protected graph and existing assets. It verifies all new copy/cover/author/avatar/category/curation sets before retiring any old Article. Unknown create/delete outcomes resume using saved progress and actual returned IDs. Existing Role-bound policies abort; only the two explicitly selected missing Social author GET policies may be created. Full-record PATCH relies on the documented exclusive CMS window.

The tool performs no Website Builder/File/Product deletion and has no automatic retirement rollback. Its README names the separate old public Widget/link prerequisite (802f309b… / 8264f0d8…) with ownership inspection, backup and readback before prepare. Root performed that SDK cleanup after checking the sole incoming link and absence of outgoing/Host references. The selected File-ID check complements the active global graph/byte-alias guards; preparation alone does not prove unrelated aliases safe.

Operator logs and the mode-0600 manifest show 51 initial operations, 6 Articles, 3 Categories, 8 exact retired Articles, and unchanged protected graph; repeat apply writes 0. Fresh preparation after the plain subtitle restoration has **0 operations**, and final verify again returns 6/3/8 with the same protected fingerprint. Evidence: `/tmp/sps-376-blog-{apply,verify,repeat}.log`, `/tmp/sps-376-blog-before.json`, `/tmp/sps-376-blog-final-state.json`, `/tmp/sps-376-blog-final-{prepare,verify}.log`.

The retained private Article remains `5ade2625-007e-4c90-86bd-989a33e534fa`, with private link `992b28da-d5a7-4e9a-a0f4-350e0c73cee3`, subscription link `b7722336-de44-4760-9b67-b1bf92102b3b` and WB Widget `6580e777-393d-4255-94b9-58f3607ce465`. Private closure fingerprint is `a1d4124433fdc22fc77018e0441ca7dafef45b788a169135b76530d9ea4af140`. Product targets remain after old cross-promotion links cascade. Seven assets and the actual returned editorial Profile are recorded.

## Built runtime acceptance and limits

Final HTTP JSON independently inspected: **27 Host responses** are 200 without notFound, protected marker or private Widget ID. They cover six Articles and three Categories in EN/RU, plus eight private Article HTML/RSC responses across EN/RU Blog and Framework aliases. Five actual API reads confirm private Widget403, filtered list empty, filtered count0, Article count6 and Category count3. The three direct protected Widget API responses are private/no-store; public Host HTML/RSC contains public Article content and the client access slot. Evidence: `/tmp/sps-376-blog-accepted-http.json` and `.log`.

Final browser evidence targets source129dd65f92, cache-disabled accepted build, Host session24587. Its timestamp-filtered console after fresh navigation contains 0 warnings/errors, including no subtitle/TipTap, hydration or failed-request diagnostic. Desktop bylines and localized bodies/source links render. Actual320 measurements show page scrollWidth320, a 320×900 Cart drawer, 44px Cart/Menu controls and correct Escape focus. All four settled EN/RU Blog/Framework private routes show public content plus the localized denied block, without protected marker or Widget ID.

This reviewer visually inspected the valid final RU Article and Cart 320×900 screenshots: localized byline/plain subtitle/date/avatar and neutral Cart/Menu treatment fit. Nine captures are 320×169 and unusable: the final index/code/two private-alias images, plus earlier RU Article, Backend/DevOps Category and two private-gate images. All nine are explicitly excluded by the corrected browser report and retained only as capture diagnostics. The cause is unproven. Their measurements/settled-gate checks are browser-agent DOM evidence, supported by the separate actual HTTP matrix. Earlier valid desktop screenshots and 320×900 Index/Frontend Category/Nx Article/code/Storybook-header screenshots, plus native blank-padding/image/category-link click checks, are attributed to the earlier build; the only later source changes are the separately tested byline renderer and Cart trigger. No claim of new final-build coordinate clicks is made.

Browser report: `/tmp/sps-376-blog-browser-report.md`; empty final warning/error list: `/tmp/sps-376-blog-browser/final-console.json`. Original zoom/viewport were restored; agent-created tabs were closed. No payment, CRM submission, mail, login/logout, subscription purchase or user-session change was performed in this follow-up. Earlier entitled/expired/API/cache/security integration evidence remains separate and is not represented as a new browser subscription test.
