# ISSUE-376: браузерная проверка R2

## Область и результат

- Проверка: 2026-10-23, 21:38–21:47 UTC.
- Код: `codex/issue-376-framework-visual`, HEAD `922d823da6`; локальный Host в режиме разработки и текущие сохранённые данные API.
- Метод: независимый агент, `review-pr`, frontend contract; Chrome через `mcp__cua_repl`. Исходный код и данные агент не редактировал.
- Результат dev-прохода: перечисленные публичные сценарии проходят. Built Host и account flow приняты в следующем проходе ниже; исправление category cover имеет отдельный финальный замер.

## Ширина и восстановление браузера

Временный viewport — 320 × 900. При исходном масштабе Chrome 80% фактическая ширина составляла 400 CSS px. При масштабе 100% `window.innerWidth`, `document.documentElement.clientWidth` и `scrollWidth` равны **320**. Проверки ниже выполнены при этой фактической ширине.

После проверки viewport сброшен; ширина desktop составляла 1800 CSS px. Исходный масштаб 80% восстановлен и подтверждён через accessibility tree. Закрыта только вкладка агента `341503159`; пользовательские вкладки сохранены.

## Проверенные сценарии

| Сценарий                     | Наблюдаемый результат                                                                                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework EN/RU, 320 px      | Логотип ведёт на локализованный `/framework`; доступны корзина, вход и мобильное меню. Горизонтального переполнения нет.                                                                                                                                                                         |
| Мобильное меню EN/RU         | Открытие переводит фокус на первую ссылку; Escape закрывает меню и возвращает фокус на кнопку открытия.                                                                                                                                                                                          |
| Навигация и footer           | About, Blog, Products, Authors и AI Chat имеют реальные адреса. Прямого Chats в основном меню нет. Footer содержит Framework/Resources/Products и ссылки GitHub, Contact, AI Chat.                                                                                                               |
| Слайдер                      | Next slide меняет статус `1 of 3` на `2 of 3`; стрелки находятся в области слайдера.                                                                                                                                                                                                             |
| Pro                          | Видны 29 USD, 1900 RUB, период month. Раскрытие характеристик показывает `Tokens: 5000`. Доступны обе валюты и количество.                                                                                                                                                                       |
| Гостевая корзина             | Для Pro выбраны RUB и количество 2. Add to cart завершается; корзина показывает количество 2, суммы 58 USD / 3800 RUB, поле email и выбор провайдера. Только добавленный товар удалён; конечное состояние — `Your cart is empty.`                                                                |
| Выбор провайдера корзины     | Видны stripe, 0xprocessing, payselection, cloudpayments, dummy, paykeeper. Выбор dummy обновляет UI. Checkout не нажат.                                                                                                                                                                          |
| Покупка в один шаг           | Раскрываются валюта, количество, Payment method, Email for a bill, Comment и Continue to payment. Список содержит восемь провайдеров, включая payselection-international и tiptoppay. Continue to payment не нажат.                                                                              |
| CRM                          | Текущая форма содержит Name, Email и What you are interested in; сохранённый select показывает Option 1/2/3. Запрос формы не отправлялся.                                                                                                                                                        |
| About EN/RU                  | Отдельные hero, возможности, шесть архитектурных карточек, локальный запуск и завершающие ссылки. Страница описывает код проекта; список Blog на ней отсутствует. Ширина документа — 320 px.                                                                                                     |
| Blog EN/RU                   | Три категории Frontend/Backend/DevOps имеют обложки. Карточки статей содержат обложки, категории, даты и автора. Карточка Next.js открывается нажатием в область карточки, вне отдельного заголовка.                                                                                             |
| Статья Next.js EN            | Отображаются rich body и code block; пять Source code ссылок ведут на точные GitHub `blob/main` адреса. Длинные пути не расширяют страницу за 320 px.                                                                                                                                            |
| Authors EN/RU                | Публичная редакция отображает шесть статей и два проекта; карточка ведёт на UUID URL. EN portfolio содержит разделы Articles и Projects с соответствующими ссылками.                                                                                                                             |
| Закрытая статья EN/RU        | Гость видит subscriber gate и локализованную ссылку входа. После завершения загрузки отображается `Continue with a subscription` / `Продолжите с подпиской`. В DOM отсутствуют приватный marker `SPS-PRIVATE-DEMO-20261022` и ID скрытого Widget.                                                |
| Каталог EN/RU после data fix | Пять пакетов показывают числовые Tokens/Токены: 769.230769, 2307.692307, 3846.153846, 7692.307692, 23076.923076. `Topup —` для этих новых атрибутов отсутствует. Есть Pro, Landing page и Startup development. Free Tier, Telegram Bot и Store API-key section в публичном выводе не обнаружены. |
| Категория Design             | Landing page соответствует категории. На 320 px ширина документа 320; заголовок Products in this category расположен на внешней направляющей x=24. На desktop внешняя направляющая navbar/section x=292, внутренний текст hero x=332 с padding.                                                  |

