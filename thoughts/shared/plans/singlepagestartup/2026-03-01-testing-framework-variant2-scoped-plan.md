# Plan: Variant 2 Testing Framework (Scoped)

**Date:** 2026-03-01  
**Scope lock:** `apps/api`, `apps/host`, `libs/modules/ecommerce(product|attribute|products-to-attributes)`, `libs/shared/*`  
**Execution model:** `unit + integration + e2e`, где shared — первичный слой для масштабируемого контроля качества.

## 1. Целевое состояние

1. `shared` покрыт unit-тестами в критичных местах (backend/api + frontend/client api/components/hooks + utils).
2. Для `ecommerce(product/attribute/products-to-attributes)` есть integration-тесты API (CRUD + relation filters + seed transformers).
3. Для `apps/host` есть e2e smoke по admin-v2 флоу (list/create/edit/delete + relation attach).
4. Nx targets стандартизированы: все тесты запускаются предсказуемо через `jest:test`/`e2e`.
5. PR quality gate блокирует merge при регрессии.

## 2. Архитектура тестового контура (Variant 2 в scoped режиме)

## 2.1 Unit lane (Jest)

- Shared backend:
  - `query-builder/*`
  - `repository/database/*` (расширение текущих тестов)
  - `middleware/parse-query`
  - `filters/exception` (без реальной отправки в Telegram, с моками)
- Shared frontend:
  - `client/api/factory/*`, `request-limmiter`
  - `client/hooks/use-admin-form-state`
  - `components/singlepage/admin*` и `admin-v2*` (focused tests на data-loading/state transitions)
- Ecommerce thin adapters:
  - SDK model route/options smoke
  - relation form mapping и filter params build (без deep DOM-heavy тестов).

## 2.2 Integration lane (Jest + test DB)

- API integration для:
  - `/api/ecommerce/products`
  - `/api/ecommerce/attributes`
  - `/api/ecommerce/products-to-attributes`
- Проверки:
  - create/find/update/delete
  - `filters.and` + `orderBy.and` корректно проходят parse/query-builder stack
  - relation create/read с `productId`/`attributeId`
  - seed transformers из relation configuration отрабатывают на реальных seeded данных.

## 2.3 E2E lane (Playwright)

- `apps/host`:
  - вход в `/admin/modules/ecommerce/models/product`
  - создание/редактирование product
  - переход в attribute, создание/редактирование attribute
  - связывание через products-to-attributes (form/select-input)
  - проверка, что изменения отображаются в списках.

## 3. Пошаговый процесс реализации

## Phase 0: Нормализация targets и конфигов

1. Добавить `jest:test` targets в:
   - `@sps/ecommerce`
   - `@sps/shared-frontend-components`
   - `@sps/shared-frontend-client-api`
   - `@sps/shared-frontend-client-hooks`
   - `@sps/shared-frontend-server-api` (минимум smoke)
2. Добавить `jest.config.ts` + `tsconfig.spec.json` для новых test-проектов.
3. Проверить корректность `sourceRoot` у `@sps/shared-frontend-client-hooks` (сейчас указывает `libs/shared/frontend/hooks/src` вместо `libs/shared/frontend/client/hooks/src`).
4. Ввести единые npm scripts:
   - `test:unit:scoped`
   - `test:integration:scoped`
   - `test:e2e:scoped`

**Deliverable:** тестовые таргеты доступны и запускаются через Nx.

## Phase 1: Shared-first unit coverage (80% leverage)

1. `libs/shared/frontend/client/api`:
   - тесты для `factory`:
     - queryKey composition
     - mutation wrappers
     - subscription invalidation by payload/topics
     - requestId propagation в store
   - тесты для `request-limmiter` (очередь, max concurrency, fairness).
2. `libs/shared/frontend/client/hooks`:
   - `use-admin-form-state`: pending/success/error и auto-reset.
3. `libs/shared/frontend/components`:
   - `admin(-v2)/table/client.tsx`: search filter builder, pagination params, total sync.
   - `admin(-v2)/form/client.tsx`: load-by-id/empty-form branch.
   - `admin(-v2)/select-input/ClientComponent.tsx`: debounce, mergedData, selected entity hydration.
4. `libs/shared/backend/api`:
   - расширить `query-builder` кейсы (json fields, uuid vs like, invalid filter types).
   - `parse-query` middleware: JSON-string внутри `filters.and`/`orderBy.and`.
   - `repository/database`: edge-cases update/seed/dump.

**Deliverable:** стабильный unit baseline с акцентом на shared.

## Phase 2: Ecommerce integration tests

