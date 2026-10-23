---
date: 2026-10-23T01:18:54+03:00
issue_number: 376
repository: singlepagestartup
topic: "Перенос визуала Storybook в Framework и доступ к закрытым виджетам"
status: approved
branch: codex/issue-376-framework-visual
research: thoughts/shared/research/singlepagestartup/ISSUE-376.md
visual_baseline: 652cabd9bf6cedbb578e26254c7bb887ace73bf8
---

# Framework: план реализации issue #376

## Overview

Перенести проверенный визуал Studio в production-варианты Framework, товаров, категорий, CRM и блога на реальных SDK-данных. Закрытые виджеты получают явную классификацию, проверку подписки на сервере и защиту всех путей чтения содержимого.

Основание автономных промежуточных этапов: прямой запрос пользователя в текущей сессии. Независимый агент применяет `review-pr` к локальным артефактам и diff; после успешной проверки этап переходит в следующий статус. Конечный статус — Code Review для пользователя; PR, push и merge не входят в работу.

## Current state analysis

- Research принят независимой проверкой: `thoughts/shared/research/singlepagestartup/ISSUE-376-reviews.md`. Визуальная база Studio — commit `652cabd9bf6cedbb578e26254c7bb887ace73bf8`; ранее выполненное исправление чтения своего Subject сохраняется.
- Runtime Framework использует сохранённую Host Page `default`, а не статическую Studio Page `framework`. Точные страницы, активные Widget links и их порядок перечислены в research, раздел 1.
- Ecommerce владеет отображением данных; RBAC — Subject, корзиной и checkout. В категории товара сейчас отсутствует быстрый checkout, который уже есть в каталоге и detail.
- CRM presentation ссылается на ту же WB-запись, что hero. Смена её варианта без fork изменит две секции. Форма использует реальную динамическую схему, submissionId и Subject SDK.
- Article→Widget и Article→Product сейчас не содержат семантики приватности или подписки. Маршрутная проверка разрешает анонимное чтение demo Widget по ID, list и count. Потомки и `/public/*` требуют отдельного закрытия; demo пока содержит только текст.
- Subscription Roles не имеют срока. Текущий check использует изменяемый `Order.updatedAt + interval`, а открытый renewal invoice может задержать завершение заказа. Ни статический Role, ни статус delivering не доказывают действующий период.

