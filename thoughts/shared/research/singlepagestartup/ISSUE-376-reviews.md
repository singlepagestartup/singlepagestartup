---
issue_number: 376
repository: singlepagestartup
branch: codex/issue-376-framework-visual
reviewer: phase_reviewer
review_skill: review-pr
last_updated: 2026-10-23
status: plan_passed
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