1. Создать integration suite в `libs/modules/ecommerce` (или `apps/api/specs/ecommerce`), запускаемую через `jest:test`.
2. Поднимать API app в тестовом процессе и использовать test DB (Docker Postgres или выделенный test schema).
3. Кейсы:
   - Product CRUD
   - Attribute CRUD
   - Products-to-Attributes CRUD
   - Relation filtering (`productId`, `attributeId`)
   - Seed relation transformers корректно резолвят новые IDs.
4. Добавить deterministic seed fixtures для тестов.

**Deliverable:** backend-интеграции закрывают целевой ecommerce контур.

## Phase 3: Host e2e smoke (Playwright)

1. Завести e2e-контур в `apps/host/e2e` (или аналогичный Nx e2e project).
2. Подготовить env для локального e2e (`host + api + seeded db`).
3. Написать 3-5 smoke сценариев:
   - open admin v2
   - product create/edit/delete
   - attribute create/edit/delete
   - relation attach/detach.
4. Обеспечить устойчивые селекторы (`data-testid` для критичных action buttons/forms).

**Deliverable:** end-to-end подтверждение пользовательских сценариев команды.

## Phase 4: Quality gate и rollout protocol

1. PR pipeline:
   - `nx affected --target=eslint:lint`
   - `nx affected --target=jest:test`
   - scoped integration suite
2. Nightly:
   - полный integration + e2e smoke.
3. Политика merge:
   - unit/integration/e2e pass required
   - запрет skip/failing tests в target scope.

**Deliverable:** контролируемый engineering feedback loop для команды.

## 4. Минимальный backlog внедрения (конкретные задачи)

1. Добавить test targets и jest configs для shared frontend libs и ecommerce project.
2. Написать unit тесты в shared frontend API/hooks/components.
3. Расширить shared backend API тесты (query-builder, parse-query, repository edge cases).
4. Добавить ecommerce integration suite (product/attribute/products-to-attributes).
5. Добавить host Playwright smoke suite для admin-v2 ecommerce flows.
6. Включить scoped test gates в CI.

## 5. Definition of Done для scoped Variant 2

- Все новые тестовые таргеты работают через Nx без ручных workaround.
- В scoped PR обязательны unit + integration.
- Nightly e2e smoke стабилен.
- Регрессии по product/attribute/relation ловятся до merge.
- Shared-слой имеет достаточное покрытие ключевых веток, чтобы служить quality umbrella для модульного кода.

## 6. Process Log (2026-03-01)

### 6.1 Выполнено (итерация limited contour)

1. Включена test-infrastructure:

- Добавлены `jest:test` targets в scoped-проекты (`@sps/ecommerce` + shared frontend libs из контура).
- Добавлены `jest.config.ts` и `tsconfig.spec.json` для этих проектов.
- Исправлен `sourceRoot` в `@sps/shared-frontend-client-hooks`.
- Добавлены root scripts:
  - `test:unit:shared`
  - `test:unit:ecommerce`
  - `test:unit:scoped`

2. Реализованы тесты shared (high-reuse layer):

- `shared/frontend/client/utils`:
  - `admin-route` parsing/base-path
  - `authorization.headers`
  - `authorization.parse-jwt`
  - `saturate-headers`
- `shared/frontend/client/api`:
  - `RequestLimiter` (concurrency + FIFO)
- `shared/frontend/server/api`:
  - `factory` forwarding contract
- `shared/frontend/api`:
  - action contracts (`find`, `findById`, `create`, `bulkUpdate`)
- `shared/frontend/components`:
  - `getAdminV2ModelTablePage` (search/sort/pagination)
- `shared/frontend/client/store`:
  - `global-actions-store` add/reset/sessionStorage contract

3. Реализованы тесты ecommerce и apps:

- `ecommerce` backend configuration tests:
  - `product`
  - `attribute`
  - `products-to-attributes` (filters + transformers)
- `ecommerce` frontend adapter tests:
  - `admin-v2/select-input` for `product`, `attribute`, `products-to-attributes`
- `startup` SDK contract tests:
  - product/attribute/products-to-attributes startup API reuses singlepage API/provider
- `apps/api/specs/startup|singlepage`:
  - route-mount contracts
  - middleware-order contract

### 6.2 Валидация прогона

Фактический стабильный запуск в этой среде:

```bash
NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_WORKSPACE_DATA_DIRECTORY=/tmp/nx-ws-data-6 \
nx run-many --target=jest:test \
  --projects=api,@sps/ecommerce,@sps/shared-frontend-api,@sps/shared-frontend-server-api,@sps/shared-frontend-client-api,@sps/shared-frontend-client-utils,@sps/shared-frontend-client-store,@sps/shared-frontend-components \
  --parallel=3 --outputStyle=stream
```

Результат: все 8 scoped-проектов успешно прошли `jest:test`.
