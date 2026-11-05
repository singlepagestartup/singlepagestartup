---
repository: singlepagestartup
issue_number: 372
status: Research Needed
created: 2026-10-09
---

# Issue: Мутации Knowledge могут оставлять HTTP-кэш и подписки других моделей устаревшими

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/372
**Status**: Research Needed
**Created**: 2026-10-09
**Priority**: medium
**Size**: medium
**Type**: bug

---

## Problem to Solve

Knowledge изменяет записи Files и других моделей через их backend service/repository и прямые SQL-запросы. Обновление HTTP-кэша и уведомления клиентов находятся в middleware API и определяются маршрутом внешнего запроса. Эти middleware не видят, какие таблицы изменил вложенный вызов.

Если внешний маршрут не инвалидирует все затронутые модели, база уже содержит новые данные, а API и открытые клиенты могут продолжать показывать старые. Для `/api/knowledge/files/:id` такая неполная инвалидация подтверждается текущим кодом PR #371.

## Какой сбой может возникнуть

При включённом HTTP-кэше и сохранённом ответе GET:

1. Клиент получает список через `/api/file-storage/files`, ответ попадает в кэш.
2. Удаление через `/api/knowledge/files/:id` вызывает `FileService` внутри Knowledge и удаляет запись Files.
3. Middleware инвалидируют маршрут Knowledge и topics `knowledge.files`, `knowledge.files.<id>`. Topic `file-storage.files` не меняется.
4. Повторный GET списка Files может вернуть удалённый файл из кэша. Открытие файла или следующая операция с ним уже не находят данные. Подписанные на `file-storage.files` клиенты также не получают нужного уведомления.

Обратный сценарий: Knowledge создаёт Files прямым `db.insert`, но ранее закэшированный список остаётся пустым. При обновлении файл может отображаться со старым названием или другими полями. Аналогичный риск нужно проверить для Sources, Chunks и relations при индексации: результат записи в БД и результат чтения через API могут расходиться до истечения TTL или другой инвалидации.

## Key Details

Проверяемая ревизия: `d08dc32793470f6eb186311c3bc2eed16dfb85b5`, PR [#371](https://github.com/singlepagestartup/singlepagestartup/pull/371). Исходный [комментарий ревью](https://github.com/singlepagestartup/singlepagestartup/pull/371#discussion_r4224309451).

- [`mutateStoredFile`](https://github.com/singlepagestartup/singlepagestartup/blob/d08dc32793470f6eb186311c3bc2eed16dfb85b5/libs/modules/knowledge/backend/app/api/src/lib/repository.ts#L426-L460) создаёт `FileRepository` и `FileService`, передаёт им транзакцию и вызывает update/delete без File Storage API.
- [`ensureFileForSource`](https://github.com/singlepagestartup/singlepagestartup/blob/d08dc32793470f6eb186311c3bc2eed16dfb85b5/libs/modules/knowledge/backend/app/api/src/lib/repository.ts#L550-L562) вставляет запись Files прямым SQL-запросом.
- [`publishChunks`](https://github.com/singlepagestartup/singlepagestartup/blob/d08dc32793470f6eb186311c3bc2eed16dfb85b5/libs/modules/knowledge/backend/app/api/src/lib/repository.ts#L208-L240) изменяет Chunks, Source-to-Chunks и поля индексации Source в транзакции.
- [`http-cache`](https://github.com/singlepagestartup/singlepagestartup/blob/d08dc32793470f6eb186311c3bc2eed16dfb85b5/libs/middlewares/src/lib/http-cache/index.ts#L315-L359) меняет версии кэша после успешной HTTP-мутации по её пути и topics. [`revalidation`](https://github.com/singlepagestartup/singlepagestartup/blob/d08dc32793470f6eb186311c3bc2eed16dfb85b5/libs/middlewares/src/lib/revalidation/index.ts#L91-L120) уведомляет клиентов по тому же внешнему маршруту.
- [Правила topics](https://github.com/singlepagestartup/singlepagestartup/blob/d08dc32793470f6eb186311c3bc2eed16dfb85b5/libs/shared/utils/src/lib/topics/singlepage.ts#L16-L45) покрывают `/api/file-storage/files`, `/api/knowledge/sources` и связь Source-to-Files. Для `/api/knowledge/files/:id` соответствующего правила нет; `/api/knowledge/index` разрешается в `knowledge.index`.

Расхождение маршрутов и topics проверено по коду и вызовом resolver. Воспроизведение через работающий HTTP-кэш и второго клиента ещё не выполнено. Частота пользовательских сбоев неизвестна; развёрнутых версий с использованием Knowledge сейчас нет.

Прямое чтение из repository само по себе не создаёт этот сбой. Для мутаций нужно проверять всю цепочку: некоторые внешние маршруты уже имеют достаточную инвалидацию зависимых моделей.

## Implementation Notes

- Составить список затронутых мутаций Knowledge: создание, изменение и удаление Files, изменение вложений, анализ и индексация. Проверить похожие обращения между модулями в PR.
- Для каждой операции сопоставить изменённые модели с HTTP-кэшем, topics WebSocket и revalidation потребителей.
- Воспроизвести сценарии с включённым кэшем и установить, как часто соответствующие операции используются, сколько живёт устаревший ответ и какие действия пользователя ломаются.
- Оценить варианты: вызов через server SDK/API либо использование существующего механизма явной инвалидации для составной операции. Учесть, что замена прямых вызовов отдельными HTTP-запросами меняет границы текущей общей транзакции и обработку частичного сбоя.
- Сохранить направление зависимостей Knowledge → File Storage. File Storage остаётся нижним уровнем и не импортирует Knowledge.

Разработчик выбирает объём исправления по последствиям и частоте. Для временного кода или редкого сценария допустимо документированное исключение с условиями, при которых к вопросу нужно вернуться. Для регулярно используемой операции с воспроизводимым сбоем нужна согласованная инвалидация. Переписывание архитектуры не является заранее выбранным решением.

## Критерии завершения

- [ ] Описаны затронутые операции, условия возникновения сбоя, последствия и известная частота либо отсутствие данных о ней.
- [ ] При исследовании проверены прогретые GET-ответы до и после create/update/delete, изменения вложений и индексации; отдельно проверен второй клиент с подпиской. Настройки без кэша и запросы `no-store` служат контрольными сценариями.
- [ ] Зафиксировано решение разработчика: исправление с необходимыми проверками или обоснованное исключение/отсрочка. Сохранение транзакций и направление зависимостей учтены в решении.
- [ ] При исправлении повторный GET и уведомления клиентов соответствуют состоянию БД для затронутых моделей; проверка обращений между модулями добавлена в правила ревью PR.

Приоритет: `medium`. Размер исследования: `medium`. Тип: `bug`. Связанные механизмы кэша и обновления клиентов описаны в [#195](https://github.com/singlepagestartup/singlepagestartup/issues/195).
