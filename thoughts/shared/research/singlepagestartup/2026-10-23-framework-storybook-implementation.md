---
repository: singlepagestartup/singlepagestartup
date: 2026-10-23
branch: main
status: studio-implemented-for-review
github_issue: https://github.com/singlepagestartup/singlepagestartup/issues/376
scope: framework-showcase-ecommerce-crm-blog
---

# Framework: визуал в Storybook и будущий перенос

Storybook содержит публичные карточки и страницы категорий товаров и блога,
закрытый блок статьи и составной пример Framework. Компоненты используют
существующие цвета, типографику, изображения и скругления Studio.

## Компоненты и примеры

| Часть             | Варианты                                                                                                    | Что можно проверить                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Категории товаров | Ecommerce Category `card`, `overview-default`; Widget `category-find-card`, `category-overview-default`     | Название, форматированный подзаголовок, изображение, счётчик, связанные блоки и переход; заголовок страницы, описание, медиа/виджеты и товары категории        |
| Категории блога   | Blog Category `card`, `overview-default`; Widget `category-find-card`, `category-overview-default`          | Карточка категории и страница с её описанием и статьями                                                                                                        |
| Товар             | Product `card`, `overview-default`, `overview-purchase`, `gallery`                                          | Произвольные характеристики, категории со ссылками, несколько изображений, форматированное описание, конфигурация, валюта, количество, корзина и быстрый заказ |
| Статья            | Article `card`, `detail`, `private-content-default`; Widget `article-overview-with-private-content-default` | Форматированный анонс, связанные изображения, порядок встроенных виджетов, публичный и закрытый блоки                                                          |
| Слайдер           | Website Builder Slide `default`, Slider `default`                                                           | Одна модель Slide; один Slider с несколькими связанными слайдами, их заголовками, ссылками, кнопками и навигацией                                              |
| Контактная форма  | CRM Form `default`, история `Framework`                                                                     | Name, Email, What you are interested in?, опции, обязательность и локальная проверка заполнения                                                                |
| Главная Framework | Host Page `framework`                                                                                       | Описание → слайдер → товары → контактная форма → категории                                                                                                     |

## Сетка и навигация

Страницы категорий используют одну ширину и один горизонтальный отступ.
Списки товаров и статей получают `embedded`, поэтому их заголовки, фильтры
и карточки стоят на направляющей блока категории и описания. Карточки категорий
используют отступ 20 px, заголовок 20 px и описание 14 px.

В Framework используется существующая контактная секция Website Builder
`content-feature-find-row`. В её slot передана RBAC Subject
`me-crm-module-form-default` с CRM Form `default` и схемой `frameworkContactForm`.
Это та же композиция, что на главной Studio; поля формы остаются в CRM.

Slider имеет три режима: стрелки на слайде, цифры под слайдом или точки под
слайдом. Режимы не дублируют друг друга. Стрелки видны при наведении и фокусе,
а на сенсорных устройствах — постоянно. Отдельный видимый счётчик убран;
позиция слайда доступна screen reader. Галерея товара сохраняет миниатюры,
а стрелки расположены на изображении.

## Модели, коллекции и загрузки

Модель показывает одну сущность. Её зависимости могут быть множественными:
изображения товара, поля формы, комментарии статьи. Публичную коллекцию
собирает доменный Widget.

48 автоматически созданных вариантов `list` удалены из моделей. Генератор
создаёт такие списки только для Widgets. Специализированные административные
таблицы и формы сохраняют своё назначение.

Product, Article и Category имеют загрузку одной карточки. Их Widgets
собирают загрузку сетки из нескольких экземпляров загрузки модели. Истории
`Loading` доступны у `product-find-card`, `article-find-card-default`,
`article-find-featured` и обоих `category-find-card`.

## Icons

