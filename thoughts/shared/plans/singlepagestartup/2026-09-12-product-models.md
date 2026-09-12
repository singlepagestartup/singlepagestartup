---
repository: singlepagestartup/singlepagestartup
status: implemented-and-verified
---

# Products and business models

Direct operator request: implement the Products redesign, retire standalone Business without losing content, and provide downstream migration. The existing lifecycle issue #222 is in Code Review; this work is an explicitly requested local revision, not an automatic phase/status transition. No GitHub status is changed.

## Page map

| Page                       | Reader task                                 | Authoritative content                                                                                                                                                                                                         | Model coverage                                                                   |
| -------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Brief                      | Agree on the request                        | Scope, confirmed product IDs, project goals, decision authority, global initial constraints                                                                                                                                   | Context, not a duplicate canvas                                                  |
| Product                    | Understand and evaluate the complete offer  | Identity/category/state/owner/boundaries; actors; jobs, pains, gains; segment-to-value mapping; alternatives; included/excluded work, result unit, usage and acceptance; support promise, rights; evidence and decision rules | Customer Segments, Value Propositions                                            |
| Operations & Economics     | Understand how the linked model can operate | Stable model identity and membership, per-product revenue terms, shared resources/activities/partners, costs and allocation, financing distinct from customer revenue, assumptions                                            | Revenue Streams, Key Resources, Key Activities, Key Partnerships, Cost Structure |
| Sales                      | Follow the complete customer process        | Owner, steps, actors, inputs, actions, transitions, handoffs, recovery, metrics and limits; links to authoritative commercial terms                                                                                           | Channels, Customer Relationships, operational Key Activities                     |
| Research                   | Assess evidence for model decisions         | Questions tied to model/product assumptions, method, observations, sources, limits, contradictions and implications                                                                                                           | Any aspect being tested; no copied findings                                      |
| Website                    | Review the complete visitor experience      | Pages, journeys, finished copy, forms, UI states, post-contact action, design application                                                                                                                                     | Derivative of Product, Model, Sales, Strategy, Brand and Design                  |
| Marketing Creative         | Review usable campaign materials            | Formats, messages, compositions, variants, assets and destinations                                                                                                                                                            | Derivative                                                                       |
| Presentation               | Review and export the product deck          | Product-owned data and React pages; existing PDF export                                                                                                                                                                       | Derivative                                                                       |
| Product Content (optional) | Read/use delivered product materials        | Product-defined lessons, episodes, documents, templates, files and nested media                                                                                                                                               | Delivered value; never advertising                                               |

Operations & Economics is one complete topic, shared through the catalog, not nine fragmented pages or a duplicate canvas overview. The owner map records canonical block coverage. Product navigation uses direct document tabs; it has no separate canvas-block menu. A model may serve several products; a catalog may hold multiple models. Model and product IDs are distinct. The framework's coupled free-framework/service model is explicitly a structural proposal, not an approved new commercial decision.

## Transfer map

| Previous source/field                      | Destination                                            | Preserved                                                                       | Deduplication                                                                            |
| ------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Business: project/product                  | Brief inventory + Product identity                     | IDs, roles, category, boundaries, source                                        | Brief lists scope; Product owns full definition                                          |
| Business: intended users/value             | Product Customer Segments / Value Propositions         | Five actors, circumstance, jobs/pains/gains, alternatives, value and exclusions | Remove repeated best-fit/category rows                                                   |
| Business: price/revenue/funding            | Model Revenue Streams / Funding                        | Free price, separate service possibilities, founder funding, uncertainty        | Product and Sales refer to these terms                                                   |
| Business: resources/capacity/routing       | Model resources/costs and Sales                        | Shared scope, owners, allocation, actual limits, handoffs and recovery          | Numeric limits stored once; process remains whole                                        |
| Business: authority/goals                  | Brief                                                  | Decision owner, request and goal                                                | No detailed models copied into Brief                                                     |
| Business: support/promises/license/success | Product Offer and usage / decision rules               | Best effort, rights, proof limits, success/adoption definitions                 | Sales describes execution, references promise                                            |
| Business: proof/materials                  | Owning Product/Research/Assets                         | Sources, observation dates, IDs, limitations                                    | No replacement Evidence register                                                         |
| Product Overview                           | Product                                                | All six topics, including identity/owner/acceptance outside named BMC blocks    | Canonical Customer Segments / Value Propositions headings; remove duplicate segmentation |
| Sales                                      | Sales                                                  | Full YAML process and extensions                                                | Do not split across BMC blocks                                                           |
| Research                                   | Research                                               | Coherent investigation and citations                                            | Reference decisions; don't restate results in every block                                |
| Website/Creative/Presentation/Content      | Same product sources; Content label clarified          | Nested Markdown, HTML, JSX/TSX, images, media and export                        | Facts remain owned by Product/Model/Sales; existing review graph flags impact            |
| Business approvals/dependency hashes       | Changed/unconfirmed sources + explicit stale consumers | Attributable source history and unresolved impact                               | Never recalculate approval or reviewed hashes during migration                           |

