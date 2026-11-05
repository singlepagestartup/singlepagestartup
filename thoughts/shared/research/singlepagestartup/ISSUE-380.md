---
date: 2026-10-28
researcher: Codex
repository: singlepagestartup
branch: codex/studio-linear-workflow
git_commit: aa780be0f99f78f5d25802d259059cb1b66f4cb0
topic: SEO сборки страниц
status: complete
---

# Исследование SEO сборки страниц

## Research question

Почему m2commerce.ru получает дубли метаданных и страниц, а отсутствующие адреса имеют неправильный статус; какие общие механизмы SPS отвечают за результат.

## Подтверждённое поведение production

Проверка 28.10.2026: Яндекс Вебмастер показывает 129 дублей title и description (91%). Общий title — «М2коммерц». Диагностика содержит две рекомендации: неправильный HTTP 404 (с 16.06.2026) и дубли страниц (с 05.07.2026). Сводка, обновления диагностики и экспорт отчётов временно ограничены на стороне Яндекса.

Публичные HTTP-ответы подтверждают:

| URL                                                       | Ответ                                                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/ru`                                                     | 200, title «М2коммерц», description «Центр доходной недвижимости», нет canonical, html lang и JSON-LD |
| `/ru/ecommerce/products/gab-na-kladovkah-skladno-s-nulya` | 200, те же метаданные, свой H1, нет canonical и JSON-LD                                               |
| `/sitemap.xml`                                            | 200, пустой urlset, namespace начинается с https вместо http                                          |
| `/robots.txt`                                             | Только User-agent и Sitemap                                                                           |
| `/ru/sps-seo-audit-missing-20261028`                      | 200, общий title, noindex; soft 404                                                                   |
| `/sps-seo-audit-missing-20261028.txt`                     | Переход на локализованный URL, затем 200 с noindex                                                    |

Production является downstream-проектом. Изменения этого checkout сами по себе не развёртывают m2commerce.ru.

## Код и причины

- `apps/host/app/[[...url]]/page.tsx:19` передаёт Next params в Metadata.generate, ожидающий url. `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:41` читает все metadata и выбирает primary, не используя url. Связи pages-to-metadata и контент сущностей не читаются. Canonical, robots, metadataBase отсутствуют; OG URL равен корню сайта. Сохранённые opengraph/twitter поля в основном игнорируются.
- Page имеет title/description/language и pages-to-metadata с orderIndex. Значения по умолчанию Page/Description не являются содержательным SEO. Article и Product имеют локализованные заголовки, описания, slug и отношения к File; File имеет alt. Product prices находятся в attributes/currency, отдельного Article.publishedAt нет.
- Page.findByUrl возвращает routeParams с полными именами маски, например blog.articles.slug. SDK доступен через публичный package entrypoint.
- `apps/host/app/sitemap.xml/route.ts:14` использует неправильный namespace; URL не экранируются, не локализуются и не дедуплицируются. Route и SDK `page/sdk/server/.../actions/urls.ts:60` скрывают ошибки пустым успешным ответом.
- `page/backend/app/api/src/lib/service/singlepage/index.ts:239` перечисляет все страницы, расширяя любые маски через привилегированный серверный read. Фильтрация нужна до перечисления, иначе личные сущности могут попасть в публичный endpoint /urls. Пагинация допускает недопустимые размеры.
- `page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:8` скрывает любой сбой API. Catch-all затем вызывает notFound. Root layout Suspense и app loading допускают начало ответа до определения отсутствия страницы.
- `libs/shared/ui/shadcn/src/lib/tiptap/index.tsx:390` не выводит rich text до создания клиентского editor. Валидный JSON статьи/товара отсутствует в SSR HTML.
- `file-storage/models/file/frontend/component/src/lib/singlepage/default/Component.tsx:59` передаёт пустой alt несмотря на поле в записи.
- `apps/host/app/layout.tsx:36` не задаёт html lang. JSON-LD в Host/Blog/Ecommerce отсутствует.

## Архитектура

Host выше Blog, Ecommerce и File Storage и может читать их SDK при построении метаданных. Чистые операции URL размещаются в существующих shared utils/routes; HTTP handlers остаются в apps/host/app. Разбивка generate.ts требует переноса в generate/index.ts без одноимённого файла рядом. Repository snapshots не изменяются.

## Исторический контекст

ISSUE-218 описывает иной контракт URL. В текущем SDK urls() преобразует backend string в массив сегментов; join() в sitemap сам по себе корректен. Префикс языка сейчас нужен и языку по умолчанию.

## Проверяемые требования

- Собственные метаданные статической страницы и конкретной Article/Product; явное редакторское переопределение, корректный fallback.
- Абсолютный canonical той же локали, без рекламных параметров; разные страницы пагинации не склеиваются.
- Clean-param только для известных параметров отслеживания. segment/intent/offer не считаются трекингом без проверки бизнес-логики.
- Sitemap содержит публичные конечные URL. Ошибка API возвращает 503, а не пустой 200. Не выдумывать lastmod и переводы.
- Неизвестный маршрут возвращает 404; сбой API остаётся ошибкой сервера. Служебные страницы получают noindex.
- Текст статьи присутствует в серверном HTML. JSON-LD экранирует символ < и описывает только фактические свойства.

## Источники

- [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js htmlLimitedBots](https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots)
- [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
- [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google Product](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- [Яндекс Clean-param](https://yandex.ru/support/webmaster/ru/robot-workings/clean-param)
- [Яндекс canonical](https://www.yandex.ru/support/webmaster/ru/robot-workings/canonical)
- [Яндекс дубли метаданных](https://www.yandex.ru/support/webmaster/ru/indexing-options/title-description-doubles)

## Ограничения

Нельзя подтвердить улучшение поисковых позиций или снятие предупреждений до развёртывания исправлений и повторного обхода. Доступность перевода нельзя выводить только из списка настроенных языков. Дата создания Article не является подтверждённой датой публикации. Базовая Product schema без offers/review/rating не обещает расширенный результат поиска.

## Дополнение для второй редакции плана

Проверено: 28.10.2026. Реализация остаётся незакоммиченным черновиком; новые договорённости описаны в плане, не в runtime-коде.

- Исходный `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts` присутствует в HEAD `aa780be0f99f78f5d25802d259059cb1b66f4cb0`. Его имя не является нововведением SEO-задачи. В рабочем дереве вместо этого файла находится неподтверждённый каталог `generate/`; его архитектура требует пересмотра.
- `libs/modules/host/models/metadata/backend/repository/database/src/lib/fields/singlepage.ts:8` содержит текстовые title, description, keywords, author, viewport и OG/Twitter-поля. Полей изображений нет. Связь `host/pages-to-metadata` существует, связи Metadata → File нет. Поля этой модели и связь с Page — основа редактируемого SEO.
- В `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:168` URL-маска разбирается на module, model и один field. JSON-пути и цепочки связей из новой редакции плана пока не поддерживаются; это предлагаемое расширение для метаданных. Текущий перебор записей при построении URL не подходит для вычисления одного title.
- Article, Product и Profile содержат локализованные поля. Их схемы находятся в `libs/modules/<module>/models/<model>/backend/repository/database/src/lib/fields/singlepage.ts`; у этих трёх моделей общего JSON-поля metadata пока нет.
- JSONB metadata уже есть у Social Thread (`.../social/models/thread/backend/repository/database/src/lib/fields/singlepage.ts:13`), Message (`.../social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:17`) и Knowledge Chunk (`.../knowledge/models/chunk/backend/repository/database/src/lib/fields/singlepage.ts:26`). Их существующие назначения нельзя подменять SEO-контрактом.
- Инвентаризация `libs/modules/*/models/*/sdk/model/src/lib/index.ts`: 61 модель, у всех отсутствует hidden в списке variants. Для 94 связей hidden уже указан у 85; у 9 отсутствует. Это проверка объявлений, не доказательство работающего публичного скрытия. Например, `host/relations/pages-to-metadata/sdk/model/src/lib/index.ts:17` объявляет hidden, но перечень frontend-вариантов не содержит соответствующего обработчика.
- Шаблоны моделей и связей `tools/plugins/sps-generator-plugin/src/coder/root/libs/modules/[module]/{models/[model],relations/[relation]}/sdk/model/files/src/lib/index.ts.template:17` создают только default. Они тоже входят в изменение hidden, иначе новые сущности будут расходиться с контрактом.
- `social/relations/profiles-to-blog-module-articles/README.md` описывает связь many-to-many без ограничения единственного автора и без признака авторства. Автоматически считать любой связанный Profile автором нельзя.
- `blog/relations/articles-to-file-storage-module-files/README.md` и `ecommerce/relations/products-to-file-storage-module-files/README.md` описывают существующий образец связи с File: внешние ключи, variant и orderIndex. File.file — путь к файлу; File также содержит mimeType, width, height, alt. Для Metadata предлагается аналогичная настоящая связь.

Уточнённые внешние источники: [Яндекс о keywords и viewport](https://yandex.ru/support/webmaster/ru/controlling-robot/metatags), [Google об игнорировании meta keywords](https://developers.google.com/search/docs/crawling-indexing/special-tags), [Next.js viewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport), [автор статьи](https://developers.google.com/search/docs/appearance/structured-data/article#author-bp), [BlogPosting](https://schema.org/BlogPosting). План отделяет семантические ключевые слова контента от значения HTML meta keywords.

## Known Pitfalls (from implementation)

- Полная ESLint-проверка type graph требует более 4 GiB heap; изменённые файлы
  проверены с `NODE_OPTIONS=--max-old-space-size=8192`.
- Production webpack cache может занимать более 5 GiB. Для изолированной проверки
  использованы отдельный SPS_HOST_DIST_DIR, SPS_HOST_WEBPACK_CACHE=false и
  SPS_HOST_BUILD_CPUS=1. Чужие build-каталоги не удалялись.
- ISR fallback с request headers/session воспроизводит DYNAMIC_SERVER_USAGE только
  в собранном Host. Проверка dev или успешный build не доказывает HTTP 200/404.
