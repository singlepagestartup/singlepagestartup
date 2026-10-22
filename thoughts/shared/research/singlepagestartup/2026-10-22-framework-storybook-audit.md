---
repository: singlepagestartup/singlepagestartup
date: 2026-10-22
branch: main
status: historical-audit
github_issue: https://github.com/singlepagestartup/singlepagestartup/issues/376
scope: framework-showcase-ecommerce-crm-blog
---

# Компоненты Framework и Storybook

Актуальные компоненты и ссылки: [реализация в Studio](./2026-10-23-framework-storybook-implementation.md).
Матрица ниже фиксирует исходные пробелы перед доработкой.

В Storybook есть галерея, блок описания, карточки и страница товара,
контактная форма, карточки статей, списки статей и страница статьи.
Не хватает публичных карточек и страниц категорий товаров и блога,
а также представления закрытых виджетов внутри статьи. Существующие
компоненты требуют дополнений, чтобы сохранить все отображаемые данные Framework.

Проверка охватывает `/en/framework`, товары, категории товаров, блог,
категории блога и статьи. Сопоставляются назначение компонента и данные,
которые он выводит. Числовые значения демонстрационных товаров не являются
критерием соответствия.

## Наличие и полнота данных

| Компонент Framework         | Дизайн в Storybook                                                                                   | Что покрыто                                                                                                                                                             | Чего не хватает для переноса                                                                                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Описание на главной         | Есть: Website Builder `content-default`, `content-hero`, `content-rich`                              | Счётчик, подзаголовок, заголовок, текст, изображение, действия                                                                                                          | В `content-default` описание выводится простым текстом; нет мест для связанных слайдеров и других вложенных блоков. Нужна композиция с форматированным текстом и связанными компонентами.                                                                                        |
| Галерея изображений         | Есть: Product `gallery`                                                                              | Несколько изображений, alt, миниатюры, стрелки, счётчик                                                                                                                 | Для слайдера Framework нужны заголовок слайда, ссылка и кнопки. Галерея принимает только `src` и `alt` для каждого изображения.                                                                                                                                                  |
| Карточка товара             | Есть: Product `card`                                                                                 | Заголовок и ссылка, изображение, краткое описание, произвольные характеристики, выбор валюты, количество, корзина, быстрый заказ с выбором оплаты, email и комментарием | Несколько категорий со ссылками и несколько связанных медиа. В составном каталоге ещё не передаются характеристики и настройки новой карточки.                                                                                                                                   |
| Страница товара             | Есть: Product `overview-default`, `overview-purchase`, `gallery` и Host page                         | Заголовок, текстовое описание, изображение, блок покупки, отдельная галерея                                                                                             | Произвольные характеристики, форматированное полное описание и категории со ссылками. Галерея внутри `overview-default` получает фиксированный пример, входных данных для изображений товара у композиции нет. Выбор валюты и быстрый заказ новой карточки здесь ещё не собраны. |
| Контактная форма            | Есть: CRM Form/Step/Input/Option `default`                                                           | Заголовок и описание формы, заголовок шага, текстовые поля, email, select и его опции, подписи, placeholder, обязательность, кнопка отправки                            | Для текущих видимых полей нового дизайна не требуется. Нужен пример с полями Name, Email и What you are interested in? из Framework.                                                                                                                                             |
| Карточка категории товаров  | Публичного дизайна нет                                                                               | Есть только `list`, `admin-v2-card`, `admin-v2-table`                                                                                                                   | Заголовок, форматированный подзаголовок, связанные виджеты, переход в категорию.                                                                                                                                                                                                 |
| Страница категории товаров  | Отдельной композиции нет                                                                             | Можно использовать существующий список товаров                                                                                                                          | Заголовок, описание секции, связанные медиа и виджеты, список товаров категории на одной странице.                                                                                                                                                                               |
| Карточка категории блога    | Публичного дизайна нет                                                                               | Есть чип фильтра `button-default` и служебные варианты                                                                                                                  | Заголовок, форматированный подзаголовок, переход в категорию.                                                                                                                                                                                                                    |
| Страница категории блога    | Отдельной композиции нет                                                                             | Можно использовать существующий список статей                                                                                                                           | Заголовок, форматированное описание категории, список её статей.                                                                                                                                                                                                                 |
| Карточки и списки статей    | Есть: Article `card`, `featured`, `row`; Widget `article-find-card-default`, `article-find-featured` | Заголовок, обложка, текст анонса, переход в статью; популярные и обычные публикации                                                                                     | У `card` анонс — простая строка, обложка одна. Framework выводит форматированный `subtitle` и связанные медиа. В `compact` анонс вообще скрыт.                                                                                                                                   |
| Страница статьи             | Есть: Article `cover`, `detail`, `overview-default` и Host page                                      | Заголовок, обложка, форматированный текст, связанные товары и статьи                                                                                                    | Нет места для произвольных связанных виджетов и их порядка, включая закрытый блок.                                                                                                                                                                                               |
| Закрытый виджет статьи      | Отдельного дизайна нет                                                                               | Есть обычное содержимое статьи и компоненты авторизации в других сценариях                                                                                              | Нужны состояния закрытого блока для гостя, пользователя без подписки и подписчика, с доступным действием для получения доступа.                                                                                                                                                  |
| Вся страница Framework      | Есть отдельные блоки и маркетинговая главная `root`                                                  | Оболочка сайта и основные секции                                                                                                                                        | Нет Storybook-примера с составом Framework: описание → слайдер → товары → контактная форма → категории.                                                                                                                                                                          |
| Заголовки и описания секций | Есть переиспользуемый `content-page-header`                                                          | Новый визуал заголовка, подзаголовка и описания                                                                                                                         | Списки товаров и статей не принимают заголовок и форматированное описание секции из Framework. У списка статей зафиксирован заголовок All articles. Нужна передача этих данных при сборке страниц.                                                                               |