## Method and limitations

[Business Model Generation](https://www.strategyzer.com/library/business-model-generation) supplies the design method. [Business Model Canvas](https://www.strategyzer.com/library/the-business-model-canvas) describes one model and interdependent blocks, not one mandatory canvas per product. [Official nine-block explanation](https://www.strategyzer.com/business-models-the-toolkit-to-design-a-disruptive-company) supplies terminology. [Value Proposition Canvas](https://www.strategyzer.com/library/the-value-proposition-canvas) clarifies customer jobs, pains and gains within Product. The page grouping is our implementation choice; neither filled documents nor user confirmation demonstrate demand.

## Verification plan

Catalog scenarios: single product; shared model; separate models; empty startup inheritance; populated replacement with layer isolation; missing/cyclic references. Review graph: shared-model changes reach every dependent product and downstream material without approval renewal. Preserve nested/custom pages and Product Content; exercise presentation rendering/PDF and legacy routes. Validate actual framework sources and new intake (materials optional until their stage). Audit all former Business fields and references before deleting sources. Record exact outcomes and remaining limitations here.

## Реализация и проверка — 12 сентября 2026

Реализовано в основном фреймворке. Публикация, изменение статуса GitHub
и запуск миграции в дочерних репозиториях не выполнялись.
Инструкция переноса: `tools/studio/products/MIGRATION.md`.

### Изменения реализации

- Каталог v2 хранит стабильные ID моделей, их источники и связи продуктов.
  Пустой startup наследует каталог целиком; заполненный заменяет продукты и модели
  вместе. Отсутствующий источник/ID, выход за слой и циклы отклоняются.
- `catalog.ts` задаёт структуру каталога;
  `source.ts` загружает только источники выбранного слоя. Вложенные пользовательские
  страницы и практические материалы используют существующие загрузчики.
- `review.ts` регистрирует общую модель один раз как `model.<id>`, связывает её
  с Research, Product, Sales, практическими материалами и вложенными Markdown.
  Глобальный Strategy может сделать материалы другого продукта stale, если
  изменение влияет на общую стратегию; независимый Product не переписывается.
- Business удалён из активных источников, навигации, историй, индексов и обязательных
  результатов. Старые manager/iframe адреса переходят на модель в Products с той
  же проекцией. Начальный этап Brief сохранён.
- Канонический процесс создаёт первоначальные модели до Strategy. Business Analyst
  отвечает за Product/модели и целостные процессы. Заголовки Product и модели,
  зависимости, роли, критерии завершённости и продолжение старых курсоров обновлены.
- В собственном примере Code Framework и AI Chat сохранены оба продукта, включая
  AI Chat вне текущего эксперимента. Общие лимиты и финансирование перенесены в
  `models/framework-service/model.md`. Добавлен небольшой потребительский шаблон
  оценки фреймворка как пример Product Content.

### Технические результаты

`npm run studio:validate` прошёл: TypeScript, валидация обоих слоёв, self-check,
**103 теста в 14 файлах**, затем **5 тестов GitHub reconciliation**, ошибок нет.
Production-сборка Storybook прошла; остаются предупреждения стороннего
markdown-to-jsx о direct eval и размере выходного bundle. `git diff --check` прошёл.

| Сценарий                          | Проверка и результат                                                                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Новый проект с одним продуктом    | Тест принимает Product/model/Research/Sales intake до создания Website и Presentation. Пустой Sales допустим только как blocked с явными blockers.                                                                                                                                    |
| Несколько продуктов, общая модель | Тест: два продукта ссылаются на один источник. В Studio Code Framework и AI Chat показывают один `framework-service`.                                                                                                                                                                 |
| Разные модели проекта             | Тест: третий продукт использует отдельную модель без подмены её условий; отсутствующие и циклические ссылки отклоняются.                                                                                                                                                              |
| Пустой startup                    | Тест: default наследует весь singlepage. В браузере startup source честно показывает пустой каталог, default — унаследованные продукты и модель.                                                                                                                                      |
| Заполненный startup               | Тест: default содержит только startup-продукты и модели; ссылки на чужую модель и выходящие из слоя пути отклоняются.                                                                                                                                                                 |
| Заполненный прежний Business      | Содержательно разобран фактический Business основного фреймворка. Тест механической миграции сохраняет уникальные тексты, расширения и старые hashes; без назначения моделей не выполняется. Read-only CLI после переноса не находит оставшегося Business или продуктов без модели.   |
| Собственные вкладки и вложения    | Browser fixture: HTML landing с изображением и относительным переходом в nested page; JSX checkout меняет состояние на Plan selected; вложенный Markdown сохраняет собственный заголовок. Регрессия дополнительного Website без базового документа больше не создаёт пустой Overview. |
| Product Content                   | Реальный вложенный шаблон оценки Code Framework доступен; fixture Academy показывает курс и вложенный урок. Пользовательские названия вкладок сохранены.                                                                                                                              |
| Изменение общей модели            | Тест меняет содержимое модели и получает stale для обоих Product, Sales, Research и вложенных материалов. Метаданные подтверждения/просмотренные hashes не обновляются.                                                                                                               |
| Презентация и PDF                 | В браузере основная React-презентация отображает 13 страниц и завершает Prepare PDF появлением Download PDF; дополнительный React-документ отображает 2 страницы и также создаёт PDF для скачивания.                                                                                  |
| Прежние адреса                    | В браузере проверены manager `--singlepage` и прямой iframe `--default`: оба ведут на Products → Operations & Economics, сохраняют слой. Business отсутствует в боковой навигации.                                                                                                    |
| Удобство просмотра                | Проверены настольный вид и навигация на ширине 320 px: текст переносится, вкладки доступны горизонтальной прокруткой. Проверенный browser console не содержит ошибок приложения.                                                                                                      |

### Содержательная проверка

1. **Цельность:** Product описывает всё предложение; Operations & Economics —
   обеспечение и экономику связанной модели; Sales сохраняет все стадии и исключения;
   Research сохраняет связный материал исследования. Девять блоков не превратились
   в девять пустых вкладок.
2. **Один владелец:** числовые лимиты, выручка и финансирование находятся в модели;
   Product и Sales ссылаются на неё. Повторные Best-fit/category/alternatives убраны.
   Из AI Chat Product убран пересказ отказа/восстановления, уже принадлежащий Sales.
   Практические материалы остаются производными с проверкой зависимостей.
3. **Сохранность:** девять строк Business model, четыре общие ответственности,
   routing/control rules и promises/constraints сопоставлены с новыми владельцами.
   Сохранены нулевая цена и выручка фреймворка, финансирование основателем, отдельная
   экономика AI Chat, критерии successful use/adoption, GitHub/лицензионные условия,
   общий срок/время/бюджет и правила остатка субсидии, материалы/права/ограничения
   доказательств, best-effort support и launch unknowns. Сведения об инвентаре и
   SVG остаются у Product/Research/Assets; их повтор в Business не требуется.
4. **Полнота BMC/VPC:** Customer Segments и Value Propositions раскрыты в Product;
   Channels и Customer Relationships — в Sales; остальные пять блоков — в модели.
   Задачи, проблемы, выгоды и разные клиентские роли сохраняются в Product без
   отдельного повторяющего Value Proposition Canvas.
5. **Отсутствие формальных пустот:** практические страницы появляются при наличии
   источников, Product Content необязателен; навигация ведёт по документам без
   повторного обзора. Неизвестные условия AI Chat обозначены как неизвестные,
   а не заполнены вымышленными ценами, спросом или мощностью команды.
6. **Редактирование:** Studio показывает путь владельца, общую модель и связанные
   продукты. Карта и таблица переноса в инструкции указывают место каждого вида
   сведений. Проверенные основные документы укладываются в лимит 1 400 слов.

### Границы результата

Техническая миграция не подтверждает новую границу общей модели и не доказывает
рыночный спрос. Модель-пример остаётся явно предложенной; затронутые документы
имеют честные unconfirmed/changed/stale состояния. Существующие confirmation
метаданные сохранены, новые подтверждения и просмотренные отпечатки не назначались.
Смысловой перенос дочернего Business требует проверки его фактического содержания;
CLI автоматизирует только проверяемую структурную часть после назначения моделей.

## Итоговая навигация после уточнения оператора

Порядок: `40 Products` → соседние группы `singlepage` и `startup` → только
продукты своего слоя. Сейчас singlepage содержит Code Framework и AI Chat,
startup пуст и показывает `No products`. Слой выбирается перед продуктом;
под продуктами нет повторного списка default/singlepage/startup. Вычисляемый
default и правила наследования/полной замены сохранены без отдельной видимой ветки.

Производные CSF-истории генерируются по одному файлу на слой, сохраняют порядок
и ID продуктов. Одинаковые ID в разных слоях получают разные адреса. При добавлении
первого продукта пустое состояние исчезает только в его слое; при удалении
последнего возвращается. Старые производные файлы удаляются генератором.

Выпадающего меню Model/Customer Segments/Channels нет. Внутри выбранного продукта
остаются документы, вложенные материалы, общая модель и экспорт презентации.
Старые общие и продуктовые адреса перенаправляются в соответствующий слой;
отсутствующий запрошенный продукт не подменяется другим.

Проверка: тесты структуры навигации охватывают пустой startup, заполненный startup,
одинаковый ID в двух слоях, добавление/удаление продуктов и сохранение источников.
В браузере подтверждены дерево `40 Products → singlepage/startup → продукты`,
выбор AI Chat, пустой startup без продуктов singlepage и перевод прежнего
адреса Code Framework default в его singlepage-страницу.

Финальная `studio:validate` прошла: 107 тестов в 15 файлах, 5 GitHub-тестов,
TypeScript, оба слоя и self-check. Production-сборка Storybook и
`git diff --check` прошли.
