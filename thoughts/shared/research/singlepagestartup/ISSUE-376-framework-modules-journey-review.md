# Framework journey: Studio Modules

Дата: 2026-10-24. Ветка: `codex/issue-376-framework-visual`.
Область: перенос проверенного Product в публичные Studio Modules и Host stories.
Production-компоненты, API и CMS cutover проверяются отдельно.

## Состав

- Framework: light hero, подготовка в AI Chat, возможности, модули, локальный
  запуск и копируемый запрос, пример изменения, статьи, передача в разработку,
  Free/MIT и FAQ. Галерея, продукты, checkout, CRM и категории остаются ниже
  в разделе примеров.
- Обзор 15 модулей и отдельные справочные страницы с точными README-ссылками.
- Шесть полных статей, Frontend/Backend/DevOps, обложки, автор, код, GitHub,
  оглавление, соседние статьи и рекурсивные supplied comments.
- Публичные Tokens: Free 3000 при регистрации, Pro 5000 в месяц за 29 USD или
  1900 RUB, пять пополнений по 0.13 RUB. Выбор пакета и действия — local preview.
- Header, footer и logo соединяют Framework, Modules, Blog, Tokens и AI Chat.
  Footer принимает явные link records вместо строк и не содержит пустых `#`.
- Аккаунтный top-up показывает один общий баланс. Панель передачи документа
  расположена один раз у RBAC-владельца всего документа, с именем Thread-export.
  Копируются инструкции; Markdown прикладывается отдельно, подтверждение текста
  не создаётся автоматически.

## Проверки

`npm run studio:presentation:test`: 401 PASS, 0 FAIL, 29993 assertions,
43 файла, 8.96 s. Один предыдущий sandbox-запуск не смог открыть временный
localhost-порт; повтор с разрешённым bind прошёл. Scoped TypeScript для Host
Framework/module/token/Blog/author, footer и Knowledge preview — PASS.

Браузерные проверки используют реально отрисованный iframe Storybook:

- Framework: Copy request, FAQ, 15 модулей и переход к RBAC README.
- Blog: шесть карточек; Backend оставляет две; клик по обложке открывает Hono;
  код и восемь GitHub-ссылок доступны; TOC переводит focus на нужный H2;
  автор открывает свою страницу с шестью статьями.
- Tokens: RUB показывает 1900 в месяц; пакет 1000 показывает 7692.307692.
  Аккаунтный quote показывает общий баланс и локальное подтверждение выбора.
- Документ: пустой текст отключает Copy; заполненный копирует инструкции с
  Products.md; одна панель, явное исключение несохранённых правок и предложений.
- При 320 CSS px Framework и Tokens имеют scrollWidth=clientWidth=320;
  меню работает, сломанных изображений нет. Временный viewport сброшен.
  В проверенных сценариях console errors отсутствуют.

Независимый reviewer применил `review-pr` к local diff. Закрыты: устаревшее
состояние Copy, неверная Tokens destination, отсутствующие author slots,
потерянные metadata/replies supplied comments, wrapper-only empty document,
неверный active navigation. Knowledge download использует native button,
сохраняя границу Knowledge → lower modules. Полный рабочий отчёт:
`/tmp/sps-framework-modules-source-review-b.md`.

## Ограничения

Supplied Studio данные не доказывают публикацию, оплату, зачисление токенов или
проверку production RSC. Runtime использует сохранённые записи и собственные
SDK readers; его независимое ревью и проверка остаются отдельным этапом.
Финальный Code Review принадлежит пользователю.