## Что отсутствует и требует проработки

1. Публичная карточка категории товаров и её список.
2. Публичная карточка категории блога и её список.
3. Страница категории товаров с заголовком, описанием секции, медиа, виджетами и товарами.
4. Страница категории блога с заголовком, описанием и статьями.
5. Закрытый блок статьи с состояниями доступа и открытым содержимым подписчика.

Страницы категорий можно собрать из новых заголовков/карточек категорий
и существующих списков товаров и статей. Отдельный дизайн каждой части списка
не требуется.

Служебные `admin-v2-card` и `list` показывают записи для управления данными.
Публичные карточки категорий в разделах Framework ими не покрыты.

## Что дополнить в существующих компонентах

- **Галерея:** добавить данные заголовка, ссылки и действий слайда; оформить
  публичный вариант слайдера на основе существующего визуала.
- **Карточка товара:** добавить связанные категории со ссылками и представление
  нескольких медиа. Произвольные характеристики уже предусмотрены.
- **Каталог товаров:** передавать в новую карточку характеристики, варианты,
  валюты и способы оплаты. Это дополнение составного примера, а не новый дизайн карточки.
- **Страница товара:** добавить характеристики, форматированное описание,
  связанные категории и входные данные галереи; собрать уже существующие
  элементы выбора валюты и быстрого заказа.
- **Карточка статьи:** сохранить форматированный анонс и связанные медиа.
  Вариант `compact` не подходит для переноса карточки с видимым анонсом без дополнения.
- **Популярные статьи:** передавать массив публикаций в `article-find-featured`.
  Сейчас он принимает только количество и повторяет карточку с данными по умолчанию;
  дизайн самой карточки `featured` уже есть.
- **Статья:** добавить явные места для связанных публичных и закрытых виджетов,
  сохранив порядок блоков.
- **Заголовки секций:** сохранить заголовки и форматированные описания виджетов
  Framework при сборке списков. Готовый `content-page-header` можно переиспользовать
  для оформления заголовка.
- **Главная Framework:** собрать один пример из существующих и дополненных
  компонентов, чтобы проверить весь состав страницы.
- **Контактная форма:** добавить пример с текущей схемой Framework;
  имеющиеся типы полей её покрывают.

## Проверяемые исходники

