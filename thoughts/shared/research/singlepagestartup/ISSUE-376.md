---
date: 2026-10-23T01:12:58+03:00
researcher: flakecode
git_commit: 710ae5329d5b42b1577f4b3e3b175301b33916f2
branch: codex/issue-376-framework-visual
repository: singlepagestartup
topic: "Перенос визуала Storybook в Framework и серверный доступ к закрытым виджетам"
tags: [research, codebase, framework, storybook, ecommerce, crm, blog, rbac]
status: complete
last_updated: 2026-10-23
last_updated_by: flakecode
---

# Research: Framework, Storybook и закрытые виджеты

**Issue**: https://github.com/singlepagestartup/singlepagestartup/issues/376
**Researcher**: flakecode
**Branch**: `codex/issue-376-framework-visual`
**Repository**: `singlepagestartup/singlepagestartup`

**Visual baseline**: commit `652cabd9bf6cedbb578e26254c7bb887ace73bf8` содержит подготовленные Studio-варианты. Его parent/base — `aa780be0f99f78f5d25802d259059cb1b66f4cb0`. Runtime source проверен отдельно. Предшествующее исправление guest-own-Subject read и consistency cache сохранено в commit `710ae5329d`; исправление поиска Project item — в `375b370333`. Эти изменения не являются новой реализацией визуала или закрытого контента issue #376.

## Research question

Какие production-компоненты, записи, связи и операции формируют Framework и связанные страницы; каким вариантам Storybook они соответствуют; как сейчас выдаются закрытые виджеты и проверяется подписка?

Исследование использует ticket, process log, аудит от 22 октября и карту реализации Studio от 23 октября. Сведения о runtime-владельцах проверены по коду. Публичный граф локального API проверен чтением `http://localhost:4000/api` без Authorization и операторского ключа. Этот граф относится к текущей локальной базе и отличается от repository snapshots.

## Summary

Framework собирается из сохранённых Host Page, Layout, Widget и связей. Production Page-варианта `framework` сейчас нет: этот вариант существует в Studio. Runtime Host использует Page `default` и публичные реестры доменных Widgets.

Визуальное представление товара находится в Ecommerce, а текущий Subject, корзина и быстрый checkout — в RBAC. Каталог уже использует RBAC Widget с точной связью на Website Builder presentation. Категория товара использует другой RBAC Widget: он показывает карточку и корзину по Store, но не монтирует быстрый checkout. Blog использует собственные Widgets; Host передаёт им явные URL-значения и слоты для RBAC-операций.

Контактная форма работает с реальной CRM-схемой и создаёт Request через Subject SDK. Её Website Builder запись сейчас совпадает с записью hero Framework. Это объясняет повтор hero и слайдера в контактном разделе. Новый контактный пример Studio использует отдельную композицию `content-feature-find-row`, но его демонстрационные поля не являются источником runtime-схемы.

Состояния закрытого блока Studio проверяют presentation. Сервер сейчас выдаёт содержимое демонстрационного закрытого Widget анонимно через прямой GET, list и count; route-level permission не проверяет право на конкретную статью. В схеме нет явного признака приватности и связи с требуемым subscription product. Эти семантические решения относятся к плану.

## Runtime → Studio

| Часть                      | Текущий runtime owner / variant                                                                                                              | Визуальный reference Studio                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Оболочка Framework         | Host Page `default`, Layout, сохранённые Widgets                                                                                             | Host Page `framework`, существующая website Layout                                                                          |
| Описание и gallery         | WB Widget `content-default`, Slider/Slide `default`                                                                                          | WB Widget `content-default`, Slider/Slide `default`                                                                         |
| Карточка и страница товара | Ecommerce Product `default`/`overview-default` + RBAC Subject `me-ecommerce-module-product-card-default`/`overview-default`                  | Product `card`, `overview-default`, `overview-purchase`, `gallery`                                                          |
| Каталог / категория товара | RBAC Widget `subject-me-ecommerce-module-product-list-default` / `subject-me-ecommerce-module-category-overview-default`; Ecommerce Category | Ecommerce Widget `product-find-card`, `category-find-card`, `category-overview-default`; Category `card`/`overview-default` |
| CRM                        | Host CRM bridge + RBAC Subject `me-crm-module-form-request-create` + динамические CRM поля                                                   | WB `content-feature-find-row` + JSX form slot; CRM Form `default` история Framework                                         |
| Blog категории и выдача    | Blog Widget `category-list-default`, `category-overview-default`, `article-list-default`                                                     | Blog Widget `category-find-card`, `category-overview-default`, `article-find-card-default`, `article-find-featured`         |
| Карточка / статья          | Blog Article `default`/`overview-default`, Articles→Files/Widgets                                                                            | Article `card`, `detail`, `overview-default` с media и widgets slots                                                        |
| Закрытая статья            | Blog Widget `article-overview-with-private-content-default` + RBAC private-content control                                                   | Article `private-content-default`, Widget `article-overview-with-private-content-default`                                   |
| Загрузка                   | Shared reader loading/Provider; текущие collection views                                                                                     | Один model loading; Widget skeleton grid                                                                                    |

