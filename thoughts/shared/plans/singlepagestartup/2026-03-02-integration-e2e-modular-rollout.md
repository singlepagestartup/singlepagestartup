# Research + Plan: Full Test Matrix (Scoped, Modular)

**Date:** 2026-03-02  
**Scope:** `apps/api`, `apps/host`, `libs/modules/ecommerce` (`product`, `attribute`, `products-to-attributes`), `libs/shared/*`  
**Goal:** внедрить и зафиксировать модульный подход к `unit + integration + e2e`, чтобы проверять результат команды автоматически (без ручного клика UI).

## 1. Исследование кода (фактическое состояние)

### 1.1 Где уже есть тесты и какого они типа

- `apps/api/specs/startup/*.spec.ts`, `apps/api/specs/singlepage/*.spec.ts`: unit/contract (mount + middleware/order).
- `libs/shared/frontend/*`: unit (утилиты, api factory, store, components helpers).
- `libs/modules/ecommerce/**/configuration.spec.ts`, `**/Component.spec.tsx`, `**/startup/index.spec.ts`: unit для адаптеров/конфигов/SDK.
- `apps/api/specs/integration/*.integration.spec.ts`: integration (host/module orchestration contract).
- `libs/modules/ecommerce/**/apps.integration.spec.ts`: integration (registry/type/route contracts).
- `apps/host/e2e/singlepage/**/*.e2e.ts`: e2e smoke для framework-owned сценариев.
- `apps/host/e2e/startup/**/*.e2e.ts`: e2e smoke для customer-owned сценариев.

### 1.2 Пробелы до внедрения

- Не было отдельного integration lane (unit и integration смешивались в одном `jest:test`).
- Не было e2e-контура внутри `apps/host`.
- Не было унифицированных скриптов полного scoped-прогона (`unit + integration + e2e`).

### 1.3 Ограничения среды

- В текущем sandbox запрещено поднимать локальный web server (`listen EPERM`), поэтому e2e нельзя валидировать рантаймом в этом окружении.
- Для стабильного запуска Nx в этом контуре нужен флаг:
  - `NX_DAEMON=false`
  - `NX_ISOLATE_PLUGINS=false`

## 2. Модульная и инкапсулированная структура

### 2.1 Lanes

- `unit`: локально рядом с кодом (`*.spec.ts`, `*.spec.tsx`).
- `integration`: отдельные `*.integration.spec.ts` + отдельные Jest configs/targets.
- `e2e`: встроенный контур `apps/host/e2e` с разделением `singlepage` и `startup`.

### 2.2 Инкапсуляция по директориям

- `apps/api/specs/integration/`: integration только для host orchestration.
- `libs/modules/ecommerce/backend/app/api/src/lib/*.integration.spec.ts`: integration только для module registry contracts.
- `apps/host/e2e/support/`: переиспользуемые фикстуры/моки.
- `apps/host/e2e/singlepage/`: бизнес-сценарии framework команды.
- `apps/host/e2e/startup/`: бизнес-сценарии клиентских команд.

### 2.3 Инкапсуляция по раннерам/конфигам

- Unit-конфиги игнорируют integration:
  - `apps/api/jest.config.ts`
  - `libs/modules/ecommerce/jest.config.ts`
- Integration конфиги:
  - `apps/api/jest.integration.config.ts`
  - `libs/modules/ecommerce/jest.integration.config.ts`
- E2E конфиг:
  - `apps/host/playwright.config.ts`

## 3. План внедрения (реализуемый шаблон для команды)

1. В каждом модуле держать unit рядом с кодом, integration рядом с orchestration-контрактами, а e2e внутри приложения в `apps/<app>/e2e`.
2. Для каждого lane иметь отдельный target и отдельный script (чтобы CI мог запускать lane независимо).
3. Для e2e обязательно иметь `support` слой (моки/фикстуры/хелперы) и разделять сценарии по ownership:
   - `singlepage` (upstream/framework team)
   - `startup` (client team)
4. Shared-first подход:
   - любая переиспользуемая логика сначала покрывается unit в `libs/shared`,
   - модульные тесты в `libs/modules/*` покрывают только специфичные адаптеры/контракты.
5. CI-пайплайн:
   - PR: `unit + integration`,
   - nightly/release: `unit + integration + e2e`.

## 4. Процесс реализации (сделано в этом контуре)

1. Добавлены integration targets:

- `apps/api:jest:integration`
- `@sps/ecommerce:jest:integration`

2. Добавлены integration-конфиги и разделение lane:

- `apps/api/jest.integration.config.ts`
- `libs/modules/ecommerce/jest.integration.config.ts`
- unit-конфиги обновлены с `testPathIgnorePatterns` для `*.integration.spec.ts`.

3. Добавлены integration-тесты:

- `apps/api/specs/integration/ecommerce-mounting.integration.spec.ts`
- `libs/modules/ecommerce/backend/app/api/src/lib/apps.integration.spec.ts`

4. Добавлен e2e контур внутри `apps/host`:

- `apps/host/project.json` (`host:e2e` target)
- `apps/host/tsconfig.spec.json`
- `apps/host/playwright.config.ts`
- `apps/host/e2e/support/mock-ecommerce-api.ts`
- `apps/host/e2e/singlepage/admin-shell.e2e.ts`
- `apps/host/e2e/singlepage/product-actions.e2e.ts`
- `apps/host/e2e/startup/README.md`

5. Добавлены scripts:

- `test:integration:scoped`
- `test:e2e:singlepage`
- `test:e2e:startup`
- `test:e2e:scoped`
- `test:all:scoped`

6. После уточнения по архитектуре (без отдельного приложения):

- удален внешний `apps/host-e2e` контур,
- e2e перенесены в `apps/host/e2e/*`,
- e2e разделены по ownership (`singlepage` / `startup`) для минимизации конфликтов при pull из upstream,
- в `apps/host/project.json` добавлен target `host:e2e`,
- добавлен readiness endpoint `apps/host/app/healthz/route.ts`,
- `apps/host/middleware.ts` обновлен: `healthz` исключен из i18n redirect matcher.

## 5. Валидация прогонов

```bash
npm run test:unit:scoped -- --outputStyle=stream
npm run test:integration:scoped -- --outputStyle=stream
npm run test:e2e:scoped -- --outputStyle=stream
```

Фактический результат:

- `unit`: PASS
- `integration`: PASS
- `e2e`: PASS (через `host:e2e` после миграции в `apps/host/e2e` и фикса readiness)

Вывод: все три lane (`unit + integration + e2e`) запускаются в scoped-контуре с модульной структурой и без отдельного e2e-приложения.

## 6. Следующая итерация (расширение контроля команды)

1. Добавить DB-backed integration для `product/attribute/products-to-attributes` (реальные CRUD + filters + relation consistency).
2. Разделить e2e mock fixture на подмодули:
   - `support/ecommerce/products.mock.ts`
   - `support/ecommerce/attributes.mock.ts`
   - `support/ecommerce/relations.mock.ts`
3. Добавить e2e smoke на relation flow (`attach/detach attribute to product`) и базовые edge-cases (поиск/пустые списки).