| Что подтверждает вывод       | Studio                                                                                                                                                                                                                                                                                      | Текущий Framework                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Галерея / слайд              | [Gallery props](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/ecommerce/product/singlepage/gallery/interface.ts), [Gallery](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/ecommerce/product/singlepage/gallery/Component.tsx)                     | [Slide](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/website-builder/models/slide/frontend/component/src/lib/singlepage/default/Component.tsx)                                                                                                                                                                                   |
| Карточка товара и её каталог | [Card](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/ecommerce/product/singlepage/card/ClientComponent.tsx), [Catalog](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/ecommerce/widget/singlepage/product-find-card/Component.tsx)                 | [Product card](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/default/Component.tsx)                                                                                                                                                                                |
| Полная страница товара       | [Overview](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/ecommerce/product/singlepage/overview-default/Component.tsx), [Overview props](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/ecommerce/product/singlepage/overview-default/interface.ts) | [Product overview](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/overview-default/Component.tsx)                                                                                                                                                                   |
| Контактная форма             | [Form](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/crm/form/singlepage/default/Component.tsx), [Form data](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/crm/shared/demo-crm.ts)                                                                | Текущая форма на `/en/framework`, снимок 03                                                                                                                                                                                                                                                                                                     |
| Категории товаров            | [Category variants](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/ecommerce/category/variants.ts)                                                                                                                                                                      | [Category card](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/ecommerce/models/category/frontend/component/src/lib/singlepage/default/Component.tsx), [Category page](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/ecommerce/models/category/frontend/component/src/lib/singlepage/overview-default/Component.tsx) |
| Категории блога              | [Category variants](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/blog/category/variants.ts)                                                                                                                                                                           | [Category card](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/blog/models/category/frontend/component/src/lib/singlepage/default/Component.tsx), [Category page](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/blog/models/category/frontend/component/src/lib/singlepage/overview-default/Component.tsx)           |
| Статья и карточка            | [Card](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/blog/article/singlepage/card/Component.tsx), [Detail props](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/blog/article/singlepage/detail/interface.ts)                                       | [Article card](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/blog/models/article/frontend/component/src/lib/singlepage/default/Component.tsx)                                                                                                                                                                                     |
| Описание Framework           | [Content](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/website-builder/widget/singlepage/content-default/Component.tsx)                                                                                                                                               | [Content](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/Component.tsx)                                                                                                                                                                        |

## Истории для просмотра

- [Галерея](http://localhost:4321/?path=/story/modules-ecommerce-models-product-singlepage-gallery--default).
- [Карточка товара](http://localhost:4321/?path=/story/modules-ecommerce-models-product-singlepage-card--default).
- [Страница товара](http://localhost:4321/?path=/story/modules-host-models-page-singlepage-ecommerce-module-product-slug--default).
- [Контактная форма](http://localhost:4321/?path=/story/modules-crm-models-form-singlepage-default--default).
- [Карточка статьи](http://localhost:4321/?path=/story/modules-blog-models-article-singlepage-card--default).
- [Страница статьи](http://localhost:4321/?path=/story/modules-host-models-page-singlepage-blog-module-article-slug--default).

## Доказательства и границы проверки

Инвентаризация содержит 440 файлов `Component.stories.tsx`. Браузерная проверка
охватывает восемь маршрутов Framework и двенадцать историй Studio, включая
галерею. Полнота данных дополнительно проверена по входным параметрам и JSX:
наличие поля в типе само по себе не считается подтверждением его отображения.
Все 440 историй по отдельности в браузере не проверялись.

[Пакет снимков и наблюдений](/tmp/sps-framework-storybook-audit/evidence.md),
[снимок существующей галереи](/tmp/sps-framework-storybook-audit/27-studio-gallery.jpg).
Возможность вывести несколько медиа следует также из связанных компонентов
Framework; одна обложка Studio не покрывает этот контракт.

Демонстрационная статья с публичным и предполагаемым закрытым виджетом:
[Framework demo](http://localhost:3000/en/framework/blog/articles/framework-private-content-audit).
Её записи созданы в локальном API через SDK. Диагностика доступа сохранена в
`/tmp/sps-framework-storybook-audit/api-access-evidence.txt`; исправление доступа
относится к [issue #376](https://github.com/singlepagestartup/singlepagestartup/issues/376). В текущей проверке нужны дизайн закрытого блока
и сохранение связанного содержимого.

Перенос визуала и исправление доступа описаны в
[issue #376](https://github.com/singlepagestartup/singlepagestartup/issues/376).
Актуальная карта компонентов находится в документе реализации Studio.