Иконки — существующая библиотека Phosphor через публичный Shared Icon.
Новые блоки используют `lock-key` (🔒), `check-circle` (✓), `arrow-left` (←)
и `arrow-right` (→). Точные глифы доступны в
[коллекции Phosphor](http://localhost:4321/?path=/story/modules-shared-icon-singlepage-phosphor--collection).
Новых файлов изображений и иконок нет.

## Ссылки для проверки

- [Framework](http://localhost:4321/?path=/story/modules-host-models-page-singlepage-framework--default).
- [Слайдер со стрелками](http://localhost:4321/?path=/story/modules-website-builder-models-slider-singlepage-default--arrows), [с цифрами](http://localhost:4321/?path=/story/modules-website-builder-models-slider-singlepage-default--numbers), [с точками](http://localhost:4321/?path=/story/modules-website-builder-models-slider-singlepage-default--dots).
- [Категории товаров](http://localhost:4321/?path=/story/modules-ecommerce-models-widget-singlepage-category-find-card--default).
- [Страница категории товаров](http://localhost:4321/?path=/story/modules-host-models-page-singlepage-ecommerce-module-category-slug--default).
- [Категории блога](http://localhost:4321/?path=/story/modules-blog-models-widget-singlepage-category-find-card--default).
- [Страница категории блога](http://localhost:4321/?path=/story/modules-host-models-page-singlepage-blog-module-category-slug--default).
- [Карточка товара со связанными данными](http://localhost:4321/?path=/story/modules-ecommerce-models-product-singlepage-card--related-data).
- [Карточка статьи с форматированным анонсом](http://localhost:4321/?path=/story/modules-blog-models-article-singlepage-card--framework).
- [Закрытый блок статьи](http://localhost:4321/?path=/story/modules-blog-models-article-singlepage-private-content-default--default).
- [Статья для подписчика](http://localhost:4321/?path=/story/modules-blog-models-widget-singlepage-article-overview-with-private-content-default--subscriber).
- [Загрузка одной модели](http://localhost:4321/?path=/story/modules-ecommerce-models-product-singlepage-loading--loading).
- [Загрузка сетки виджета](http://localhost:4321/?path=/story/modules-ecommerce-models-widget-singlepage-product-find-card--loading).

## Проверки

TypeScript Studio и валидация манифестов проходят. Набор проверок
`tools/studio/design-system` содержит 142 успешных теста без ошибок. Он проверяет
контракты моделей и регистраций,
отсутствие циклов публичных импортов, изоляцию Studio, генератор каталога,
метаданные блоков/страниц и загрузки. Отдельные тесты проверяют сохранение
связанных данных и отсутствие содержимого закрытого блока во всех состояниях,
кроме `granted`.

Браузерная проверка включает составную страницу Framework, обе категории,
статью с открытым содержимым подписчика, все состояния закрытого блока,
переключение слайдера, выбор валюты и быстрый заказ на странице товара.
Мобильный предпросмотр использует ширину 320 px. Снимки находятся в
`/tmp/sps-storybook-refinements/`.

## Указания для Core issue

Перенос и исправление доступа описаны в [issue #376](https://github.com/singlepagestartup/singlepagestartup/issues/376),
статус — Research Needed. Локальная постановка:
[ISSUE-376](../../tickets/singlepagestartup/ISSUE-376.md).

1. Перенести оформление в владельцев production-компонентов и Host-композиций.
   Production не импортирует Studio, его fixtures или runtime assets.
   Изображения публикуются через принятые runtime/file-storage потоки.
2. Сохранить текущие записи и связи. Заголовки, форматированный текст, медиа,
   категории, характеристики, валюты и варианты оплаты передаются из SDK,
   а не из демонстрационных объектов Studio.
3. Собирать публичные списки товаров, категорий и статей в доменных Widgets.
   Модели и их загрузки представляют одну сущность. Widget владеет загрузкой
   сетки и состояниями пустого результата, ошибки и обновления данных.
4. Сохранить разделение доменных операций и Website Builder presentation:
   SDK, текущий Subject, формы, мутации и доступ принадлежат доменному Widget;
   presentation получает явные данные и готовые JSX slots.
   Связи используют точные ID и существующие default renderers.
5. Перенести полный набор данных товара и его действия во все места показа:
   каталог, категория, страница товара и связанные товары. Контактная форма
   использует текущую схему CRM и реальную операцию Request.
6. Сохранить порядок связанных виджетов статьи. Исправить доступ к закрытым
   данным на сервере: гость, пользователь без подписки и пользователь с истёкшей
   подпиской не получают их через API, HTML/RSC или общий кэш. Подписчик получает
   разрешённое содержимое. Проверить изменение доступа после обновления подписки.
7. Проверить маршруты Framework, товаров, категорий и блога, EN/RU, мобильную
   раскладку, клавиатуру, фокус и состояния загрузки/ошибки/пустого результата.

Исправление API-доступа к закрытым виджетам входит в issue #376.
Storybook показывает состояния доступа на локальных данных. Прежняя локальная
демо-статья и диагностика описаны в
[аудите](./2026-10-22-framework-storybook-audit.md).