Проверка корзины не подтверждает отсутствие новых служебных строк Order/Intent: обычный Add to cart мог сохранить пустую гостевую корзину после удаления товара. Проверен конечный UI, а не удаление всего созданного графа. Оплата, создание Invoice через Checkout и внешние уведомления не запускались.

## Наблюдения по визуалу и диагностике

- На странице Category есть отдельный heading `Category Overview`, затем тёмный hero и самостоятельная обложка шириной около 600 px. Это видно на desktop screenshot; функциональной поломки или горизонтального переполнения не обнаружено. Полное совпадение этой композиции со Storybook требует отдельного сравнения.
- В RU Blog заголовки сохранённых секций остаются `Categories` и `Popular Articles`, при этом категории и карточки локализованы. Это наблюдение о данных, а не вывод о дефекте locale reader.
- В полученных Chrome console logs нет записей уровня error. Есть предупреждения Next.js о `scroll-behavior: smooth` и LCP image priority. HTTP/network trace этой проверкой не собирался.

## Скриншоты

Локальные вспомогательные изображения:

- `/tmp/issue376-r2-framework-320-crop.jpg` — читаемый viewport Framework 320 × 900.
- `/tmp/issue376-r2-cart-320.jpg` — корзина с количеством 2 и выбранным dummy, до удаления товара.
- `/tmp/issue376-r2-private-gate-320.jpg` — EN subscriber gate.
- `/tmp/issue376-r2-catalog-ru-320.jpg` — RU каталог.
- `/tmp/issue376-r2-category-desktop.jpg` — desktop Category Design.

## Ограничения dev-прохода

1. Завершённая production build и тот же публичный путь на built Host.
2. Новая регистрация → один Social Profile и initial credit → account menu → Article create/retry → feed/author → logout/account switch.
3. Приватные данные после смены principal и warmed-cache поведение в браузере; гостевой gate выше не заменяет эти сценарии.
4. CRM submit с persisted Request и Form–Request relation; просмотр полей не подтверждает отправку.

Этот отчёт принимает только перечисленную браузерную область R2. Статус issue и итоговое принятие остаются у root и независимого final reviewer.

## Built Host: account → публикация → смена principal

- Проверка: 2026-10-23, 22:18–22:26 UTC.
- Среда: production Host на `localhost:3000`; реальный API на `localhost:4000` с временным fixture harness. По данным root harness заменяет только внешние уведомления тестовых заказов; этот агент API не изменял и данные напрямую не записывал.
- Аккаунты A/B — существующие локальные fixtures из private state. В браузере использован обычный Login. Регистрация, принятие Terms, смена пароля и сохранение credentials в браузере не выполнялись.

| Сценарий                    | Наблюдаемый результат                                                                                                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login A                     | Открывается AI Chat; account control показывает `3,000 tokens`. Framework показывает зарегистрированный аккаунт.                                                                                                                                                                                             |
| Меню нового автора          | Есть Create article, My chats, Settings и Sign out; ссылки на ещё отсутствующую публичную author page нет. Chats отсутствует в основной навигации.                                                                                                                                                           |
| Публикация                  | Через `/en/blog/new` заполнены Title, Summary, Article с heading/code block и Category Frontend. Author selector отсутствует. Publish article нажат один раз; форма временно disabled, затем открывается сохранённая Article.                                                                                |
| Сохранённая статья          | Title `ISSUE-376 browser acceptance: Next.js author boundary`, slug `article-2d3aafa7-82d2-46e5-8ed5-34b2b76da5e6`. URL: `/en/blog/articles/article-2d3aafa7-82d2-46e5-8ed5-34b2b76da5e6`. Видны введённые summary/body/code и Frontend. Byline ведёт на `/en/authors/fcbaf0d3-f784-49de-9d52-96c4e490ad8a`. |
| Author portfolio            | UUID URL открывается; показаны одна Article, ноль Projects и `No public projects yet.`. Отображается сохранённая тестовая статья.                                                                                                                                                                            |
| Global feed и меню          | После перехода в Blog присутствует одна карточка с тестовым заголовком. В account menu появляется My author page.                                                                                                                                                                                            |
| Unsaved draft A → logout    | Новый редактор содержит уникальные `PRIVATE DRAFT A`, `PRIVATE SUMMARY A ONLY`, `PRIVATE BODY A ONLY`. Sign out переводит на Framework; текст и профиль A отсутствуют. Гостевой `/blog/new` показывает Sign in gate.                                                                                         |
| Login B → редактор          | Все три поля Title/Summary/Article пустые; текст draft A и имя профиля A отсутствуют. Меню B показывает другой профиль, Create article/My chats/Settings/Sign out и не показывает My author page.                                                                                                            |
| B без подписки              | Закрытая Article содержит публичный текст руководства и отдельный `Continue with a subscription` / View subscription. Marker скрытого контента и ID приватного Widget в DOM отсутствуют.                                                                                                                     |
| Logout B → публичное чтение | Сохранённая тестовая Article доступна с публичным byline после выхода. Последний `/blog/new` показывает Sign in to publish an article; editor inputs отсутствуют.                                                                                                                                            |
| Console                     | В Chrome logs уровня error — пустой список для всего этого прохода.                                                                                                                                                                                                                                          |

