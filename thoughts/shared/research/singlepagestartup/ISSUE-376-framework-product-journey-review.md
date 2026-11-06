# Framework и AI Chat: проверка Product

Дата: 2026-10-24. Ветка: `codex/issue-376-framework-visual`.
Область: Workspace → 40 Products, оба продукта, Website → Layout.
Это техническая приёмка Product-прототипа; перенос в Modules и runtime остаётся
следующим этапом. Подтверждения владельческих документов не изменены.

## Состав

Framework содержит лендинг, обзор 15 модулей, страницу модуля, блог,
категорию, статью и публичный каталог токенов. AI Chat содержит отдельный
макет месячного Pro и контекстный переход к разработке из документа.
Оба продукта независимы от Studio Modules и производственных SDK.
Тексты находятся в парных Markdown, изображения — в существующем реестре assets.

Шесть статей содержат категории Frontend, Backend и DevOps, автора, обложку,
дату, архитектурное объяснение, код и ссылки на конкретные исходники GitHub.
Их объём с метаданными: 823, 830, 841, 876, 844 и 854 слова соответственно.
Даты — данные макета, а не утверждение о публикации runtime.

## Независимый review

Reviewer применил `review-pr` к локальному Product diff от `3d0b1fbda0`.
Три замечания P2 закрыты повторным чтением исправленных исходников:

1. Общая шапка/футер и секции Modules читают авторский Markdown. Изменения
   источника отражаются в Layout; добавлены проверки фактического React render.
2. Pro ведёт к отдельной месячной оферте с выбранной валютой, 5000 токенами
   и ценой 29 USD либо 1900 RUB. Локальный preview показывает расчёт без заказа,
   оплаты или активации подписки.
3. Дата статьи сохранена в карточке, detail и featured card через `<time>`;
   parser проверяет календарную дату всех шести источников.

Новых подтверждённых дефектов в исправлениях reviewer не обнаружил. Его исходный
отчёт: `/tmp/sps-framework-product-source-review-b.md`. Проверки ниже выполнены
основным агентом отдельно от source review.

## Браузерные результаты

- Обычные ссылки Framework → AI Chat → Framework выбирают нужную страницу
  Product и режим Layout, сохраняют query/hash. Логотип AI Chat ведёт на `/`.
- Поиск блога показывает пустой результат; Backend оставляет две статьи.
  Нажатие на изображение карточки открывает статью Hono. В ней есть обложка,
  автор, категория, дата, код и восемь ссылок на GitHub. TOC переводит фокус
  в нужный раздел. README модуля RBAC открывается по точной ссылке.
- Все модули показывают 15 записей; Business — пять. Известный модуль имеет
  отдельную страницу. Некорректный slug имеет явное состояние отсутствия.
- Переключение USD/RUB работает видимой меткой и клавиатурой. Выбранная RUB
  передаётся в Pro. Пакет 1000 RUB показывает 7692.307692 токена в каталоге.
  Account preview показывает один общий баланс, выбранный пакет и итог.
- FAQ раскрывается, Copy request показывает успех. Copy development request
  копирует инструкции с именем файла без тела документа; пустой документ
  блокирует действие. Изменение текста сбрасывает старое сообщение об успехе.
- Экспорт `.md` создал проверенный локальный файл с публичным тестовым текстом:
  `/Users/rogwild/Downloads/Products (2).md`, 99 bytes,
  SHA256 `d1a658e622e352ba0cb8ca839692ab10ffcff552e376c7190bb2af0c333acb7b`.
  Копия: `/tmp/sps-framework-product-export.md`. Событие download инструменту
  не пришло; наличие и содержание файла проверены отдельно.
- При 320 CSS px глобальные innerWidth/clientWidth/scrollWidth равны 320.
  Framework, Blog и Tokens не переполняют canvas; вкладки документа скроллятся
  внутри собственного контейнера. Есть native screenshot собственной QA-вкладки.
  Временные viewport overrides сброшены, отдельные Chrome QA-вкладки закрыты.
- В проверенном проходе нет browser error logs и завершённых сломанных картинок.

Снимки: `/tmp/sps-framework-journey-landing.jpg`,
`/tmp/sps-framework-journey-workflow.jpg`, `/tmp/sps-framework-product-pro.jpg`,
`/tmp/sps-framework-product-mobile-native.png`. Автоматические screenshots при
emulation имели неверное масштабирование и не использованы как визуальное доказательство.

## Автоматические проверки

- `npm run studio:presentation:test`: **397 pass, 0 fail**, 29147 assertions,
  42 файла, 10.12 s. Лог: `/tmp/sps-framework-journey-accepted-tests.log`.
- Scoped TypeScript Framework, Product navigation, Pro, Source document и
  token checkout: **PASS**, Node cap 1536 MiB. Конфигурация:
  `/tmp/sps-framework-journey-tsconfig.json`; лог:
  `/tmp/sps-framework-journey-types-final.log`.
- GitHub reconciliation: все 47 pending commits разобраны, после сверки
  `status=clean`, `pending=[]`. Ledger сохранён в владельческих документах.
- Pre-development pipeline: 28 pass, 4 approval gaps, 0 structural gaps,
  0 decision gaps, 0 legacy gaps. Курсор остаётся `00-business / blocked / brief`;
  изменённые Brief, Strategy, Brand и Design не подтверждены автоматически.

## Ограничения переноса

Product не создаёт backend заказов и не подтверждает платежи. Выбор публичного
пополнения локален: destination не получает выбранную сумму; это объяснено
рядом с действием. Документ Product не имеет accepted-version flag, поэтому
проверка и экспорт текущего текста явно остаются за человеком. Реальный Knowledge
accepted-version flow нужно сохранить в runtime.

В runtime пока нет отдельного маршрута Product token checkout. Перенос должен
использовать существующий RBAC catalog/checkout либо добавить настоящий маршрут
в его владельце. `/framework` — сохранённая generic Page; новые блоки должны
подключаться через точные Widget associations и SDK data-management flow.
Нельзя переносить макет прямым импортом Product или подменять доменные Widgets
статическими данными. Старые runtime тесты #376 не подтверждают новый лендинг.
