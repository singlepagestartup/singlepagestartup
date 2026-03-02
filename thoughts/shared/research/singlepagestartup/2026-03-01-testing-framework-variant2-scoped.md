# Research: Variant 2 Testing Framework (Scoped)

**Date:** 2026-03-01  
**Scope:** `apps/*`, `libs/modules/ecommerce` (`product`, `attribute`, `products-to-attributes`), and `libs/shared/*`  
**Goal:** определить реалистичную стратегию Variant 2 (unit + integration + e2e) на ограниченном контуре, с упором на `shared` как рычаг покрытия ~80% поведения.

## 1. Контекст и текущая ситуация

### 1.1 Что уже есть в тестах

- В репозитории есть Jest-инфраструктура через Nx (`nx.json`, target default `jest:test`).
- Фактические `spec`-файлы в основном в:
  - `libs/shared/backend/api`
  - `libs/shared/backend/utils`
  - `libs/shared/backend/database/config`
  - `libs/shared/utils`
  - плюс демонстрационные тесты в `apps/api/specs/startup`.
- В контуре `ecommerce(product/attribute/products-to-attributes)` тестов нет.
- В `shared/frontend/*` тестов нет.

### 1.2 Проблемы в тестовом контуре

- У большинства `shared/frontend/*` библиотек нет test-target (`project.json` содержит только `eslint:lint`, `tsc:build`).
- У `@sps/ecommerce` нет `jest:test` target, только build/migration tasks.
- Не построен e2e-контур для `apps/host` admin-flow.
- CI release workflow не использует тесты как обязательный gate.

### 1.3 Технические риски инфраструктуры

- Зафиксирована нестабильность Nx daemon/plugin worker в текущей среде (`Failed to start plugin worker`, EPERM на сокете).
- Для детерминированного CI прогона нужны `NX_DAEMON=false` и раздельные джобы.

## 2. Что в коде действительно критично для покрытия

## 2.1 Backend shared (высокий ROI)

- `libs/shared/backend/api`:
  - `repository/database/index.ts` — ядро CRUD + dump/seed/filters/orderBy/date coercion.
  - `query-builder/filters.ts`, `order-by.ts`, `populate.ts` — критично для всех module REST-find сценариев.
  - `controllers/rest/index.ts` и `service/crud/index.ts` — общий REST pipeline.
  - `middleware/parse-query/index.ts` — парсинг сложного query для `filters.and`, `orderBy.and`.
  - `filters/exception/index.ts` — унифицированный формат ошибок и observability.
- Вывод: тестирование этих мест масштабируется на все модули, не только ecommerce.

## 2.2 Ecommerce backend (целевой контур)

- `models/product`, `models/attribute`, `relations/products-to-attributes` используют стандартный стек:
  - `App extends DefaultApp`
  - `Controller extends RESTController`
  - `Service extends CRUDService`
  - `Repository extends DatabaseRepository`
  - `Configuration extends ParentConfiguration`
- Наибольший риск в custom-логике `Configuration` relation:
  - `products-to-attributes/backend/app/api/src/lib/configuration.ts`
  - фильтры + transformers пересопоставляют dump IDs -> seed IDs.
- `apps/api/app.ts` монтирует ecommerce на `/api/ecommerce`.

## 2.3 Frontend shared (высокий ROI)

- `libs/shared/frontend/client/api`:
  - factory (find/findById/create/update/delete), subscription invalidation, request id.
  - request limiter и error handling.
- `libs/shared/frontend/components/singlepage/admin*` и `admin-v2*`:
  - table/form/select-input data-loading контейнеры.
  - связь с react-query API и table context.
- `libs/shared/frontend/client/hooks/use-admin-form-state`.

## 2.4 Ecommerce frontend (целевой контур)

- `models/product` и `models/attribute` admin/admin-v2 собираются через shared parent components.
- `products-to-attributes` admin/admin-v2 form использует select-input на product/attribute.
- `apps/host/app/[[...url]]/page.tsx` роутит `/admin/**` в admin draft.
- `apps/host/src/components/admin-panel-draft/ClientComponent.tsx` содержит основной entrypoint admin-v2.

## 3. Почему именно shared даст ~80% эффекта

По импорту в выбранном контуре (`apps + ecommerce/product|attribute|products-to-attributes`):

- чаще всего используются:
  - `@sps/shared-backend-api`
  - `@sps/shared-utils`
  - `@sps/shared-frontend-client-api`
  - `@sps/shared-frontend-components/*`
  - `@sps/shared-frontend-client-hooks`
  - `@sps/shared-configuration`
- Это значит, что сбой в shared ломает большинство модулей одновременно.
- Следовательно, тест-фокус на shared дает лучший коэффициент покрытия/стоимости.

## 4. Gaps, которые нужно закрыть для Variant 2

1. Нет единообразных test targets в `shared/frontend/*` и `@sps/ecommerce`.
2. Нет unit-тестов на shared frontend API factory/hook/components.
3. Нет integration-тестов API для `product`, `attribute`, `products-to-attributes`.
4. Нет e2e smoke-кейсов `/admin/modules/ecommerce/models/{product,attribute}`.
5. Нет quality gate для PR/merge в этой зоне.

## 5. Предварительная граница внедрения (без расширения scope)

Внедряем только:

- `apps/api`
- `apps/host`
- `libs/modules/ecommerce` (product, attribute, products-to-attributes)
- `libs/shared/*` (приоритетно backend/api + frontend client api/components/hooks + utils)

Не внедряем на этом этапе:

- другие domain modules (blog/crm/etc.)
- полное e2e-покрытие всего host
- mutation testing и non-functional testing (отдельная волна).

## 6. Дополнительные findings по фактическому коду (реализация)

- Подтверждена ошибка `sourceRoot` в `@sps/shared-frontend-client-hooks`:
  - было: `libs/shared/frontend/hooks/src`
  - корректно: `libs/shared/frontend/client/hooks/src`
- Для выбранного контура test-infra отсутствовала в проектах:
  - `@sps/ecommerce`
  - `@sps/shared-frontend-api`
  - `@sps/shared-frontend-server-api`
  - `@sps/shared-frontend-client-api`
  - `@sps/shared-frontend-client-utils`
  - `@sps/shared-frontend-client-store`
  - `@sps/shared-frontend-components`
- В `apps/api/specs/*` были placeholder-тесты; заменены на структурные contract-тесты (route mounting + middleware order).
- В среде выполнения обнаружена нестабильность Nx plugin worker:
  - `NX Failed to start plugin worker`
  - стабильный обход: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`.
