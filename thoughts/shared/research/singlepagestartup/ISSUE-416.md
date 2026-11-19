---
date: 2026-11-18T22:17:00+03:00
researcher: flakecode
research_model: gpt-6.2-sol
reasoning_effort: xhigh
git_commit: 1a173118d580f6520ccd93eaf2aa7bacdac60879
branch: codex/issue-416-module-services
repository: singlepagestartup
topic: "Как серверные сервисы SPS получают зависимости и расширения startup"
tags: [research, backend, dependency-injection, bootstrap, generator]
status: complete
last_updated: 2026-11-18
last_updated_by: flakecode
---

# Как сервис Order доходит до Agent

Исследование для [#416](https://github.com/singlepagestartup/singlepagestartup/issues/416) отвечает на три вопроса. Кто создаёт сервис? Какие методы видит вызывающий код? Что изменится для существующих вызовов, если все разрешённые модули станут доступны через `this.modules`?

## Что уже есть

В Agent зарегистрированы восемь групп внешних сервисов. В исследованном коммите у 61 модели и 100 связей есть собственная функция `createService()`. Ещё 15 точек входа собирают HTTP-приложения модулей. Все 176 используют `createAppBootstrap`. Обход охватывает файлы `libs/modules/**/backend/app/api/src/lib/bootstrap.ts`. У модульного приложения есть таблица дочерних HTTP-приложений, у сущности — конкретная реализация сервиса. Общего свойства `this.modules` в серверных сервисах на этом коммите нет. [Bootstrap модуля Ecommerce](../../../../libs/modules/ecommerce/backend/app/api/src/lib/bootstrap.ts#L12) · [HTTP-приложения Ecommerce](../../../../libs/modules/ecommerce/backend/app/api/src/lib/apps.ts)

| Модуль   | Моделей | Связей | Модуль          | Моделей | Связей |
| -------- | ------: | -----: | --------------- | ------: | -----: |
| Agent    |       2 |      0 | Ecommerce       |       7 |     20 |
| Host     |       4 |      6 | Billing         |       4 |      2 |
| Analytic |       2 |      0 | Website Builder |       7 |     13 |
| RBAC     |       6 |     17 | Knowledge       |       2 |      2 |
| Startup  |       1 |      0 | Notification    |       4 |      2 |
| Social   |       9 |     21 | File Storage    |       2 |      1 |
| CRM      |       6 |      7 | Broadcast       |       2 |      1 |
| Blog     |       3 |      8 |                 |         |        |

Повторить подсчёт из корня репозитория можно по файлам, которые входят в Git.

```sh
git ls-files 'libs/modules/*/backend/app/api/src/lib/bootstrap.ts' |
  awk -F/ '{k=($4=="backend" ? "module" : $4); counts[$3 " " k]++}
           END {for (k in counts) print k, counts[k]}' | sort
```

### Один экземпляр в пределах одной сборки

Первый вызов `createService()` создаёт контейнер, загружает биндинги, применяет конфигурацию владельца и запрашивает `DI.IService`. Сервис модели зарегистрирован как singleton. При последующем запуске HTTP тот же контейнер передаёт сервис контроллеру. Несколько одновременных вызовов `bootstrap()` получают один результат инициализации. После ошибки HTTP можно повторить запуск с тем же сервисом. Отдельный вызов фабрики создаёт отдельный контейнер. У модульной сборки без биндинга сервиса результатом поля `service` служит `undefined`. [Реализация](../../../../libs/shared/backend/api/src/lib/app/bootstrap.ts#L21) · [Четыре теста границ экземпляра](../../../../libs/shared/backend/api/src/lib/app/bootstrap.spec.ts#L26)

У Order есть две точки входа. Прямой импорт `createService` из файла bootstrap даёт доступ к сервису без вызова `app.init()`. Импорт значения из публичного пакета `backend/app/api` выполняет на верхнем уровне `await bootstrap()`. Этот второй путь нужен для подключения HTTP-маршрутов. [Сервис](../../../../libs/modules/ecommerce/models/order/backend/app/api/src/lib/bootstrap.ts#L404) · [HTTP](../../../../libs/modules/ecommerce/models/order/backend/app/api/src/index.ts#L1)

### Методы, добавленные в startup

Order регистрирует итоговый класс из `./service`, который экспортируется из `./startup`. Контроллер получает его через `DI.IService`. Agent импортирует фабрику владельца как `getOrder` и получает тот же сервис стандартной сборки, но описывает свойство `ecommerceModule.order` типом `IReadService & Pick<EcommerceOrderService, "deleteCanceledWithoutPayment">`. Класс в контейнере и тип свойства у вызывающего кода в этом месте расходятся. [Класс Order](../../../../libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/startup/index.ts#L7) · [Биндинг](../../../../libs/modules/ecommerce/models/order/backend/app/api/src/lib/bootstrap.ts#L78) · [Контроллер](../../../../libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/startup/index.ts#L9) · [Agent](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts#L328) · [Тип свойства](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/di.ts#L45)

Для проверки TypeScript Compiler API получил два виртуальных файла поверх исходников этого коммита. В класс Order в памяти добавлен метод `startupProbe416(id: string): Promise<string>`. Во втором файле компилятор проверил три выражения.

```ts
import { createService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import type { IEcommerceModule } from "@sps/agent/models/agent/backend/app/api/src/lib/di";

declare const order: ReturnType<typeof createService>;
declare const agent: IEcommerceModule;
const result: Promise<string> = order.startupProbe416("order");
// @ts-expect-error Аргумент должен быть строкой.
order.startupProbe416(123);
// @ts-expect-error У текущего интерфейса Agent такого метода нет.
agent.order.startupProbe416("order");
```

Семантическая проверка пробного файла с настройками `tsconfig.base.json` дала ноль диагностик, обе ожидаемые ошибки подтвердились. Это проверка статических типов. Единичность экземпляра проверялась отдельным тестом общего bootstrap. Путь `this.modules.ecommerce.order` описан в требованиях новой задачи.

### Где способ создания меняет поведение

| Место                                        | Как получается сервис                                                                                                 | Что учитывать при планировании                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Agent → Order                                | Вызов экспортированной фабрики владельца                                                                              | Тип свойства скрывает дополнительные методы.                                                                      |
| Agent → Product, Attribute и связи Ecommerce | В биндинге Agent создаются `new CRUDService(...)` и репозитории                                                       | Переход на сервис владельца меняет объект и подключает методы или переопределения модели.                         |
| Order → Billing Currency                     | В контейнере Order создаётся класс Currency со своим репозиторием и конфигурацией                                     | Область singleton ограничена контейнером Order.                                                                   |
| Order → PaymentIntent                        | Фабрика принимает подмены для резерва и оплаты. По умолчанию создаёт специализацию `OrderPayment` с сервисом резервов | В этой операции значение имеет конкретный сценарий оплаты заказа.                                                 |
| RBAC Subject → оплата заказа                 | Subject берёт платёжный сервис и связь резервов из уже собранного Order                                               | Покупатель работает с заказом через Subject. Проверки прав и привязка оплаты к заказу зависят от этой композиции. |

Источники для строк таблицы — [биндинги Agent](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts#L227), [Billing Currency в Order](../../../../libs/modules/ecommerce/models/order/backend/app/api/src/lib/bootstrap.ts#L91), [специализация оплаты](../../../../libs/modules/ecommerce/models/order/backend/app/api/src/lib/bootstrap.ts#L378) и [потребитель в Subject](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/bootstrap.ts#L774). Интеграционные сценарии явно создают отдельную сборку с переданным сервисом резервов. [Повтор оплаты](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/payment-retry.integration.spec.ts#L94)

В Subject одновременно действуют обе схемы. Сам `Subject.ecommerceModule.order` создаётся через `new EcommerceOrderService(...)`. Он использует ту же реализацию startup и общие платёжные зависимости, но это **второй объект Order**. Интеграционный тест сравнивает идентичность PaymentIntent в Subject и Order и проверяет вызов замены startup для количества через оба пути. Он не сравнивает идентичность двух Order. [Сборка Subject](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/bootstrap.ts#L513) · [Проверка платёжного объекта](../../../../apps/api/specs/integration/commerce-checkout.integration.spec.ts#L39) · [Проверка замены startup](../../../../apps/api/specs/integration/commerce-checkout.integration.spec.ts#L155)

В Host основной экземпляр Page получает источники маршрутов при конфигурации HTTP-приложения. Agent отдельно создаёт Page в своём контейнере. В RBAC при сборке приложения задаётся обработчик отзыва ролей. Вопрос о том, когда доступна такая настройка при прямом вызове сервиса, отличается от вопроса о его типе. [Поля Agent](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts#L164) · [Конфигурация Page](../../../../libs/modules/host/backend/app/api/src/lib/apps.ts#L23) · [Настройка RBAC](../../../../libs/modules/rbac/backend/app/api/src/lib/apps.ts#L36)

### Где проверяются права пользователя

Покупка из Telegram в Agent обращается к SDK Subject с токеном пользователя. В HTTP-запросе глобальная проверка разрешений предшествует вызову маршрута. Для операций над заказом Subject дополнительно проверяет его связь с пользователем и принадлежность строки заказу. Увеличение числа доступных сервисов в DI само по себе не выполняет ни одну из этих проверок. При планировании переноса существенна разница между внутренним заданием Agent и действием покупателя. [Agent](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts#L1926) · [Порядок middleware](../../../../apps/api/app.ts#L164) · [Проверка заказа](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/access.ts#L14)

## Ограничения графа и генерация

Порядок от потребителя к зависимостям включает Agent, Host, Analytic, RBAC, Startup, Social, CRM, Blog, Ecommerce, Billing, Website Builder, Knowledge, Notification, File Storage и Broadcast. Внутри одного модуля модель-потомок также ограничена в обращении к входящей связи. Например, Topic может использовать TopicsToNotifications, а Notification не должен получать через неё Topic. Расширение `service/startup` принадлежит своему модулю. Оно не меняет его положение в иерархии. [Контракт](../../../../.agents/contracts/engineering/module-dependencies.md)

Проверка модулей анализирует статические импорты и реэкспорты, импорты типов и вызовы с литеральными путями, включая транзит через нейтральные пакеты. Проверка входящей связи опирается на имена модели и концов связи. Произвольный цикл между сервисами внутри одного модуля этим анализом не исключается. Наличие ссылки на сервис также не устанавливает право пользователя на вызов операции. [Проверяющий код](../../../../tools/agents/module-dependencies.mjs#L142) · [Тесты правила](../../../../tools/agents/module-dependencies.test.mjs) · [Область ответственности Subject](../../../../.agents/contracts/engineering/module-dependencies.md#L40)

В 22 bootstrap-файлах сущностей используются динамические биндинги (16 моделей и 6 связей). Это число файлов с `toDynamicValue`, а не число создаваемых объектов. Для 159 сущностей основной биндинг ссылается на класс Service. У Knowledge Source и SourcesToFileStorageModuleFiles сервис предоставляет `createKnowledgeServices()`. Внутри транзакции Knowledge собирает сервисы с репозиториями на текущей транзакции и отдельно запускает действия после коммита. Эта область жизни имеет значение для замены ручного создания. [Source](../../../../libs/modules/knowledge/models/source/backend/app/api/src/lib/bootstrap.ts#L19) · [Связь](../../../../libs/modules/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/bootstrap.ts#L19) · [Транзакция](../../../../libs/modules/knowledge/backend/app/api/src/lib/composition.ts#L120)

Генераторы module, model и relation зарегистрированы в плагине Nx. Их тесты проверяют форму сгенерированного bootstrap в виртуальном дереве. Для моделей и связей тест фиксирует экспорт обеих функций и singleton-биндинг. Для модуля он проверяет сборку приложения. Эти проверки пока не обращаются к сгенерированной модели из вышележащего сервиса. [Регистрация генераторов](../../../../tools/plugins/sps-generator-plugin/generators.json) · [Модель](../../../../tools/plugins/sps-generator-plugin/src/generators/model/generator.spec.ts#L45) · [Связь](../../../../tools/plugins/sps-generator-plugin/src/generators/relation/generator.spec.ts#L49) · [Модуль](../../../../tools/plugins/sps-generator-plugin/src/generators/module/generator.spec.ts#L37)

Файлы, которые требуется учитывать при изменении генерации, находятся в `tools/plugins/sps-generator-plugin/src/coder/root/libs/modules/[module]`. Там три независимых шаблона `bootstrap.ts.template` в каталогах `backend/app/api/files/src/lib`, `models/[model]/backend/app/api/files/src/lib` и `relations/[relation]/backend/app/api/files/src/lib`. При создании модуля Coder обновляет список HTTP-модулей в apps/api/app.ts. При создании модели или связи он добавляет её приложение в apps.ts владельца. Эти списки содержат HTTP-приложения. [Модуль](../../../../tools/plugins/sps-generator-plugin/src/generators/module/generator.ts#L74) · [Модель](../../../../tools/plugins/sps-generator-plugin/src/generators/model/generator.ts#L117) · [Связь](../../../../tools/plugins/sps-generator-plugin/src/generators/relation/generator.ts#L165)

## Проверки на исходном коммите

| Проверка                                                                            | Результат                                                                                    |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run check:module-dependencies`                                                 | 16 057 исходных файлов, 0 нарушений установленного порядка                                   |
| `node --test tools/agents/module-dependencies.test.mjs`                             | 5 тестов прошли                                                                              |
| Jest, `libs/shared/backend/api/src/lib/app/bootstrap.spec.ts`                       | 4 теста прошли                                                                               |
| Jest, `generator.spec.ts` для module, model и relation                              | 3 теста прошли                                                                               |
| Правила Permission, авторизация и владение заказом в Subject, глобальный middleware | 82 теста прошли                                                                              |
| Полный Jest-проект генератора, 18 наборов                                           | 98 тестов прошли, включая три набора выше                                                    |
| Виртуальное расширение Order, проверка TypeScript                                   | Принят вызов с корректным аргументом и возвращаемым типом, подтверждены обе ожидаемые ошибки |

Тесты HTTP и PostgreSQL для checkout перечислены как существующее покрытие. В этом исследовании их код прочитан, повторный прогон ограничен проверками, указанными выше.

Дополнительно на реальных фабриках Agent и Order сравнили объекты в одном процессе Bun 1.3.6. Прямое получение обоих сервисов дало один Order и ноль вызовов init. При параллельном запуске Order зарегистрировано одно выполнение init, контроллер получил прежний объект. Отдельная сборка Order получила обе переданные подмены. Для загрузки зависимости undici в этом запуске потребовалась временная заглушка отсутствующего в Bun метода worker_threads.markAsUncloneable. Это разовый тест композиции в памяти, без проверки работы сети или базы данных.

## История решений

[Октябрьский аудит импортов](2026-10-14-module-order-import-audit.md) зафиксировал порядок модулей. В #414 [общая фабрика](https://github.com/singlepagestartup/singlepagestartup/commit/646a305259) и [обновление bootstrap и оплаты](https://github.com/singlepagestartup/singlepagestartup/commit/eae52b67b4) изменили сборку сервисов. Исходный коммит этого исследования содержит оба изменения. [Задача #414](../../tickets/singlepagestartup/ISSUE-414.md)

## Вопросы для Core 20

1. Где генератор объявляет типы и ленивый доступ к разрешённым сервисам для каждого уровня? Как проверять полноту списка, исключить обратный импорт и не запустить HTTP при обращении к одному сервису?
2. Какую точку подмены получает отдельная тестовая сборка, чтобы все её потребители видели один переданный экземпляр и не затрагивали сборку соседнего теста?
3. В каком порядке переносить обычный CRUD, прямые вызовы сервиса владельца и специализации вроде OrderPayment? Какие проверки сохраняют прежние права, поведение переопределённых методов и резервирование заказа при оплате?
4. Как тест генератора проверит из другого модуля доступ к методу, добавленному только в startup, и ошибку компиляции при обращении к модулю выше?