Screenshot сохранён в `/tmp/issue376-r2-published-article-built.jpg`; на нём нет email/password fixtures. Тестовая Article подлежит cleanup root вместе с fixture graph; её URL и screenshot здесь служат свидетельством операции до удаления. HTTP idempotency/replay и точное число Profile/Free/Invoice подтверждаются отдельной проверкой root, а не этим браузерным отчётом.

Оба браузерных аккаунта имели Free, поэтому этот проход не подтверждает переход **granted subscriber → другой principal** с ранее показанным приватным содержимым. Подтверждены очистка неопубликованного draft и отказ в private content для аккаунта B.

### Исторический finding category cover

**Воспроизведено на built Host:** `/en/ecommerce/categories/design` содержит wrapper с классом `aspect-video`, но его computed `aspectRatio` равен `auto`. На desktop при viewport 2250 CSS px frame и изображение имеют размер 1216.015625 × 1216.015625; на фактических 320 CSS px — 272 × 272. Внешний document `scrollWidth` при этом равен viewport, горизонтального переполнения нет.

В этом built-варианте композиция с отношением 16:9 не обеспечивалась: квадратная обложка увеличивала высоту страницы. `overflow: hidden` и descendant `object-fit: cover` применялись, а aspect utility — нет. Финальная source-правка и её повторная браузерная проверка описаны ниже; этот агент source не менял.

- `/tmp/issue376-r2-category-built-desktop.jpg` — воспроизведение на desktop.
- `/tmp/issue376-r2-category-built-320.jpg` — воспроизведение при 320 px.

Временный viewport сброшен, исходный Chrome zoom 80% восстановлен и проверен через accessibility tree. Закрыта только вкладка агента `341503164`; последняя сессия приложения завершена обычным Sign out.

### Текущее состояние браузерного принятия

Публикация, видимость в feed/author, условная author-link в меню и очистка draft при нормальном logout/login проходят на built Host. Finding category cover закрыт финальной проверкой ниже. CRM submit и subscriber-to-other-principal disposal в этом проходе не проверялись; соответствующее принятие требует иных evidence.

## Финальная проверка category cover

- Проверка: 2026-10-23, 22:30–22:34 UTC.
- Среда: восстановленный dev Host с финальной source-правкой runtime/Studio. Новая production build для этих CSS-классов этим агентом не запускалась.
- Адрес: `/en/ecommerce/categories/design`, текущий сохранённый single-media пример.

| Измерение                                | Desktop                                                            | Mobile                                                    |
| ---------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| Фактическая ширина CSS viewport          | 2250                                                               | 320                                                       |
| `documentElement.scrollWidth`            | 2250                                                               | 320                                                       |
| Computed `aspectRatio` frame             | `16 / 9`                                                           | `16 / 9`                                                  |
| Ширина × высота frame                    | 1216.015625 × 684.00390625                                         | 272 × 153                                                 |
| Позиционирование непосредственного child | absolute; размер совпадает с frame                                 | absolute; размер совпадает с frame                        |
| Image и обрезка                          | `object-fit: cover`, высота 684.00390625, `overflow: hidden` frame | `object-fit: cover`, высота 153, `overflow: hidden` frame |

Обложка видима, занимает кадр с отношением 16:9 и обрезается в его скруглённых границах. Квадратный оригинал больше не увеличивает высоту frame. На mobile `innerWidth`, `clientWidth` и `scrollWidth` равны 320; горизонтального переполнения нет. **Исторический finding о квадратном cover закрыт.**

Финальные screenshots:

- `/tmp/issue376-final-category-desktop.jpg` — исправленный desktop cover.
- `/tmp/issue376-final-category-320.jpg` — исправленный cover при фактических 320 px.
- `/tmp/issue376-final-framework-desktop.jpg` — чистый Framework без fixture-account данных, viewport 1800 CSS px.

В Chrome error logs финального прохода — пустой список. Временный viewport сброшен, Chrome zoom 80% восстановлен и подтверждён; закрыта только вкладка агента `341503168`. Source, данные и DOM styles агент не изменял.

MultipleMedia и WithoutMedia этим агентом в браузере не открывались; новая сборка Storybook не запускалась. Их source/fixture evidence относится к отдельному ревью. Браузерный вывод здесь ограничен сохранённым single-media runtime примером и финальной проверкой его геометрии.