## Detailed findings

### 1. Host, URL и текущий граф страницы

`apps/host/app/[[...url]]/page.tsx:8` задаёт `revalidate = 86400`, динамические параметры и PPR. Страница отделяет язык от URL на строках 30–38, ищет сохранённую Page через `find-by-url` на строке 48 и передаёт загруженную запись выбранному варианту через `dataSource="props"`. Отсутствующая Page приводит к 404.

`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:21` загружает связи Page→Layout. Связи Page→Widget читаются на строке 71; layout slots `default` и `additional` — на строке 114. Поэтому внешняя оболочка, навигация и порядок секций принадлежат сохранённому графу, а не статическому составу Studio.

Host bridge в `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/Component.tsx:8` читает карту через Page `url-segment-values`. Внутри callback он выбирает `ecommerce.products.slug`, `ecommerce.categories.slug`, `ecommerce.stores.slug` и передаёт их как явные props в RBAC Widget. Blog bridge делает то же для `blog.articles.slug` и `blog.categories.slug` в `.../default/blog/Component.tsx:9`; его `renderPrivateContent` и `renderProduct` находятся на строках 41 и 49.

Локальные сохранённые Page имеют `variant="default"`:

| URL без языкового префикса                          | Page ID                                | Функциональный Widget                                                                                |
| --------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/framework`                                        | `23cdc964-5944-4114-92ea-021ac1669e1d` | Описание → каталог → CRM → категории, см. таблицу ниже                                               |
| `/ecommerce/products/[ecommerce.products.slug]`     | `3e94a4e8-c990-47de-ad29-b90dce99082b` | RBAC `e49dfbc1-d6e4-46c8-b1a9-e3ca369f662d`, `subject-me-ecommerce-module-product-overview-default`  |
| `/ecommerce/categories/[ecommerce.categories.slug]` | `ad34d520-a87d-4543-8106-8e18683be712` | RBAC `f64779cb-9c0b-4784-958e-4f2a7e9536ee`, `subject-me-ecommerce-module-category-overview-default` |
| `/blog`                                             | `1a2ff3a8-9e00-4f86-a660-61dd0a747bdf` | Blog категории, популярные и обычные статьи                                                          |
| `/blog/categories/[blog.categories.slug]`           | `dc0bf05e-ab62-44b4-9f67-0b95c068e2eb` | Blog `b5151035-f297-406c-b1d0-7aa215bbd921`, `category-overview-default`                             |
| `/blog/articles/[blog.articles.slug]`               | `b235c9ec-3e78-4a3f-915e-e371110ee1be` | Blog `0ae98073-ca04-43dd-a16a-23f1f15561e7`, `article-overview-default`; затем связанные товары      |
| `/framework/blog/articles/[blog.articles.slug]`     | `1e10dfab-62ff-4dfe-980f-af821914affc` | Blog `5be6bc1d-a608-4b79-aa57-af88b9a9bcd3`, `article-overview-with-private-content-default`         |

Порядок Framework подтверждён через `host/pages-to-widgets` и `host/widgets-to-external-widgets`:

| orderIndex | Host Widget                            | Внешняя запись                                                                                                                                                                            |
| ---------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0          | `04024071-3b33-41ec-9837-c493ec0d2a7c` | Website Builder `4e55875f-1298-4544-a61d-19af05367bef`, `content-default`                                                                                                                 |
| 1          | `b7043b22-8004-47d1-a6d7-3a30cfe658dc` | RBAC `49cd582a-5ab2-4916-9660-801bf9064df0`, `subject-me-ecommerce-module-product-list-default`; старая Ecommerce frame `707df7d2-c6d2-42a8-937a-7a9d418b850d` сохранена в связи `hidden` |
| 2          | `b86c1653-1ae3-4d30-9a41-e7126cedb0fe` | CRM `d947bcab-0873-40a5-8c91-66ec59c54c3b`, `form-list-default`                                                                                                                           |
| 4          | `9be68bba-41ef-4558-9a83-79c1b2218de0` | Ecommerce `6b47aa01-1d1b-4cd3-ba34-4de9c2ade6af`, `category-list-default`                                                                                                                 |

На страницах товара и его категории тоже сохранены старые Ecommerce связи с `variant="hidden"`, а активные RBAC связи используют `default`. Это предусмотренное состояние data cutover, а не дублирование активного UI. Ecommerce `product-list-default`, `product-overview-default`, `category-overview-default` представляют frame с `props.children`; сами эти варианты не собирают функциональный список. Snapshot-граф отражает старые Ecommerce ссылки. Активные RBAC ссылки проверены в текущем локальном API, поэтому snapshot нельзя считать полной копией работающей базы.

Точные активные Host→RBAC link IDs: каталог — `e2514b33-0bd3-43e3-960e-9ddec897d66c`, товар — `8aa94724-435a-4bfa-a0e6-6c786686e820`, категория — `46ccc1f4-7973-4fe2-beb8-dbe1b28ada45`. Соответствующие RBAC→presentation пары: каталог `f4950bf1-fb22-435d-81fc-2f0588ed5ea8` → WB `41edd264-24a5-48a8-9d06-5fd5d65c0dfa`; товар `86ce95bd-2494-483a-8405-ea0e2a66304f` → WB `817f32d7-5863-47a3-8e65-098ce160e5ac`; категория `169766d9-9c27-43c2-a6ee-642a2108bb1b` → WB `35df96ff-641b-46ca-a367-9e7fe055e722`. Все три WB используют `content-ecommerce-default`.

### 2. Товар, атрибуты, валюта и операции

`libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/default/Component.tsx:19` строит локализованный URL товара. На строке 42 читаются связанные медиа, на строке 77 выводится shortDescription, на строке 82 — все Products→Attributes. Для каждого атрибута читаются его AttributeKey и тип поля. Внешняя композиция передаёт `topSlot`, `middleSlot`, `bottomSlot` и children, поэтому категории, профиль продавца и действия не принадлежат самому Ecommerce Product.

`.../product/singlepage/overview-default/Component.tsx:28` читает все медиа товара. Атрибуты находятся на строке 64, форматированное описание TipTap — на строке 156. Полная страница использует те же слоты, что карточка.

`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/Component.tsx:12` оборачивает Ecommerce Product `default`. Категории и Social Profile передаются в слоты на строках 18 и 28, а уже загруженный Subject передаётся в cart и checkout с `dataSource="props"` на строках 43–54. Соседний `me/.../overview-default` использует тот же набор операций с Product `overview-default`. Таким образом, перенос карточки без Subject-композиции потерял бы функциональность.

`libs/modules/rbac/models/widget/frontend/component/src/lib/singlepage/subject-me-ecommerce-module-product-list-default/Component.tsx:15` читает связь Widget→Website Builder по точному `widgetId`, ожидает одну запись и использует её default renderer. Его `Content.tsx:6` читает продукты, создаёт сетку и монтирует каждый `me-ecommerce-module-product-card-default` с `isServer={false}`. Это существующая граница публичного server-чтения каталога и браузерной сессии пользователя.

Категория `.../subject-me-ecommerce-module-category-overview-default/Content.tsx:35` показывает Category `overview-default`, читает Categories→Products по `categoryId` на строке 49 и Stores→Products на строке 93. В ней Product `default` получает только `me-ecommerce-module-product-cart-default` на строке 146. Быстрый checkout и дополнительные слоты карточки каталога здесь сейчас не монтируются. Ticket требует их доступность во всех применимых местах показа.

Корзина `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.tsx:18` читает Subject orders с `includeCartDetails`, отбирает строки по productId и при наличии storeId по магазину. Существующий заказ получает update, delete и checkout; отсутствие подходящего заказа открывает create. Создание использует `api.ecommerceModuleOrderCreate`, передаёт quantity, productId, storeId и billingModule.currency.id. Доступные валюты происходят из price AttributeKeys и связей Attributes→Billing Currencies, а не из демонстрационного списка.

Быстрый checkout в `.../ecommerce-module/product/checkout-default/ClientComponent.tsx:13` содержит текущий набор providers: `stripe`, `0xprocessing`, `payselection`, `payselection-international`, `tiptoppay`, `cloudpayments`, `dummy`, `paykeeper`. Схема на строке 24 включает provider, email, quantity, comment, необязательный storeId и currencyId. `api.ecommerceModuleProductCheckout` вызывается на строке 71; после ответа браузер переходит на `billingModule.invoices[0].paymentUrl` на строке 77. Платёжная сумма в UI читается через Product `price-default`, доступные валюты — через `currency-toggle-group-default`.

Studio Product card описывает presentation-входы `media`, `categories`, `attributes`, `options`, `prices`, `paymentMethods` и callbacks `onAddToCart`/`onCheckout` в `apps/studio/modules/ecommerce/product/singlepage/card/interface.ts:69`. Эти формы описывают визуальный пример. Текущие runtime payloads выше не содержат `optionValues` из Studio, поэтому демонстрационная конфигурация не доказывает наличие соответствующей серверной операции. Существующие данные и payloads отделены от локального расчёта цены в Storybook.

### 3. Категории и коллекции

Ecommerce Category `default` выводит название, TipTap subtitle и связанные WB widgets с `variant="default"`. `overview-default` читает category media и WB widgets с `variant="overview"`, затем отображает children. Это разные наборы связанных блоков; их сохранение нельзя заменить одним статическим описанием.

Blog Category `default` содержит название, subtitle и локализованный переход. `libs/modules/blog/models/category/frontend/component/src/lib/singlepage/overview-default/Component.tsx:30` выводит description и на строке 37 читает Categories→Articles с точным categoryId. Blog Widget `category-overview-default/Content.tsx` ищет Category по переданному categorySlug. Категорийный Widget не получает карту routeParams.

В Studio есть обе Category `card`/`overview-default`, коллекционные Widgets `category-find-card`, `category-overview-default` и Host страницы категорий. Коллекции товара и статьи поддерживают `embedded`, чтобы вложенная сетка не добавляла второй контейнер. Карточки категорий используют padding 20 px, heading 20 px и description 14 px; это текущий локальный визуал из предыдущей проверки.

### 4. CRM: схема, Request и общее presentation

Текущий Host CRM bridge находится в `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/crm/widget/singlepage/form/list/default/Component.tsx`. Он читает точные Widgets→Website Builder и Widgets→Forms, загружает Form, затем передаёт `me-crm-module-form-request-create` как children (строки 77 и 176). Возможны обе ветви: форма без внешнего presentation и форма внутри сохранённого WB Widget.

Локальная CRM Widget `d947bcab-0873-40a5-8c91-66ec59c54c3b` связана с Form `744eb654-aac3-4aac-af93-f9fb5e290b23` и Step `23c082d8-336d-45e3-9f76-244bd54e6258`. Её WB link `2ac1155e-f1b1-421d-9962-7d6e70d3d5e6` указывает на hero `4e55875f-1298-4544-a61d-19af05367bef`. Эта же hero-запись связана со Slider `7c58565e-095e-449c-b517-74640f2daa9d`. Общее использование записи подтверждено API, а не предположено по одинаковому внешнему виду.

`me/.../crm-module/form/request-create/ClientComponent.tsx:7` получает текущий Subject через `authentication-me-default`. `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/crm-module/form/request/create/ClientComponent.tsx:13` владеет React Hook Form, submissionId, состояниями pending, saved, notificationStatus и ошибки. На строке 28 вызывается существующий SDK `api.crmModuleFromRequestCreate` с Subject id, Form id и `toRequestSubmission`. Повторная отправка защищена submitting ref и тем же submissionId. Сохранение Request и подтверждённая доставка уведомления отображаются раздельно.

Этот runtime-контрол использует CRM Form `support-ai-chat` как динамический renderer полей. `libs/modules/crm/models/form/frontend/component/src/lib/singlepage/support-ai-chat/ClientComponent.tsx:15` отключает fieldset на pending, читает Forms→Steps и передаёт form и путь `steps.<stepId>.` вниз. Следовательно, фиксированный набор полей Studio не заменяет реальный schema-driven renderer.

Studio Framework в `apps/studio/modules/host/page/singlepage/framework/Component.tsx:51` использует WB `content-feature-find-row` и контактный JSX slot. Его RBAC presentation-литерал `me-crm-module-form-default` отличается от runtime-операции `me-crm-module-form-request-create`; это не два имени одной зарегистрированной production-операции.

### 5. Blog, статьи и вложенные widgets

Blog Widget `article/list/default/Component.tsx:34` читает Widgets→Articles по widgetId. Если связи существуют, рендерит связанные записи; если их нет, использует общий Article `find`. Локальные Popular Articles и Articles — отдельные Widget IDs (`eab2ae6f-1b5f-491d-9f95-4c5ba2499e23` и `a8e1cca9-22f3-4579-a508-ab9ad848440a`) с одинаковым литералом `article-list-default`. Отличие секций определяется их экземплярами и связями.

`libs/modules/blog/models/article/frontend/component/src/lib/singlepage/default/Component.tsx:46` читает все Articles→Files и на строке 77 выводит форматированный subtitle. `overview-default/Component.tsx:32` выводит description, затем на строке 35 читает Articles→Website Builder Widgets. Замена на один excerpt или одну обложку потеряла бы эти данные.

Widget `article/overview/with-private-content-default/Content.tsx:27` выбирает Article по slug, рендерит Article `overview-with-private-content-default`, внутри публичную Article `default`, затем `renderPrivateContent`. Слот доступа приходит из Host Blog bridge и исполняется в RBAC; Blog не импортирует RBAC.

Studio Article card допускает `excerptContent` и массив media (`apps/studio/modules/blog/article/singlepage/card/interface.ts:12`). Detail допускает `widgets?: ReactNode` (`.../detail/interface.ts:53`). Его демонстрационные author/comments/readTime/relatedArticles не доказывают, что эти поля присутствуют в текущем Blog API. Research фиксирует сохранение существующих связанных сущностей, а не перенос искусственных авторов, комментариев или товаров из fixtures.

### 6. Описание, слайды и медиа

`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/Component.tsx:25` выводит subtitle/title/description, затем Widgets→ButtonsArrays, children, Widgets→Files, Widgets→Sliders и Widgets→Features. Это несколько независимых зависимостей, а не одна картинка hero.

`libs/modules/website-builder/models/slider/frontend/component/src/lib/singlepage/default/Component.tsx:7` читает Sliders→Slides по sliderId и передаёт уже отрендеренные relation nodes в ClientComponent. `ClientComponent.tsx:40` использует общий Embla Carousel с loop; на строках 61–71 находятся две невидимые кликабельные зоны prev/next. Slide `default/Component.tsx:19` читает связанные Files, выводит title на строке 54 и ButtonsArrays на строке 58; заданный Slide URL оборачивает всё содержимое в локализованный Link.

Studio Slider имеет единственный параметр navigation: `arrows`, `numbers` или `dots` (`apps/studio/modules/website-builder/slider/singlepage/default/interface.ts:2`). `ClientComponent.tsx:47` реализует ArrowLeft/ArrowRight/Home/End, исключая текстовые поля. Стрелки находятся на слайде и показываются при hover/focus или на touch (строка 78); numbers и dots являются отдельными режимами (строка 100); позиция доступна через sr-only status (строка 127). Product gallery сохраняет отдельные thumbnails.

Текущий gallery Slider `7c58565e-095e-449c-b517-74640f2daa9d` связан с hero через link `e2e661ec-a0ed-4a12-86d6-41413d4825be`. Его слайды: order 0 — `7b354fd7-3a21-4fc6-a213-b4f6a1e01208`, order 1 — `b8cac576-7912-4bc7-9673-b7aff23458d8`, order 2 — `ff4031b2-4e1d-4b69-8090-e6263b39c5a2`. Первые два имеют file relations на `4c24a312-c269-4428-bae6-e2bb87ef2046` и `0be2aef3-efa1-446f-ab4a-84368d6190b3`; у третьего file relation не найден. У hero нет прямого Widgets→Files.

Фактические byte paths первых двух слайдов: `/public/file-storage/static/a0325254.webp` и `/public/file-storage/static/5b03e8b0.webp`. `libs/modules/file-storage/models/file/frontend/component/src/lib/singlepage/default/Component.tsx:8` использует сохранённый внешний https URL либо `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`. Тот же renderer поддерживает image, video, audio и прочие файлы. Поэтому связанное медиа не ограничивается фотографиями и не заменяется Studio image path.

### 7. Существующий SDK data cutover

`tools/runtime/ecommerce-widget-links.ts:17` задаёт соответствие старых Ecommerce Widgets новым RBAC вариантам и `content-ecommerce-default`. `tools/runtime/module-widget-links.ts:35` принимает точные Host link ID и source Widget ID, готовит manifest с исходными records и операциями. На строке 179 сохраняется неактивная `hidden` связь со старым source Widget, затем активная связь переключается на RBAC. Это объясняет текущий live граф.

`tools/runtime/ai-chat-widget-links.ts:257` содержит существующий fork shared presentation: исходная WB запись сохраняется, создаётся отдельная запись с нужным вариантом, копируются Widgets→ButtonsArrays/Features/Files/Logotypes/Sliders вместе с variant/orderIndex, а потом меняется точная owning association. Проверенный hero имеет как минимум две входящие ссылки: Host external `55678efe-2151-4be0-82f3-db29774b1402` и CRM presentation `2ac1155e-f1b1-421d-9962-7d6e70d3d5e6`. Это фактическое shared использование; полная проверка входящих links при записи принадлежит data flow.

Тот же инструмент на строке 700 восстанавливает неизвестный результат create по selector и записывает фактический серверный ID в manifest. Apply выполняет readback и сравнивает before перед update. `rollbackWidgetCutover` на строке 739 восстанавливает прежние связи в обратном порядке, оставляет additive records и отказывается затирать concurrent edit. CLI использует SDK descriptor registry, `cache="no-store"`, явный API origin и защищённый manifest. Это имеющийся образец повторяемого переноса данных без редактирования snapshots.

## Доступ к закрытым виджетам

### 1. Повторная проверка текущей утечки

Анонимные GET-запросы к локальному API с `Cache-Control: no-store`, без Authorization, cookies и операторского ключа, дали следующие результаты:

| Чтение                                                       | Результат                                                                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Blog Article по slug `framework-private-content-audit`       | 200, Article `5ade2625-007e-4c90-86bd-989a33e534fa`                               |
| Article→WB Widgets по articleId                              | 200, link `992b28da-d5a7-4e9a-a0f4-350e0c73cee3`, `variant=default`, orderIndex 0 |
| WB Widget `6580e777-393d-4255-94b9-58f3607ce465` по ID       | 200, description содержит синтетический маркер `SPS-PRIVATE-DEMO-20261022`        |
| WB Widget list по тому же ID                                 | 200, одна запись с тем же маркером                                                |
| WB Widget count по тому же ID                                | 200, `data: 1`                                                                    |
| `authenticationIsAuthorized` для GET article→widget relation | 200, `{ok:true}`                                                                  |
| Article→Products демо-статьи                                 | 200, пустой массив                                                                |
| Demo Widget→Feature/Slider/ButtonsArray/File                 | 200, пустые массивы                                                               |

Демонстрация содержит только текст. Утечка её descendants или media bytes не подтверждалась этим примером, потому что соответствующих связей у него нет.

`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default/ClientComponent.tsx:11` проверяет GET маршрута связи целиком. На строках 22–48 после успешной проверки читаются все links по articleId. Это проверка permission на endpoint, без resource entitlement. `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:241` допускает roleless Permission для nonsensitive route. Его role-cache живёт 30 секунд; явная инвалидация находится на строке 42.

### 2. Схема и пути чтения

`libs/modules/blog/relations/articles-to-website-builder-module-widgets/backend/repository/database/src/lib/schema.ts:10` содержит IDs, variant, orderIndex и className. В Article и WB Widget также нет отдельного privacy/access field. `libs/modules/blog/relations/articles-to-ecommerce-module-products/backend/repository/database/src/lib/schema.ts:10` описывает связь для cross-promotion; текущий runtime не читает её как условие entitlement.

Demo Article и её Article→Widget link используют `default`. Приватная композиция выбирается другим Blog Widget на сохранённой Host Page. Публичный Article `overview-default/Component.tsx:35` читает те же associations без проверки доступа. Поэтому выбор приватного page template сейчас не является persisted classification защищённого содержимого.

Контроллеры и сервисы Blog Article→Widget и WB Widget — обычные `RESTController`/`CRUDService` (`.../backend/app/api/src/lib/controller/singlepage/index.ts:7` и `.../service/singlepage/index.ts:7` в каждом пакете). Shared handlers `libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts:24` и `count/index.ts:23` передают `c.var.parsedQuery`; соседний `find-by-id/index.ts:31` берёт UUID. В этих handlers нет Blog resource scope.

`libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:83` устанавливает parsedQuery. Repository `libs/shared/backend/api/src/lib/repository/database/index.ts:64` и `:129` применяет filters до pagination/count. QueryBuilder `libs/shared/backend/api/src/lib/query-builder/filters.ts:136` поддерживает filters.and, OR отвергается. Готовый нейтральный read-scope hook в этой цепочке не найден. Это описывает текущие точки расширения; способ ограничения запросов определяется планом.

### 3. Прямые записи, дочерние записи и bytes

`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:63` разрешает публичные GET list/count/byID Website Builder и File Storage models/relations. Защита только Article→Widget relation оставила бы прямое чтение Widget и его зависимостей.

Граф, который реально читает WB content-default: Widgets→ButtonsArrays/Files/Sliders/Features, затем Sliders→Slides, Slides→ButtonsArrays/Files, Features→ButtonsArrays/Files, ButtonsArrays→Buttons, Buttons→Files. Logotypes→Files также публичен. Схемы этих relations являются обычными foreign-key associations без атрибута приватности.

`apps/api/app.ts:81` регистрирует GET и HEAD `/public/*` до API authorization. Файл возвращается с диска без проверки entitlement. File metadata или relation ACL сами по себе не закрывают уже известный byte URL. FileStorage renderer строит локальные URL через `/public` или использует внешний https URL; внешний ресурс не приобретает защиту от фильтрации локальной metadata.

### 4. Текущая подписка, Roles и время

Действующая цепочка: Subject→SubjectsToOrders→Order→OrdersToProducts→Product и Product→RolesToEcommerceModuleProducts→Role. Subject получает Role через SubjectsToRoles; Role связан с permissions.

`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:1368` получает product role IDs. В paid-ветви на строке 623 Roles выдаются Subject; subscription получает `delivering` на строках 753–772. Delivering-ветвь восстанавливает отсутствующие Roles на строках 336–355. Canceling удаляет их на строках 357–387; delivered удаляет на строках 804–827, затем переход завершается на строке 922. Доверенный zero-price renewal находится на строке 951. В `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/fields/singlepage.ts:5` нет expiry, order или article.

`libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:308` проверяет `delivering` с первой связанной currency. Interval приходит из checkout attributes. Deadline равен `Order.updatedAt` плюс одна minute/hour/day/month/year или семь дней для week; используются JavaScript Date setters. Expired означает `now > deadline` (строки 319–364). Если нет invoice с `createdAt > deadline`, заказ переходит в delivered. Ветка на строках 409–423 проверяет дату invoice, но не его paid status. Для `requested_cancelation` тот же расчёт находится на строках 449–499, затем переход в canceling на строке 509.

Статический Role и `status=delivering` не доказывают текущее право по времени: `Order.updatedAt` изменяемый, а отзыв/истечение зависят от обработки заказа. Billing Invoice имеет createdAt, updatedAt, status и provider/payment fields, но не отдельный paidAt/settledAt/succeededAt (`libs/modules/billing/models/invoice/backend/repository/database/src/lib/fields/singlepage.ts:3`). Payment provider меняет status обычным update; Stripe renewal создаёт open invoice до оплаты (`libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts:453`). Из invoice.createdAt нельзя восстановить момент подтверждённой оплаты, а updatedAt тоже изменяемый. Выбор проверяемого entitlement clock относится к плану.

### 5. Текущий Subject, middleware и cache

`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.ts:68` создаёт гостевой Subject и JWT. `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/me.ts:18` определяет authenticated по связанной Identity. Гость имеет собственный Subject; его не следует приравнивать к отсутствию principal.

`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-read-access/index.ts:30` проверяет JWT, разрешает собственный id и делегирует чужой id в `isAuthorized`. Subject controller устанавливает guard на строках 253–256. Глобальный `controllerGuardedRoutes` допускает dispatch к guard и не делает произвольные Subjects публичными. Строгий `request-subject-is-owner` разрешает JWT owner или operator; Subject Order list на строках 37–63 использует этот pattern и фильтр subjectOrder links. `service/singlepage/ecommerce/order/access.ts` проверяет relation и line membership. Серверный SDK Order list (`sdk/server/src/lib/singlepage/ecommerce-module/order/list.ts:14`) использует typed props/results, credentials include и no-store.

Порядок `apps/api/app.ts`: global authorization на строке 247 → parse query на 253 → HTTP response cache на 255–264 → module controllers на 267–280. Следовательно, controller guard расположен после response cache и при cache hit может не исполняться. `controllerGuardedRoutes` уже используется для исключения собственных controller-scoped routes из consistency cache.

`libs/shared/backend/api/src/lib/mutation-effects/consistency.ts:289` обходит cache по no-store. Identity cache key учитывает method, URL, Authorization, Cookie, operator, locale и representation на строках 292–301. Legacy `libs/middlewares/src/lib/http-cache/index.ts:243` использует URL/query и route exclusions; его ключ не включает principal. Исключения для Subject families существуют, но classification Blog/WB private resources в них нет. Global IsAuthorized middleware кеширует успешный method/path/credentials на 30 секунд (`.../is-authorized/index.ts:84`), а query resource IDs не входят в ключ.

Это отдельные уровни: route permission cache, response cache, frontend query cache и реальное entitlement время. Frontend contract требует очищать закрытые данные при 401/403 или смене identity; обычный refetch сохраняет смонтированные данные. Проверка мгновенного expiry/revocation не следует из факта наличия этого contract.

### 6. Матрица проверки из ticket

Ticket охватывает anonymous, guest, non-subscriber, active, expired, revoked, чужую подписку и cross-account. Пути: Article→Widget list/count/byID; Widget list/count/byID; unfiltered и попытка OR widening; дочерние models/relations; File metadata и byte GET/HEAD; HTML/RSC и сериализованные props. Denied ответы не содержат защищённого маркера.

Отдельные сценарии — subscriber-warmed cache → anonymous/другой аккаунт, смена identity, подтверждение подписки, отзыв и истечение времени без дополнительной DB mutation. Проверка включает реальную middleware/cache цепочку; прямой вызов guard не доказывает защиту до cache hit. Публичный контент и guest own-account остаются доступны. В research выполнены только анонимные read probes; эта матрица ещё не является пройденным тестом реализации.

## Architecture documentation

`.agents/contracts/engineering/module-dependencies.md` задаёт порядок Host → RBAC → CRM → Blog → Ecommerce → Billing → Website Builder → File Storage. RBAC может компоновать commerce, CRM и access-контролы; lower modules не импортируют Subject или Host. Глобальный permission resolver имеет узкую роль авторизации и не получает доменную оркестрацию.

`.agents/contracts/engineering/frontend-components.md` описывает общую обвязку reader/Provider/Suspense, `dataSource="props"` для уже загруженной записи, literal interface и регистрацию в owning layer. В `libs/shared/frontend/components/src/lib/singlepage/default/index.tsx:39` props-режим сразу вызывает view без второй загрузки; на строке 56 обычный режим устанавливает ErrorBoundary, Suspense и Provider. Явные UI props и JSX slots ограничивают границу ClientComponent.

В текущем коде есть подтверждённый пример доменного Widget + default relation renderer + отдельный Website Builder frame — RBAC commerce Widgets. Контракт сохраняет точные IDs и association ordering; изменения графа выполняются поддерживаемым, повторяемым SDK-потоком. Repository snapshots читаются как исторические данные и не служат способом runtime/UI исправления.

Модель представляет одну сущность, Widget — коллекцию. Множественные media, атрибуты, поля формы и widgets внутри одной сущности остаются её зависимостями. В Studio 48 generic model list удалены; генератор `tools/studio/design-system/catalog.ts:600` создаёт такую публичную проекцию только для Widgets. `tools/studio/design-system/framework-components.test.tsx:15` фиксирует это различие, тест на строке 23 — одну модель loading против коллекционного skeleton.

Результаты API принадлежат общему React Query cache, realtime — `globalActionsStore`. Изменение presentation не меняет владельца SDK, session, mutation helpers или WebSocket invalidation. Контракт отдельно описывает отсутствие cookie-чтения в cached ISR fallback, очистку закрытых данных при 401/403 и сохранение отображения при обычном refetch.

## Code references

Ключевые ссылки с номерами строк приведены в тематических разделах. Основные точки следующей фазы:

- `libs/modules/rbac/models/widget/frontend/component/src/lib/singlepage/subject-me-ecommerce-module-product-list-default/Component.tsx:15` — точная связка функционального каталога и presentation.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/Component.tsx:12` — Product presentation и действующие Subject actions.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/crm-module/form/request/create/ClientComponent.tsx:28` — реальная отправка CRM Request.
- `libs/modules/blog/models/article/frontend/component/src/lib/singlepage/overview-default/Component.tsx:35` — связанные WB widgets статьи.
- `libs/modules/website-builder/models/slider/frontend/component/src/lib/singlepage/default/Component.tsx:7` — сохранённые слайды вместо Studio fixtures.
- `apps/studio/modules/host/page/singlepage/framework/Component.tsx:11` — визуальная композиция, которую рассматривает issue.

## Historical context

- [Ticket](../../tickets/singlepagestartup/ISSUE-376.md) содержит согласованные scope, критерии завершения и access matrix.
- [Process log](../../processes/singlepagestartup/ISSUE-376.md) фиксирует создание issue и ограничения GitHub helpers. Режим этапов: автономные research/plan/implementation с независимой review-проверкой между ними; финальный Code Review выполняет пользователь. PR не публикуется. Основание: прямой запрос пользователя в этой сессии.
- [Аудит от 22 октября](./2026-10-22-framework-storybook-audit.md) фиксирует исходный browser baseline и первоначальные пробелы Storybook. Его список отсутствующих визуальных компонентов исторический.
- [Карта Studio от 23 октября](./2026-10-23-framework-storybook-implementation.md) содержит актуальные варианты, Storybook IDs и предыдущие результаты browser/typecheck/142 Studio tests. Эти проверки не выдаются за выполненные в текущей research-фазе.

## Verification and limits

Эта фаза проверила source contracts и live локальный граф GET-запросами без изменения записей. Сетевой доступ к localhost из sandbox первоначально дал connection refused; то же чтение с разрешённым network escalation прошло. Диагностика не использовала операторский ключ и не выводила токены.

Значения локальных UUID позволяют повторить проверку в этой базе. Другой checkout или развёртывание может иметь иной граф: runtime-компоненты и связывающие SDK-потоки должны получать свои точные экземпляры. Локальный демонстрационный товар или цена не является эталоном визуального соответствия.

Браузерный screenshot-аудит и runtime checkout/CRM mutations в этой research-фазе не запускались. Исходный визуал доступен в Storybook; новый runtime ещё не реализован. Снимки `/tmp` из предыдущего аудита не являются опубликованным доказательством GitHub.

## Open questions

1. Какие точные связи и records создаст или перепривяжет поддерживаемый data-management flow, сохраняя shared hero и текущую Form? Текущий граф и owners установлены; операция записи относится к plan/implementation.
2. Persisted private classification, связь Article с требуемым subscription Product, entitlement clock и способ ограничения прямых/дочерних/byte-чтений являются решениями plan. Нынешняя схема и точные пути доступа исследованы; реализация этих правил ещё отсутствует.
3. Какие текущие данные дают выбираемую конфигурацию товара? В inspected cart/quick-checkout payloads есть quantity/store/currency, но нет Studio optionValues; это различие нельзя закрывать fixture-состоянием.

## Known Pitfalls (from implementation)

### Project list и точная membership

- **Occurrences**: 5
- **Stage**: Create / Research / Plan
- **Symptom**: Общий item-list не содержит существующий issue item.
- **Root Cause**: Различающиеся GitHub list и exact issue membership ответы; причина на стороне GitHub не установлена.
- **Fix**: Shared helper fallback читает repository.issue.projectItems с проверкой repository/Project/единственности item. Commit 375b370333.
- **Reusable Pattern**: Не создавать duplicate issue/item после частичного успеха; использовать exact membership и повторный status read.

### Nx worker и локальные соединения

- **Occurrences**: 2
- **Stage**: Implement
- **Symptom**: Nx worker зависает, localhost DB/HTTP недоступен из sandbox.
- **Root Cause**: Изоляция plugins и ограничение local sockets.
- **Fix**: NX_DAEMON=false NX_ISOLATE_PLUGINS=false; конкретный network operation с escalation.
- **Reusable Pattern**: Не менять приложение ради ограничений запуска; проверять фактический HTTP/DB результат.

### Холодный Host и invalidation churn

- **Occurrences**: 2
- **Stage**: Implement
- **Symptom**: Dev Ready не подтверждает готовую страницу во время edits.
- **Root Cause**: Существующий большой catch-all/Admin graph и повторные compile. Нового цикла или package dependency не найдено; одна задержка после compile остаётся без точной причины.
- **Fix**: Frozen production build в отдельном dist, start и HTTP/browser acceptance.
- **Reusable Pattern**: Для финальной проверки зафиксировать source, отделять Ready/compile от HTTP/RSC/UI, не проводить архитектурную переделку без доказательства.

### Missing Blog relation read policy

- **Occurrences**: 2
- **Stage**: Implement / browser acceptance
- **Symptom**: Blog index и Category дают 500 при новом saved relation reader.
- **Root Cause**: В исходной локальной конфигурации отсутствуют точные list GET permissions, хотя count и остальные Blog relations public.
- **Fix**: Operator SDK missing-only create для widgets-to-categories и categories-to-website-builder-module-widgets после Role binding/private isolation проверки; оба anonymous GET 200.
- **Reusable Pattern**: До browser acceptance проверить все 7 Blog relations list/count. Reproducible exact-path SDK prerequisite находится в tools/runtime/README.md; существующую role-bound policy не ослаблять.