### Key discoveries

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/Component.tsx:12` уже соединяет lower Product presentation с Subject controls; это сохраняемый владелец операций.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/crm-module/form/request/create/ClientComponent.tsx:28` вызывает реальный `crmModuleFromRequestCreate`, отдельно показывает сохранение Request и доставку уведомления.
- `tools/runtime/ai-chat-widget-links.ts:257`, `:700`, `:739` содержат образец fork, восстановления неизвестного результата create, readback и rollback без затирания concurrent edit.
- `libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:83` устанавливает `parsedQuery`; shared find/count передают его repository, где фильтры применяются до pagination/count. `notInArray` поддерживается в `query-builder/filters.ts:38`; OR запрещён.
- `apps/api/app.ts:247`–`:280` ставит response caches перед контроллерами. Защита закрытого содержимого должна исполняться до обоих caches, а byte guard — до `/public/*` handler на строке 81.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:308`–`:423` и RBAC `ecommerce/order/proceed.ts:623`, `:753`–`:772` задают точки изменения срока и подтверждённой доставки.
- RBAC `ecommerce/order/proceed.ts:336`–`:355` сейчас восстанавливает отсутствующие product Roles у delivering Order. Без изменения этой ветви удалённый grant вернётся после очередного proceed.
- `libs/modules/billing/models/invoice/backend/app/api/src/lib/service/singlepage/index.ts:5` — обычный CRUDService. Неизменяемость Invoice.createdAt ещё требуется обеспечить в owning write operation; текущее поле само по себе её не гарантирует.

## Desired end state

| Страница или блок                     | Production owner и переносимый визуал                                                                               | Сохраняемые данные и действия                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                             | Host saved Page/Layout; WB `content-default`, Slider/Slide `default`                                                | Порядок секций, весь форматированный текст, файлы всех поддерживаемых типов, связанные features/buttons/slides и их порядок                                                         |
| Товар                                 | Ecommerce Product `default`/`overview-default` по Studio `card`/`overview-purchase`/`gallery`; RBAC Subject actions | Все медиа, категории и ссылки, профиль продавца, shortDescription/description, произвольные атрибуты и их типы, реальные price/currency, quantity/store, корзина и быстрый checkout |
| Каталог, категория и связанные товары | RBAC Widgets + Ecommerce Category и presentation frames                                                             | Один общий горизонтальный контейнер, карточки и все доступные действия; действующие фильтры, поиск и pagination сохраняются там, где есть в runtime                                 |
| CRM                                   | RBAC functional Widget → точный WB `content-feature-find-row` → Subject form slot                                   | Существующие Form/Step/Input/Option IDs, порядок, обязательность, валидация, Request, submissionId, pending/saved/notification/error                                                |
| Блог и категории                      | Blog Widgets, Category `default`/`overview-default`                                                                 | Категории, curated Popular и общий fallback статей, локализованные заголовки/описания, медиа и навигация                                                                            |
| Статья                                | Blog Article `default`/`overview-default` и Host RBAC slots                                                         | Форматированный анонс и полный текст, все медиа, публичные и закрытые WB widgets в сохранённом порядке, связанные товары                                                            |
| Закрытый блок                         | RBAC Subject resource access → lower Article presentation                                                           | `guest`, `locked`, `expired`, `granted`, `checking`, `error`; вход, получение подписки и повторная проверка доступа                                                                 |
| Loading и состояния                   | Model single loading; Widget collection loading                                                                     | Одна сущность в модели, сетка в Widget, empty/error, сохранённые данные при обычном refetch и удаление закрытых данных при отказе                                                   |

Рабочими остаются EN/RU, прямые URL, back/forward, неизвестный slug → 404, текущие ссылки и серверные операции. Демонстрационные цены, авторы, комментарии, optionValues и изображения Studio не становятся production-данными.

## What we're not doing

- Новая бизнес-модель подписок, новый конфигуратор товара, новые платёжные providers и замена CRM-схемы.
- Импорт `apps/studio` или fixtures в runtime, перенос Studio asset paths и ручное редактирование repository snapshots.
- Перенос бизнес-операций в Host/Website Builder, изменение module dependency order, новые packages или слои.
- Публикация ветки/PR и принятие финального Code Review за пользователя.

## Implementation approach

Сначала закрепить серверные правила и период подписки, затем перенести визуал в существующих владельцев. Сохранённые рабочие variant literals продолжают работать: Studio `Product.card` переносится в production Product `default`, а не требует массового переименования данных. Новые варианты регистрируются вместе с literal interface и public props union.

Studio-before-libs выполнен для перечисленных визуальных блоков. Если интеграции нужен дополнительный видимый state/slot, сначала добавить его в соответствующую Studio-проекцию и проверить там; technical readers и guards остаются runtime-кодом.

### Правила доступа, обязательные для всех фаз

1. **Явная классификация.** Article→WB Widget с `variant="private"` обозначает закрытый корень. `default` сохраняет публичный смысл. Article→Product с `variant="subscription"` обозначает требуемый subscription Product; `default` сохраняет cross-promotion. Это новые association-specific semantics, не признаки приватности по slug, Page template, названию или Permission без Roles. Для private корня отсутствие корректного subscription requirement означает отказ.
2. **Конкретный ресурс.** Право требует текущий JWT Subject, собственный Subject→Order, соответствующий Product в Order, свежую связь Subject→Role продукта и допустимый subscription Order (`delivering` или `requested_cancelation`) с действующим явным периодом. `paid` до подтверждённого delivery/period transition права не даёт. При нескольких `subscription` products достаточно одного полностью подходящего права. Другой product, аккаунт, отозванный Role, неподходящий тип/статус заказа и ошибка чтения доступа не подходят. Operator сохраняет существующее доверенное управление, проверенное через штатный механизм; браузеру operator credentials не передаются.
3. **Фиксированный период.** В существующем Order добавить nullable `subscriptionPeriodStartsAt`, `subscriptionPeriodEndsAt`, `subscriptionPeriodInvoiceId` и server-owned `subscriptionRevokedAt`. Подтверждённый paid invoice принимается один раз в существующем RBAC proceed/delivery flow. Первый период начинается при подтверждённом переходе в доставку; renewal добавляет полный interval от большего из текущего конца периода и времени принятия оплаты. При досрочном renewal startsAt сохраняет начало непрерывного действующего покрытия, чтобы не закрывать уже оплаченный остаток; при просроченном renewal startsAt равен времени принятия оплаты. Использовать те же minute/hour/day/week/month/year календарные операции, что checkout interval. Повтор webhook/proceed, обычный update и OPEN invoice не меняют период. При нескольких paid invoices кандидат — последний по immutable createdAt, с ID как стабильным разрешением равенства; invoice не новее уже принятого anchor не перекрывает и не продлевает период. Отложенная первая оплата получает полный interval с принятия оплаты; просроченный renewal — полный interval с нового подтверждения. При `now >= endsAt` доступ закрыт без ожидания cron/job. Requested cancellation сохраняет право до конца периода; canceling/canceled/delivered/completed либо удаление Role прекращают право сразу.
4. **Серверные поля и устойчивый отзыв.** Period fields и subscriptionRevokedAt не принимаются из generic create/update и user-scoped checkout/cart payload. Статусы/тип заказа и Invoice paid status не могут быть подделаны обычным checkout/cart payload: их пишет действующая доверенная payment/order orchestration. Period пишет только её отдельная проверяемая service operation, с проверкой принадлежности invoice/order и условным обновлением по ожидаемому предыдущему invoice/period. Вызов не доступен как произвольный публичный CRUD. Period fields меняются одной операцией; конкурирующие retries не продлевают срок дважды. Подтверждения всех существующих providers, включая zero-price, сходятся к одному приёму paid invoice в proceed; отдельный provider не выбирает свою формулу срока. После первого принятого периода этого Order отсутствие свежего product Role означает отзыв: delivering/requested_cancelation, обычный proceed, повтор paid transition и автоматический renewal на том же Order не восстанавливают Role и не активируют новый период. Это относится и к новому paid renewal invoice того же отозванного Order. Initial paid flow новой явной покупки с новым Order вправе один раз выдать Roles до активации первого периода. Legacy delivering без Role не ремонтируется, остаётся закрытым и попадает в отчёт. Обычное удаление или reassignment Subject→Role атомарно устанавливает subscriptionRevokedAt на всех затронутых собственных subscription Orders через owning service callback; HTTP payload не может очистить маркер. Естественное истечение recurring подписки использует отдельную внутреннюю операцию снятия grant и статус expired, сохраняя paid anchor. Новый более поздний paid invoice такого Order может восстановить оплаченный период только при пустом subscriptionRevokedAt. Это сохраняет позднее Stripe renewal, не восстанавливая явно отозванное право. Одноразовое продление сохраняет существующий flow нового checkout.
5. **Защищённый граф.** Корень закрывает собственную запись, цепочку WB Widget→ButtonsArrays/Features/Files/Logotypes/Sliders, Slider→Slides, Slide/Feature→ButtonsArrays/Files, ButtonsArray→Buttons, Button/Logotype→Files и association rows. У shared узла требуются права на каждый private root, через который он достижим; migration изолирует разные access scopes. Неопределённый scope и ошибка обхода закрывают доступ.
6. **Смешанное использование.** Public и private не разделяют одни content records или storage byte paths. Перед маркировкой private выполнить fork соответствующего подграфа и управляемых файлов, сохранить public ссылки/bytes. External https media для закрытого блока сначала ingest в управляемое File Storage; public внешний URL не считается защищённым.
7. **Изменения графа.** Write guard до commit запрещает public reuse private node, добавление public/shared descendant в private graph и удаление/перемаркировку связи либо parent, после которых живые private records/bytes становятся публичными orphan. Отказ — 409 с понятной причиной. Управляемое удаление/публикация возможно только как явная проверенная операция, сохраняющая protected reachability либо удаляющая данные и bytes; обычный CRUD не превращает unlink в публикацию.
8. **Пути чтения и cache.** RBAC resource middleware исполняется после parse query, до consistency/legacy response caches. Для find/count добавляет conjunctive restriction в typed `parsedQuery.filters.and` до pagination; исходные client filters не заменяют scope. By-ID закрытого ресурса отвечает 403 без тела записи. OR/невалидный filter отвергается; превышение допустимого числа filters не пропускает scope. Нет post-filter после limit/count. Guarded families и bytes исключаются из обоих response caches; закрытые ответы и SDK используют no-store. Route-level auth cache не заменяет resource guard.
9. **Bytes и SSR.** GET/HEAD известного `/public/...` пути проверяются до static handler. Защищённые медиа читаются File Storage SDK с текущими credentials через защищённый content endpoint; client renderer использует Blob/object URL и освобождает его при потере доступа/unmount. Public img URL, Next Image optimizer и общий SSR cache не доставляют закрытые bytes. Закрытый body не создаётся в server JSX и не попадает в HTML/RSC или скрытые children/props.
10. **Lifetime и порядок на клиенте.** Scoped content result содержит упорядоченные public items и безопасные private placeholders с orderIndex/непрозрачным slot key, состоянием и `expiresAt`. Denied placeholder не содержит protected record IDs или body; только granted item содержит загруженные relation/widget и разрешает дочерние private readers. Общий поток располагает private slots между public widgets на исходных позициях, а не добавляет их в конце. На deadline одноразовый UI timeout закрывает блок, очищает относящиеся к нему query data и object URLs, затем запрашивает свежее content result. Это не entity polling. Смена principal и 401/403 очищают private data; subscription/Role mutations используют существующие consistency dependencies и общий realtime/refetch pipeline.

## Phase 1: серверный период, ресурсный scope и безопасные bytes

### Changes required

- **Order schema/model и services:** `libs/modules/ecommerce/models/order/backend/repository/database/src/lib/fields/singlepage.ts`, соответствующие repository/schema/model exports; RBAC `subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts`; Ecommerce `find-by-id/check`. Добавить period fields, внутреннюю доверенную установку периода, единый расчёт interval и проверку границ. Удалить автоматический repair отсутствующих Roles в delivering-ветви `proceed.ts:336`–`:355`; для Order с уже принятым периодом paid/renewal путь также не выдаёт отозванный grant повторно. Initial grant относится только к первому подтверждённому периоду новой покупки; legacy delivering с отсутствующими Roles закрыт. Check использует фиксированный период; неоплаченный renewal не продлевает его. Новая логика не отнимает полный interval после отложенной подтверждённой оплаты.
- **Invoice ordering invariant:** `libs/modules/billing/models/invoice/backend/app/api/src/lib/service/singlepage/index.ts` и owning create/update write contract обеспечивают server-assigned createdAt на create и неизменяемость на всех обычных updates, включая provider/service SDK пути. Create не принимает дату из client payload; update сохраняет исходную дату, неизменённый createdAt из существующего spread payload совместим, изменение даты отклоняется до записи. Generic CRUD и operator HTTP update не могут превратить старый paid invoice в новый renewal anchor. Исторический import не является параметром runtime update; существующие записи не переписываются. Новый paidAt/schema для Invoice не нужен.
- **Миграции:** запустить `npx nx run @sps/ecommerce:models:order:repository-generate`; применять сгенерированную миграцию штатным repository-migrate. Drizzle SQL/meta руками не писать. Существующие поля остаются совместимыми, новые nullable до controlled backfill.
- **RBAC services/middleware:** новая операция `blog/article/content` рядом с Subject services; middleware в `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/`, export из owning package. Контроллер Subject только компонует owner guard, validator и handler. Внутренний graph traversal использует lower services/SDK adapter с доверенным DI, без рекурсивного HTTP вызова собственного guard.
- **Точный content API/SDK:** `GET /api/rbac/subjects/:id/blog-module/articles/:blogModuleArticleId/content`, метод `blogModuleArticleFindByIdContentFind`, публичные `IProps.IBlogModuleArticleFindByIdContentFindProps` и `IResult.IBlogModuleArticleFindByIdContentFindResult`. Вход — `id`, `blogModuleArticleId`, стандартные host/options. Own-Subject JWT обязателен, guest JWT допустим; anonymous — 401, чужой Subject — 403, отсутствие entitlement у законного владельца — 200 с locked metadata. Результат: articleId, checkedAt, aggregate access state/expiresAt и ordered items. Public item содержит kind/key/orderIndex/relation/widget; granted private item — те же загруженные records и access granted/expiresAt; denied private item — только kind/key/orderIndex/access. Denied item не содержит relation/widget/descendant/file/order/Role IDs или body. Key — непрозрачный порядковый ключ блока; сортировка orderIndex, затем ID разрешает равенство. Server states — guest/locked/expired/granted; checking/error принадлежат client query. Effective expiresAt каждого granted item — ближайший срок среди всех необходимых root scopes; общий deadline — ближайший из granted items. Client/server SDK no-store, response private/no-store с Vary Authorization/Cookie; query key включает article и principal. В cached Host операция монтируется только client-side, загруженный Widget получает `dataSource="props"`, новый Provider/повторный Widget read не создаётся. checkedAt задаёт поправку часов для deadline.
- **API integration:** `apps/api/app.ts` монтирует RBAC content read/write guards до response caches и перед `/public/*`; existing `libs/middlewares` cache exclusions и controller guarded dispatch расширяются точными resource families. Сервис знает domain graph; shared parse/CRUD/filter код не импортирует RBAC/Blog. Scope memo живёт в request, без 30-секундного TTL entitlement cache.
- **File Storage:** добавить owner `GET /api/file-storage/files/:id/content` handler/service, typed server/client SDK binary `readContent` и frontend `authenticated-content` по существующему variant/reader шаблону; обычный public download сохраняется. Обработать GET/HEAD, известные пути и range/download где текущий file UI их требует. MIME и path берутся из разрешённой File записи, scope применяется также к metadata/list/count. SDK передаёт текущие credentials и no-store; Blob/object URL живёт в owning client renderer, raw fetch в UI и второй Provider не добавляются. Secret не включается в URL. Website Builder и File Storage не импортируют RBAC. Native public img/Next Image с Bearer-only session не считается проверкой доступа.
- **Association semantics и документация:** Blog Article→Widget/Article→Product README и действующие edit flows описывают `private`/`subscription`; generic public readers не выбирают private associations без guard. Scope mutation guards покрывают изменения всех перечисленных моделей/relations и удаление parent records.

### Success criteria

#### Automated verification

- [x] Unit tests фиксируют полный interval, досрочный и поздний recurring renewal, повтор invoice, конкурирующие retries, старый invoice, OPEN renewal, stale Role, естественный expiry и явный revoke, а также попытки записать period/revokedAt через все публичные payloads.
- [x] Delivery и связанные Role/balance writes атомарны в существующем transaction scope; ошибка откатывает данные и consistency generations, повтор завершает операцию один раз. Stale expiry не завершает уже продлённый период.
- [x] Integration удаляет grant у activated delivering Order, запускает настоящий proceed, повтор paid transition и автоматический renewal с OPEN, затем новым paid invoice того же Order: grant не восстанавливается, content остаётся denied и period не активируется заново. Новая явная покупка с новым Order проходит initial grant отдельно. Legacy missing Role также не ремонтируется.
- [x] Billing write tests отвергают forged createdAt на create/update и сохраняют старую дату при обычном provider spread update. Replay test принимает invoice B после A, пытается сдвинуть A.createdAt позднее B и повторяет proceed: A не становится новым anchor, срок не растёт. Повторные/конкурирующие вызовы не обходят invariant.
- [x] Реальная API middleware-chain проверка включает list/count/by-ID до pagination, no-store, оба response cache режима и GET/HEAD bytes; subscriber-warmed cache не выдаёт закрытые данные следующему anonymous/другому Subject.
- [x] Tests проходят без lower→RBAC imports; `npm run check:module-dependencies` и `node tools/agents/code-placement.mjs` проходят либо отделяют документированные существующие baseline findings от новых.

#### Manual verification

- [x] Публичные WB/File Storage данные и guest-own-Subject доступны. Чужой Subject не становится публичным.
- [x] Прямой запрос закрытого Widget и файла с известным URL без entitlement не возвращает body, даже при прогретом cache.

## Phase 2: Website Builder и визуальная оболочка

### Changes required

- **WB Widget/Slider/Slide:** перенести visual из `apps/studio/modules/website-builder/**` в owning production `singlepage` variants. `content-default` сохраняет все зависимости, children и rich text. Slider читает сохранённые Slides с их orderIndex, URLs и медиа всех типов; пустой/один слайд корректны. Navigation — один режим `arrows | numbers | dots`, default Framework — arrows. Стрелки находятся на слайде, видимы на hover/focus и постоянно на touch; ArrowLeft/ArrowRight/Home/End не перехватывают ввод в полях; доступный sr-only status не дублируется видимым счётчиком.
- **Contact presentation:** создать WB `content-feature-find-row` с явным JSX form slot, зарегистрировать literal variant/interface/public union. Копия текстов и фотографий берётся из сохранённого экземпляра, не Studio fixtures. Website Builder не выбирает CRM/RBAC operation.
- **Host:** сохранить Page `default`, Layout/nav/footer и точный dispatch external widgets. Перенести sizing/background/padding website shell в `libs/modules/host/models/layout/frontend/component/src/lib/singlepage/default/` по Studio reference, сохранив все saved nav/footer links и slots. Использовать уже существующие runtime Onest и lime/dark shadcn tokens; новый theme CSS не нужен. Не создавать отдельный hardcoded Framework registry. Именованные slugs читаются одним Page `url-segment-values` callback в Host leaf; дальше идут только явные resource props.
- **Frames и статические данные:** убрать не связанный с SDK демонстрационный counter из WB content-default. Все сохранённые header/description/media/buttons/sliders/features остаются. `content-ecommerce-default` получает общий section frame без вложенного Card-контейнера, согласованный с embedded category grid.
- **Media slots:** public media сохраняет текущий renderer. Для granted private subtree WB передаёт явный режим защищённого media renderer в lower File Storage capability; он читает SDK binary в client. Техническая граница не изменяет visual и не передаёт credentials через presentation props.

### Success criteria

#### Automated verification

- [x] Slider tests покрывают порядок данных, все navigation modes, keyboard/text input, empty/single и отсутствие двух видимых навигаций.
- [x] Public variant entrypoints зарегистрированы; production не импортирует Studio. Новые props явно выбраны на Client boundary, shared reader/Provider не дублируется.

#### Manual verification

- [x] Framework показывает прежний контент и media, slider навигация работает на desktop/touch и клавиатурой, layout сохраняет общий контейнер.

## Phase 3: commerce и настоящая CRM-форма

### Changes required

- **Product/Category:** `libs/modules/ecommerce/models/{product,category}/frontend/component/src/lib/singlepage/` — Product `default`/`overview-default`, media gallery, attribute/price/currency views; Category `default`/`overview-default`. Сохранить shortDescription и полный TipTap, все медиа/категории/WB dependencies. Компактная Category card соответствует Studio: padding 20 px, heading 20 px, description 14 px. `embedded`/эквивалентный явный layout prop убирает повторный контейнер в категориях.
- **RBAC Widget и Subject:** `subject-me-ecommerce-module-product-list-default`, `...product-overview-default`, `...category-overview-default`, Subject `me/ecommerce-module/product/{card,overview}-default` и cart/checkout controls. Общая карта Product presentation + текущий Subject actions используется в каталоге, категории со Store и связанных товарах. Быстрый checkout добавляется в категорию; product/store selection остаётся точным. Не делать второй authenticationMe read для уже загруженного Subject.
- **Cart/checkout:** сохранить create/update/delete/checkout, quantity, выбранные реальные валюты, 8 действующих providers, email/comment/store и переход на серверный invoice paymentUrl. Суммы и доступные валюты остаются результатом текущих domain readers. Конфигурация — только существующие runtime-поля/атрибуты и поддерживаемые server options; Studio optionValues и локальный price calculation не становятся fake payload. `useWatch` расположен в нижних client controls, pending scoped per item, ID keys и callbacks стабильны.
- **CRM domain ownership:** добавить RBAC Widget `subject-me-crm-module-form-request-create` по соседнему functional Widget шаблону. Он читает точную связь Widget→CRM Widget, а CRM — точные Widget→Form/Steps/Inputs/Options. RBAC компонует существующий Subject request-create в свой WB frame через default relation renderer. Host dispatch остаётся module/instance based; бизнес-выбор формы и mutation выходят из специального Host CRM bridge. Старые CRM-only direct blocks сохраняют публичное совместимое поведение.
- **CRM field visual:** переносить стили в текущие schema-driven Form/Step/Input/Option views, сохраняя имена полей, Zod/schema validation, option IDs/order, dynamic multiplicity и submissionId. Request saved, notification delivered/pending/error отображаются раздельно; запрет двойного submit сохраняется.

### Success criteria

#### Automated verification

- [x] Public reader-path тесты сохраняют Product related data/slots и фактические checkout payloads; категория передаёт Store и показывает оба действия.
- [x] CRM integration создаёт один реальный Request при повторе того же submissionId, с настоящими Form/Input/Option IDs; сохранение и notification result не смешиваются.

#### Manual verification

- [x] Browser catalog/category/detail подтверждает quantity/currency, add/update/delete cart и сохранённые provider options. Actual SDK→Hono/PostgreSQL test подтверждает cart/quick checkout с текущими полями и dummy provider paymentUrl; React tests подтверждают redirect к возвращённому URL. Внешний browser payment не выполняется.
- [x] Browser показывает настоящую CRM-схему, выбор options и независимую presentation без повторного hero/gallery. React tests подтверждают submit/pending/success/error; actual owning service/PostgreSQL integration — validation, Request и idempotency при failed/sent/queued notification transport. Browser Submit и доставка наружу не выполняются.

## Phase 4: блог, категории, ordered widgets и gate

### Changes required

- **Blog views:** `libs/modules/blog/models/{article,category,widget}/frontend/component/src/lib/singlepage/` — перенести Category cards/overview, Article card/detail и collection layouts. Сохранить curated Widget→Articles и общий find fallback, Popular/Articles как отдельные saved instances, media arrays, rich subtitle/description и связанные товары.
- **Ordered content:** safe scoped Subject SDK отдаёт metadata последовательности public/private slots по сохранённому orderIndex. Host Blog bridge передаёт разрешённый JSX content slot в обе Article-композиции — обычную и with-private-content. Blog Article overview сохраняет публичный header/description и использует этот slot вместо второго unscoped relation reader; lower Blog не импортирует RBAC. Внутри общего упорядоченного потока public references используют штатный renderer, private позиции — gate/placeholder либо granted reader. Private блоки не собираются отдельным хвостом. Не переносить body private блока в server element, скрытый JSX или сериализованные props. Публичная Article.description остаётся публичной; закрытый текст хранится только в marked WB graph.
- **RBAC gate:** заменить route-level `authenticationIsAuthorized` в `me/blog-module/article/private-content-default` на typed resource access operation. До granted не запускать protected queries. Состояния/CTA соответствуют Studio, но URL входа/покупки и product IDs берутся из действующего runtime. `expiresAt`, изменение Subject, revoked/expired и access errors закрывают readers и освобождают data/Blob URLs.
- **Loading:** одиночные Product/Category/Article skeletons; collection Widgets собирают grid/loading/empty/error, а не generic model list. Сохранить focus/local draft при refetch и не держать private data после 401/403.

### Success criteria

#### Automated verification

- [x] Render/reader tests проверяют rich text, все media и orderIndex нескольких public/private widgets, отсутствие чтений и маркера в denied states, reset на principal/expiry/403.
- [x] Host public component path не даёт serialization/hydration/import errors; shared query cache и subscriptions сохраняются.

#### Manual verification

- [x] Blog, обе category pages, обычная и protected article работают EN/RU; все связанные widgets и товары сохранены. Публичный URL той же статьи не обходит защиту private association.

## Phase 5: повторяемый SDK cutover данных

### Changes required

**Место:** расширить существующий `tools/runtime` cutover образец отдельным поддерживаемым Framework flow с prepare/apply/verify/rollback и tests рядом с аналогичными `*-widget-links` инструментами. Manifest содержит API origin, exact IDs, before/after, orderIndex и фактические IDs созданных records; локальный manifest защищён от случайного commit секретов/содержимого. Runtime не ищет глобально по variant/slug.

1. Проверить incoming links для каждого изменяемого экземпляра. Framework Page `23cdc964-5944-4114-92ea-021ac1669e1d`, hero WB `4e55875f-1298-4544-a61d-19af05367bef`, Host link `55678efe-2151-4be0-82f3-db29774b1402` и CRM link `2ac1155e-f1b1-421d-9962-7d6e70d3d5e6` служат точными local inputs. Другой deployment передаёт собственные проверенные IDs.
2. Hero/его Slider `7c58565e-095e-449c-b517-74640f2daa9d` и три Slide IDs остаются на исходном графе. Для контакта создать отдельный WB frame `content-feature-find-row` без hero Slider; title/description берутся из текущих localized Form fields. Перепривязать точный CRM presentation link `2ac1155e-f1b1-421d-9962-7d6e70d3d5e6` к этому frame; не менять исходный hero variant/links. Form `744eb654-aac3-4aac-af93-f9fb5e290b23`, Step и остальные поля сохраняются. CRM Widget `d947bcab-0873-40a5-8c91-66ec59c54c3b` связывается с новым RBAC Widget через точную Widget→CRM relation; собственная RBAC→WB relation указывает на тот же contact frame. RBAC читает Form через CRM relation без второго CRM presentation wrapper. Host contact external association переключается на RBAC Widget, старая сохраняется hidden по текущему cutover паттерну.
3. Сохранить активные Host→RBAC commerce links `e2514b33-0bd3-43e3-960e-9ddec897d66c`, `8aa94724-435a-4bfa-a0e6-6c786686e820`, `46ccc1f4-7973-4fe2-beb8-dbe1b28ada45` и их точные presentation links из research. Уже hidden legacy Ecommerce associations не активировать повторно.
4. Для demo Article `5ade2625-007e-4c90-86bd-989a33e534fa` и link `992b28da-d5a7-4e9a-a0f4-350e0c73cee3` выполнить private closure prepare. Если Widget `6580e777-393d-4255-94b9-58f3607ce465` или его новые зависимости shared — fork только private копию и bytes, затем relink. Добавить `subscription` связь на конкретный существующий тестовый subscription Product с подтверждённой role/payment/interval конфигурацией; exact ID — явный manifest input. Отдельные test Subjects/orders/потомки создаются поддерживаемым SDK fixture flow; новые record IDs не вшиваются в runtime.
5. Перед дальнейшими writes legacy subscription Orders заморозить прежний действующий период: startsAt = прежний `updatedAt`, endsAt = прежний `updatedAt + interval`, invoiceId = проверенный последний paid invoice этого owned Order. Только delivering/requested_cancelation, корректные product/Role/currency и paid invoice; OPEN invoice не участвует. Backfill SDK вызывает operator-only RBAC freeze operation, которая принимает точные Subject/Order IDs и ожидаемый before, вычисляет timestamps на сервере и условно записывает их только при пустых period fields; произвольные client timestamps не принимаются. Это сохраняет существующую длину/конец периода. Неоднозначный/неоплаченный legacy grant остаётся без entitlement и попадает в отчёт для исправления данных. Зафиксированные fields не перезаписываются повтором backfill.
6. Guard code и schema должны быть активны до private mark. После fork/entitlement/backfill применить `private` marker, проверить raw endpoints, затем revalidate затронутые Host tags/страницы и удалить старые ответы из обоих legacy/consistency response caches штатным targeted flow. Нельзя повторно отдавать ранее публичный private marker из ISR или CDN/browser cache.
7. Apply сверяет before перед каждым update и readback после; неизвестный create result восстанавливает фактический ID по manifest selector. Повтор не создаёт дубликаты. Rollback восстанавливает только свои точные связи в обратном порядке и отказывается затирать concurrent edits. Additive records остаются для восстановления; private marker/byte guard не снимается ради rollback визуала. Удаление private data требует отдельной проверенной безопасной операции.

### Success criteria

#### Automated verification

- [x] Cutover tests покрывают shared hero, повторный apply, неизвестный create result, partial failure, concurrent edit и rollback; исходный hero/Slider/Form/inputs/orderIndex не меняются.
- [x] Backfill повторяем, не продлевает срок и не принимает unpaid/mismatched ownership; private mark не проходит без изолированного графа/managed bytes/entitlement requirement.

#### Manual verification

- [x] Локальный SDK cutover выполнен и readback сохранён. После повторного запуска нет duplicate sections или новых лишних records; rollback/reapply проверены на тестовом manifest.

## Phase 6: сквозная проверка и независимое принятие

### Automated verification

- [x] `npx tsc -p apps/studio/tsconfig.json --noEmit` и `bun test --timeout 30000 tools/studio/design-system` сохраняют Studio baseline; `npm run studio:validate` проверяет используемые manifests.
- [x] Затронутые `@sps/rbac`, `@sps/ecommerce`, `@sps/blog`, `@sps/crm`, `@sps/website-builder`, `@sps/file-storage`, shared API и `api` suites запущены целевыми `jest:test`/`jest:integration`; выбор конкретных suites фиксируется в progress по изменённым областям. Тесты новых сервисов и реальной API chain обязательны.
- [x] `bun test tools/runtime` либо целевые cutover test files проходят; `npm run check:module-dependencies`, `node tools/agents/code-placement.mjs`, релевантный lint/typecheck проходят без новых findings.
- [x] `npm run host:build` и запуск собранного Host проверяют RSC/ISR boundary; запросы затронутых маршрутов не дают cookie-in-ISR, serialization, hydration или server/client import errors. Baseline failures фиксируются отдельно с доказательством исходной ревизии, не объявляются успешной проверкой.

### Manual verification

- [x] Сравнить Studio reference и runtime на desktop и ширине 320 px: Framework/галерея, product catalog/detail/category, CRM, Blog/category/article/private states. Проверить long text/attributes, несколько файлов, пустые зависимости, keyboard/focus/touch, одинаковую горизонтальную направляющую.
- [x] EN/RU, deep links, 404, пагинация/фильтры где существуют; quantity/currency/cart CRUD/quick checkout и реальный CRM Request подтверждены доступным локальным/test backend.
- [x] Access matrix пройдена для anonymous, guest, signed-in без подписки, active, expired, revoked, чужого Product/аккаунта. Проверены Article→Widget и все descendants list/count/byID, File metadata, byte GET/HEAD, unfiltered/encoded/OR попытки, HTML/RSC и сериализованные props.
- [x] В обоих настоящих cache режимах получить HIT контрольного public response; protected families проверять как A, anonymous, B и nonpaying guest с исключением cache lookup/write. Подтвердить paid guest entitlement, revoke/proceed/renewal/deadline через actual API/PostgreSQL и client identity/deadline cleanup через React/SDK tests. Denied responses и DOM не содержат private marker/bytes; public и guest-own-account работают. Billing/proceed используют dummy/test flow без реальных списаний.
- [x] Разрешённый подписчик видит весь protected graph и управляемые media, а не только Widget title. После revoke/expiry readers и Blob URLs закрываются.

## Testing strategy

Проверки выбираются по поведению: реальный reader path для frontend contracts, сервисные tests для entitlement/time/idempotency и API integration через настоящее middleware/cache ordering. Временные cases используют управляемый clock, а byte cases — отдельные управляемые файлы с синтетическим маркером. Scoped tests не используют реальные внешние платежи, письма или чужие данные.

Browser evidence сохраняет route, язык, Subject state, viewport и фактическую проверенную операцию. HTTP 200, dev Ready, снимок без действий и вызов одного guard не заменяют проверку SSR, checkout, CRM и доступа.

## Performance considerations

Scope строится по private associations и достижимым IDs затронутых resource families, с request-local memo и tracked lower reads. Нет сканирования произвольных несвязанных records, ограниченного первой страницей «всего графа», preset UUID списков или TTL-кэша прав. Фильтр сужает repository query до count/offset; одно и то же чтение не повторяется в visual views. Private responses не используют общий response cache; публичные части сохраняют свои query readers и существующую согласованность.

## Migration notes

Порядок развёртывания: additive Order schema → period writer/guards/SDK/frontend → legacy freeze и isolated graphs → private mark и visual graph cutover → targeted cache invalidation → access/browser matrix. Схема не удаляет старые поля. Визуальный rollback сохраняет серверную защиту уже marked private data; downgrade, который снова публично отдаёт такое содержимое, не является допустимым rollback.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-376.md`.
- Research и независимая проверка: `thoughts/shared/research/singlepagestartup/ISSUE-376.md`, `ISSUE-376-reviews.md`.
- Studio mapping: `thoughts/shared/research/singlepagestartup/2026-10-23-framework-storybook-implementation.md`.
- `.agents/contracts/engineering/{frontend-components,module-dependencies,code-placement}.md`; `.agents/workflows/design-to-implementation.md`.
- `libs/shared/frontend/client/api/README.md`, `libs/shared/frontend/client/store/README.md`, `libs/middlewares/src/lib/revalidation/README.md`.

<!-- Last synced at: 2026-10-22T22:18:54Z -->

## Cutover execution constraint

Framework apply/rollback выполняется в отдельном локальном CMS maintenance
window: другие CMS writers этого API origin остановлены до конца verify.
Generic PATCH требует полный writable record, поэтому проверка before/readback
обнаруживает наблюдаемые изменения, но не исключает запись редактора между GET
и PATCH. CLI требует явный `--exclusive-maintenance`. При работающих параллельно
CMS writers перенос требует conditional write capability; этот локальный запуск
не меняет общий CRUD-контракт.

## Runtime acceptance clarifications

- Entitlement не требует Identity: guest JWT со своим оплаченным subscription
  Order и свежими Product Roles имеет тот же доступ. Identity меняет только
  denied presentation. Real API matrix проверяет guest-paid A, signed-in B и
  guest без оплаты раздельно.
- Неизвестный slug сохраняет существующий Next streaming not-found: noindex и
  NEXT_HTTP_ERROR_FALLBACK;404. HTTP transport может вернуть 200 после начала
  потока. Буквальный HTTP 404 этим переносом не добавляется и не объявляется
  проверенным; итоговая not-found UI проверяется отдельно.
- Локальная Blog-конфигурация требует отсутствовавший roleless GET permission
  `/api/blog/widgets-to-categories`. Исправление — точечный операторский SDK
  create после проверки соседних публичных связей и отсутствия Role bindings.
  Snapshots, global permission bypass и публичное чтение чужих Subject не меняются.

## Implementation acceptance

Independent review-pr: PASS against 6a9be42bb6 (Website Builder 84087145cf,
backend 6d7e1f09c9, frontend cb4296b6f0, cutover 6a9be42bb6).
Подробные результаты и границы доказательств находятся в
ISSUE-376-implementation.md, ISSUE-376-browser.md и ISSUE-376-reviews.md.
Checkpoint marks относятся к этому распределённому набору browser,
React/SDK и actual API/PostgreSQL проверок с указанными ограничениями.
Финальный человеческий Code Review остаётся пользователю; PR/push/merge нет.

## Blog content and navigation follow-up

Source: direct user instruction in the current Codex conversation after the first Code Review handoff.

- Six complete EN/RU architecture articles cover Next.js, Hono and actual SPS patterns, with code, explanations and source references. Frontend, Backend and DevOps each contain two Articles.
- Article/Category views show actual covers, categories and editorial author associations. Generated covers use people in the Living Focus photographic style; original masters and square outpaint deliveries remain traceable.
- The eight selected old Articles are retired only after the new graph readback. The existing private Article retains its ID/slug/subscription/protected graph and receives a useful public article plus protected appendix.
- Whole-card Article/Category navigation preserves independent secondary links. Default navbar and Cart controls follow Studio styling while preserving saved runtime content and operations.
- Independent review-pr, exact SDK readback/repeat/fresh preparation, frozen Host build and bounded desktop/320 browser evidence pass before returning to human Code Review. PR/push/merge remain outside the task.

Implementation and acceptance: [ISSUE-376-blog-followup.md](../../research/singlepagestartup/ISSUE-376-blog-followup.md).
