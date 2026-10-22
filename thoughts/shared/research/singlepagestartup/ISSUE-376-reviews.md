---
issue_number: 376
repository: singlepagestartup
branch: codex/issue-376-framework-visual
reviewer: phase_reviewer
review_skill: review-pr
last_updated: 2026-10-23
status: research_passed
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
