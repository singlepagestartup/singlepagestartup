---
date: 2026-10-20
repository: singlepagestartup/singlepagestartup
status: complete
confirmation: approved-in-conversation
---

# Композиция чатов в RBAC Widgets

Host выбирает сохранённый Widget и извлекает явные ID внутри Page render-reader.
RBAC Widget принимает ID, подключает текущий Subject и собирает сценарий. Website
Builder владеет оформлением и редактируемым контентом; Social — моделями чатов,
тредов и сообщений. Между ними передаются готовые JSX-слоты.

## Объём и исходное состояние

Два сценария: список чатов и открытый чат. Host Social-адаптер сейчас передаёт
`renderChat` и `chatList` с RBAC Subject. Social возвращает извлечённые из
`routeParams` ID обратно в этот callback. Два Subject `me`-варианта выполняют
чтение сессии в интерактивном представлении. Незакоммиченный рефакторинг Subject
в текущем рабочем дереве сохраняется.

HAR от пользователя содержит 1226 запросов за приблизительно 2 минуты 41 секунду,
включая 13 ответов 401 на чтение Knowledge Sources. Их причина — отсутствие
связи профиля администратора с чатом. Чтение чата уже допускает администратора
без такой связи. В HAR нет сетевого отказа, подтверждающего причину уведомления
`Failed to fetch`; эту ошибку нужно проверить отдельно.

## Этапы

### 1. Исходные данные и проверки доступа

- [x] Сохранить соответствия Page → Host association → Social Widget и контент.
- [x] Воспроизвести сценарий testing4 в Browser → администратор в Chrome.
- [x] Согласовать доступ чата и документов с существующими правами RBAC.
- [x] Проверить повторы запросов, подписки, ошибки транспорта и уведомления.
- [x] Проверить отказ обычному пользователю для чужого чата/документов.

### 2. Studio

- [x] Добавить две проекции RBAC Widget и связанные Website Builder frames.
- [x] Зарегистрировать их через публичные реестры, manifests и stories.
- [x] Показать ready, loading, empty, access-denied и error состояния.
- [x] Проверить Storybook с сохранением нынешнего оформления.

### 3. Production-компоненты

- [x] Добавить `subject-me-social-module-profile-chat-list-default` и
      `subject-me-social-module-profile-chat-overview-default` в RBAC Widget.
- [x] Группировать папки под `singlepage/subject/me/social-module/profile/chat/`.
- [x] Page render-reader в Host передаёт явные ID в Widget и нижние компоненты.
- [x] Привести два Subject me-reader к index/client/server/Component структуре.
- [x] Использовать стандартную связь RBAC Widget → Website Builder Widget.
- [x] Сохранить безопасные server/client границы и клиентский session reader
      на кешируемых Host страницах.

### 4. Перенос сохранённых связей

- [x] Добавить SDK-инструмент prepare/apply/rollback в `tools/runtime`.
- [x] Использовать явные ID, сохранить исходные записи и все поля контента.
- [x] Создать presentation и domain Widgets, затем переключить Host ссылки.
- [x] Сохранить порядок, Host association IDs и исходные Social Widgets.
- [x] Защититься от stale records, дубликатов и повторного seed.
- [x] Проверить повтор apply, новый prepare без операций и rollback.
- [x] Применить манифест в локальной среде; не менять data snapshots.

### 5. Очистка и документация

- [x] Убрать Subject/renderChat/chatList композицию из Host Social-адаптера.
- [x] Очистить устаревшие Social slot-контракты после переноса использований.
- [x] Обновить frontend contract и README затронутых моделей/отношений.
- [x] Записать аналогичные композиции Blog как отдельное последующее изменение.

### 6. Проверки результата

- [x] Пройти целевые тесты, TypeScript, ESLint и guards импортов/размещения.
- [x] Собрать Host и запустить собранный сервер.
- [x] В dev и build проверить EN/RU, список, чат, тред, отсутствие ID,
      гостя и отказ доступа.
- [x] Проверить создание/редактирование сообщения между разными сессиями.
- [x] Проверить восстановление пропущенных обновлений после reconnect.
- [x] Проверить черновик, фокус, прокрутку и отсутствие RSC/сетевых ошибок.
- [x] Сохранить runtime evidence и измерение повторных запросов.

## Границы изменения

Существующие render-readers `find` и authentication остаются. Работа не меняет
порядок модулей, схему таблиц или общий механизм кеширования без доказанной
необходимости. Изменения Blog перечисляются отдельно. Коммит и production-релиз
не входят в этот запуск плана.

Откат данных возвращает исходные Host ссылки, сохраняя добавленный контент.
После удаления старых контрактов откат включает совместимую версию приложения.

## Связанные файлы

- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/Component.tsx`
- `libs/modules/social/models/widget/frontend/component/src/lib/singlepage/chat/`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/social-module/profile/chat/`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/knowledge/source/helpers.ts`
- `tools/runtime/ecommerce-widget-links.ts`
- `.agents/contracts/engineering/frontend-components.md`

## Последующие композиции

- Blog Host adapter still supplies `renderPrivateContent` and `renderProduct`.
  These readers provide actual loaded Article/Product records. Moving their
  authenticated orchestration into RBAC Widgets needs its own saved-instance
  cutover and checks of private Article access and purchasing actions.
- Website Builder Navbar receives explicit account/project controls as JSX.
  This remains the documented navigation exception rather than a page scenario.
- Social Profile overview is a public domain reader by slug and needs no
  current-Subject Widget solely to render the public Profile.

## Проверки на этапе выполнения

- Локальная база: две активные Host ссылки перенесены; повтор apply не изменяет
  записи, rollback и повторное применение сохраняют контент; финальный prepare
  содержит ноль операций. Манифесты находятся в закрытой `.artifacts` папке.
- Dev: сообщение testing4 появляется в отдельной Chrome-сессии администратора
  без перезагрузки. Один список чатов, сохранённые черновик и фокус; новых ошибок
  консоли в интервале проверки нет.
- Dev: в логах присутствуют перезапуски Next при достижении лимита памяти.
  Автоматическое увеличение dev heap удалено; лимит остаётся под управлением
  оператора. Полная сборка и dev Host не запускаются одновременно.
- Регрессия reader: Subject client передаёт очищенные props в обеих ветках;
  SDK, Provider и конструкторы представлений остаются в reader. Проверки
  подтверждают один стабильный рендер и отсутствие серверного SDK-вызова.
  Связь этой утечки с сообщённым зависанием не установлена.
- До последних изменений: dev доставляет создание и редактирование сообщения
  администратору без перезагрузки. Offline-проверка Chrome подтверждает
  восстановление пропущенного изменения после online; черновик сохранён.
- После изменения контракта URL: 1095 тестов проходят в 234 suites, TypeScript
  Host проходит, проверка импортов — 0 нарушений. Финальная сборка и проверка запущенного Host проходят; результаты ниже.

## Итоговая проверка

- Jest: 234 suites, 1095 tests; RBAC, Host, Social, Blog, Website Builder,
  shared frontend components и client API. TypeScript Host и Studio проходят.
- ESLint: 385 изменённых TypeScript/TSX/MJS файлов, без ошибок. Проверки
  направления импортов: 14770 файлов, 0 нарушений; размещение файлов и
  `git diff --check` проходят. Studio validate проходит.
- Host build: успешная сборка, проверка типов и генерация страниц. Проверка
  выполняется одним worker, с heap 4 GiB, без одновременного dev Host.
  Собранный сервер проверен на localhost:3000 с heap 2 GiB.
- Build: testing4 в Browser отправляет тестовое сообщение; администратор в
  Chrome получает его и ответ без перезагрузки. Один список чатов, сохранены
  черновик и фокус. Во время этого сценария обе консоли без ошибок.
- Build: изменение существующего сообщения с обычным JWT владельца приходит
  администратору. После offline → online приходит пропущенное изменение,
  черновик сохранён. При чтении истории внешний update сохраняет scrollTop
  3291.25 px; высота ленты меняется с 7158 до 7211 px.
- Build: переход между тредами сохраняет `/ru/`; EN список без Chat ID
  отображается без message composer. Гость получает два уведомления о входе
  и не видит сообщения. Сессия администратора восстановлена после проверки.
- Обычный QA-пользователь: чужой Chat отсутствует в списке, Chat и Knowledge
  возвращают 403; подмена Subject — 401. Служебный ключ для этих проверок не
  используется.
- Итоговая очередь: lagMs 0, pending 0, degraded false, clientFailures 0,
  lastError пустой. Счётчик dispatchFailures 13 включает попытки обращения к
  Next во время выключенного Host перед сборкой.
- В исходном HAR: 465 Chat detail запросов для 27 чатов. Новая коллекция и
  props-строки убирают эти запросы из списка; это проверено тестами и кодом.
  Сетевой счётчик build после открытия чата остаётся на 180 запросах
  в течение 69 секунд без пользовательских действий. Прямое сравнение общего числа с HAR некорректно:
  различаются история, действия, файлы и длительность записи.

Два локальных Host binding перенесены с сохранением контента; повтор apply,
нулевой prepare, rollback и повторное применение проверены. Production-данные
и PR не изменены. Изменения кода остаются незакоммиченными.

Предположение о server → client → server цикле не подтверждено. Исправлена
утечка служебных props из shared reader; её связь с зависанием компьютера не
установлена. В проверенной сборке непрерывные запросы и ошибки React-цикла не
наблюдаются. Автоматическое увеличение heap dev-сервера удалено.

Снимки и закрытые QA-манифесты находятся в
`.artifacts/chat-widget-composition/`. Этот каталог содержит сессионные данные
и не включается в коммит.

Временные API и собранный Host остановлены после проверки. Dev Host выключен;
чужие сервисы и контейнеры не изменены. Созданные для QA вкладки закрыты.
