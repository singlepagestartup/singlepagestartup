# План исправлений по ручному ревью PR #374

Статус: R01–R13 реализованы и проверены. Изменения подготовлены для повторного ручного ревью в PR #374; автоматические проверки не закрывают обсуждения и не заменяют решение человека.

| Поле                     | Значение                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| PR                       | [#374](https://github.com/singlepagestartup/singlepagestartup/pull/374)                       |
| Ветка / проверенный HEAD | `codex/studio-host-models` / `f0bf528a9db3fd681fbcc0b556ae33c8505134de`                       |
| База main                | `6664a9841bd81a9c02a711b92f1906a70ef72bcb`                                                    |
| Источники требований     | 32 построчных комментария; reviews `5530267500`, `5531869762`; задание `goal-objective.md`    |
| Ответы                   | От аккаунта `flakecode`, по одному ответу в каждой из 32 веток обсуждения; обсуждения открыты |
| Область                  | Studio, Host, frontend в libs, Knowledge/RBAC/CRM backend, правила и генераторы               |

[Полный план в обсуждении PR](https://github.com/singlepagestartup/singlepagestartup/pull/374#issuecomment-6192112844).

## Исходное состояние до реализации

Studio содержит 63 публичных модельных входа и 429 папок вариантов. В 426 Component-файлах типы объявлены внутри реализации, в 428 встречается `variant?: string`. Root Component уже выводит union из effective registry; проблема состоит в контрактах отдельных вариантов, публичных экспортах и генераторе. Число 61 в описании production catalog не заменяет фактическую инвентаризацию Studio.

Проверка 2 359 TS/JS-файлов и 7 066 импортов/glob edges обнаружила 13 Workspace → Modules импортов в трёх тестах. Isolation gate исключает `.test.tsx`. Восемь актуальных Workspace story entrypoints, включая generated products, не имеют подтверждённого runtime-пути в Modules; их transitive closure проверен. Произвольные вычисляемые import paths этим анализом не покрыты. Отмеченный Message сейчас использует локальные Workspace-файлы.

Есть 60 aliases `VariantN` в 17 Workspace-диспетчерах, семь `IdentityActionN` и четыре `SubjectActionN` в RBAC registry. Все 84 найденных `Example` — story wrappers, а не названия модельных реализаций. 87 Studio-файлов используют публичный Feature как icon; отдельный `Skeleton.tsx` найден у одного RBAC Widget.

Тесты `isolation.test.ts` + `model-entries.test.ts`: 13 pass / 1 fail. Подтверждённый fail — приватный импорт Website Builder ProjectCreateContent из RBAC Widget. Он появился при восстановлении формы с фотографией. Исправление обязано сохранить эту форму, её фотографию и отдельный выбор проектов.

KnowledgeRepository содержит 32 метода и работает с Source, Chunk, двумя связями и File. Source/SourceFiles services сами обращаются обратно в этот репозиторий/фасад. В RBAC Files handler есть дополнительный прямой вход в KnowledgeRepository. `mutateStoredFile` уже вызывает FileService внутри SQL-транзакции: утверждение о полном обходе FileService было бы неверным. Нарушение границ подтверждено кодом; конкретный обход прав не воспроизводился.

SVG → PNG сейчас поддерживается явно в MediaService, тесте и README. Требуемая политика запрещает SVG в Knowledge и должна заменить реализацию, все входы и документацию вместе. Наличие SVG само по себе не доказывает XSS.

## Порядок выполнения и владельцы

| Этап | Пункты             | Владелец файлов                                          | Условие завершения                                                                    |
| ---- | ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 0    | R13                | `.agents`, адаптеры, review evidence                     | Правила обновлены; замечания имеют пункты плана и ответы                              |
| 1    | R01–R04            | Studio Workspace, Modules, `tools/studio`                | Изоляция, публичные типы, иконки и загрузка проходят структурные и Storybook проверки |
| 2    | R05                | RBAC relation/schema/SDK/admin, Host, content-management | Аддитивная схема, проверяемый перенос конкретных связей и переключение Host           |
| 3    | R06–R08            | WB landing, RBAC/frontend, CRM                           | Demo независимо; wrappers по контракту; реальная отправка формы                       |
| 4    | R09–R11            | Knowledge, File Storage, RBAC services/handlers          | Сервисные границы без потери транзакций, ownership и mutation effects                 |
| 5    | R12 + общий прогон | Host и затронутые читатели                               | Production rendering/ISR, два подписчика и пользовательские сценарии                  |

R09 можно готовить независимо от Studio после фиксации транзакционных инвариантов. R10 должен использовать окончательные Source attachment commands R09. Перед переносом UI в libs сначала закончить его контракт и состояния в Studio. Переключение Host следует за schema/SDK и проверкой данных R05; удаление старых ветвей — после readback. Каждый этап имеет отдельный проверяемый diff.

## R01. Полная независимость Workspace

Целевые каталоги: `apps/studio/workspace/utils/products`, соответствующие Module-owned tests/fixtures и `tools/studio/design-system`. Существующие тесты/утилиты находятся именно там; новый top-level пакет не требуется.

1. Разделить проверки трёх `ai-chat-*.test.tsx` по владельцам. Workspace проверяет собственные компоненты/providers; тесты Modules находятся при Modules или в существующей инфраструктуре их проверок. Fixtures копируются в нужный владеющий слой явно.
2. Убрать исключение `.test.tsx` из isolation gate. Проверять imports/reexports, type imports, literal dynamic imports/require, aliases, CSS/assets/new URL, раскрытые globs и транзитивные переходы через tools/helpers. Не ограничивать проверку строкой `from` в Component.
3. Строить граф от реальных Workspace Storybook roots, включая generated stories и product/design globs. Отдельные Modules stories в том же Storybook допустимы; Workspace story не достигает Modules.
4. Проверить Workspace preview/global styles, fixtures и Storybook decorators: общие настройки не должны добавлять Modules imports в Workspace graph. Изолированная сборка Workspace без Modules служит дополнительной проверкой.

Приёмка: все Workspace roots доступны без Modules; positive/negative fixtures проверяют прямой, транзитивный и тестовый импорт; generated stories не возвращают связь после regeneration. Локальные Product компоненты не заменяются Module imports ради устранения дублирования.

## R02. Контракты вариантов, имена и генераторы

Целевые каталоги: существующие `apps/studio/modules/<module>/<model>`, Workspace dispatchers/stories, `tools/studio/design-system/catalog.ts`, `projection.ts` и их тесты.

- Для каждого варианта публичные props/payload types находятся в его `interface.ts`; `variant` имеет literal-тип. Общие props наследуются явно, специфичные обязательные props принадлежат варианту. Root interface экспортирует effective contract; startup заменяет props совпадающего ключа вместе с renderer. Одного root union при локальном `variant?: string` недостаточно.
- Мигрировать глубокий экспорт `ILoginCopy` из singlepage реализации в owning interface/public contract, затем обновить потребителей. Проверить base-only, startup-only, несовместимый override и неизвестный variant.
- Удалить числовые aliases во всех 17 Workspace dispatchers и RBAC registry. Имена обозначают модель/действие; registry keys, URLs и ID stories сохраняются.
- Для stories без самостоятельной композиции использовать публичную модель и decorators providers. Для самостоятельной обёртки — `Component` или содержательное имя. Не объявлять все 84 wrapper-функции дефектами production-модели.
- Генератор должен выдавать тот же interface/literal/override contract. Regeneration в изолированной fixture не перезаписывает authored startup и не возвращает inline props/широкие variant.
- SDK внутри модуля: `identityApi`; чужой SDK: `fileStorageFileApi`. Чужой компонент: `FileStorageModuleFile`; связь: `OrdersToFileStorageModuleFiles`; callback: `ordersToFileStorageModuleFiles`. Локальный renderer в readers — `ChildComponent`.

Приёмка: type fixtures выбирают разные обязательные props по variant; неверный variant/prop отвергается; startup renderer получает свой contract. Все варианты доступны через публичный entry. Проверка aliases ограничена компонентными заглушками, не запрещает числа во всех идентификаторах.

## R03. Статические иконки

Целевой каталог по требованию автора: `apps/studio/modules/shared/icon`. Это явное размещение общей статической возможности Studio. Существующие production icons находятся в `libs/shared/ui/adapter/src/lib/icons`.

Entry содержит `interface.ts`, `Component.tsx`, `index.ts`, effective `variants.ts`, registries `singlepage/variants.ts`, `startup/variants.ts`. Коллекция Phosphor располагается в `singlepage/phosphor/` с собственными interface/Component/index, каталогом glyphs и лицензией. Дополнительная custom коллекция получает свой variant, когда реально используется. `name` зависит от выбранной коллекции; startup может заменить коллекцию или добавить свою.

Мигрировать 87 icon consumers через Feature, не затрагивая настоящие Feature views. Сохранить размеры, ref, SVG props, цвет, доступность и геометрию. Workspace оставляет собственные assets и не импортирует `modules/shared`.

Приёмка: все 87 glyphs рендерятся без DB, SDK, providers и model fixtures; invalid name не компилируется; override и лицензия сохраняются. При переносе в production использовать существующий static Icon, не создавать записи Feature для отображения glyphs.

## R04. Скелетоны моделей и перенос загрузки

Покрыть все 63 текущих публичных модельных входа Studio; реестр покрытия строится из inventory, без отдельного устаревающего списка. Модель получает default Skeleton, вариант с иной компоновкой — подходящую специализацию и Loading story. Один общий RBAC workspace frame не заменяет Source/File/Profile loading.

Экспортировать Skeleton через owning entry. Production template уже принимает ReactNode: `Skeleton={<Skeleton ... />}` передаётся из index без дополнительного API-запроса/Provider. Приёмка охватывает desktop/mobile размеры, aria-busy, reduced motion, server Suspense с задержанным ответом и client pending. Не требуется обещать 429 отдельных рисунков при одинаковой компоновке.

## R05. Экземпляры Widget, связи и упрощение Host

Целевые каталоги: `libs/modules/rbac/relations`, RBAC Widget frontend, существующие Host external-widget adapters, admin-v2, `apps/mcp/lib/content-management` и runtime content-management flows.

Текущий обход: Host WB profile-create ищет RBAC Widget по variant, Host RBAC выбирает auth WB по фиксированному slug, Host WB содержит business URL/variant ветви. Целевой путь:

`Host externalModule/externalWidgetId → конкретный RBAC Widget → widgets-to-website-builder-module-widgets → конкретный WB Widget`.

Variant определяет renderer. Instance association хранится в relation с widgetId, websiteBuilderModuleWidgetId, orderIndex и нужным variant/slot по существующему CRM образцу. Auth, project list/create и Help получают связи своих экземпляров. Социальную Widget relation добавлять только для подтверждённого Social Widget consumer: существующая Social Profile→WB relation не является Widget relation, но сама по себе не требует новой неиспользуемой связи.

1. Сгенерировать RBAC relation существующим plugin, сначала dry-run. Сверить exports/aliases, backend registration/DI, SDK client/server, schema/FK/cascade, OpenAPI, admin relation tab и MCP discovery. Исправить ошибочный README существующего CRM аналога (`Forms/formId` вместо Widgets) в затронутой документации.
2. Получить реальный текущий граф через SDK/MCP, сохранить manifest ID/связей/версий. Snapshot IDs не являются доказательством live-состояния. Идемпотентно создать связи; проверить повторный запуск без дублей и readback. Сохранить Page/Layout/Host IDs и первоначальный manifest для отката. Не редактировать `data/*` snapshots и не удалять автоматически старые Social demo records.
3. Перенести создание/выбор проекта в RBAC Widget. WB хранит content card; typed form slot позволяет сохранить фотографию, подписи и форму. В Studio сначала убрать приватный cross-model импорт через публичный WB entry с конкретным variant/slot, затем повторить композицию в production.
4. Переключить Host на конкретные IDs; убрать global find по variant/slug и business variant lists. Generic ContentManagement Host traversal сейчас останавливается на externalWidget: добавить переход по новой связи, иначе UI работает, но редактор не видит nested WB.
5. Help: если требуется выбрать конкретный CRM form на экземпляре RBAC Widget, добавить адресную `rbac.widgets-to-crm-module-widgets` relation и использовать существующую CRM Widgets→Forms. Подтвердить нужную кратность/slot при реализации по фактическим Help/Auth схемам; не оставлять скрытый global slug под заявлением о полной instance-композиции.

Генерация:

```bash
npx nx generate @sps/sps-generator-plugin:relation --action=create --module=rbac --relation_name=widgets-to-website-builder-module-widgets --left_model_name=widget --left_module_name=rbac --right_model_name=widget --right_module_name=website-builder --dry-run
# После проверки повторить ту же команду без --dry-run.
npx nx run @sps/rbac:relations:widgets-to-website-builder-module-widgets:repository-generate
```

SQL/meta генерируются Drizzle, вручную не создаются. Схема сначала аддитивная; API/data cutover имеет проверенный откат. Read-доступ к публичным auth/content widgets и privileged write проверяются отдельно. Фильтр widgetId не является tenant guard: у RBAC Widget нет tenant-поля.

Приёмка: два RBAC Widget с одним renderer и разным WB content показывают свои записи; auth/logout/login, project chooser/create с фотографией, Help, locale/startup override, cache/WS и MCP editing проходят через реальные IDs. Обновление relation и WB content освежает обоих клиентов.

## R06. Landing demo без Social записи

Целевые каталоги: Website Builder landing frontend и его Studio projection. Текущий Social `id-preview-ai-chat/ClientComponent` содержит локальный scripted demo; Host adapter дополнительно требует сохранённый Chat по slug.

Перенести нужное presentation/state поведение в собственный WB ClientComponent без Social SDK/IModel-заглушки и live AI. Сохранить файлы, вопросы, документы, tabs, сообщения, reset и CTA в настоящие Projects. Никакого WB→Social импорта вверх по порядку модулей.

Приёмка: demo работает при пустой Social БД и заблокированном model gateway; состояние изолировано между посетителями; CTA ведёт в действующий production сценарий. Существующие Social records не удаляются автоматически.

## R07. Production frontend и Access

Целевые каталоги: существующие RBAC Subject variants, Ecommerce Order/Purchase readers и Host admin Access. Структура сохраняет interface/index/client/server/Component/ClientComponent по frontend contract.

- Проверить все 13 специальных Subject variants: account, identities, avatar, workspace, download, source-update, source-list, message-create, message-list, navigation, sidebar, profile-list, settings. Local readers разрешены для scoped SDK operations; не заменять их незащищённым find. Убрать дополнительный Reader dispatcher в index, оставить один Provider и loading/error owner, одинаковый result contract на client/server.
- У Workspace ClientComponent убрать повторный scoped Thread query. Query остаётся у reader с SDK subscriptions; постоянный queryFn, возвращающий старые props, не подходит. Различать network reads и адаптеры уже загруженных File данных при проверке остальных views.
- Thread create: вынести public props в interface, сохранить SDK mutation, вынести projectHref из соседнего visual variant в существующую подходящую utils область. Проверить blank/double submit, per-item pending/error, reset при смене проекта и navigation по возвращённому ID.
- Access перевести на штатный RBAC authorized-wrapper только после поддержки нужных apiProps/options. Сохранить query key route+subjectId+permission, mute/retry, отсутствие protected reads для гостя и очистку/переключение при смене пользователя. Текущий route-only key существующего wrapper не достаточен.
- Purchase total — обоснованная специализированная операция, общий Order reader её не делает. Сохранить её loading/error/refetch. Renderer alias — ChildComponent; receipt relation/File/callback names следуют R02, фильтры orderId и receipt-default сохраняются.
- Явно отбирать UI props на RSC boundary, использовать JSX slots вместо server callbacks, проверить регистрацию в owning variants/public union. Обновить противоречащий генератор, а не копировать его дефект в новые файлы.

Приёмка: public entries через реальные readers, client/server paths и protected endpoints; React Query/meta.topics, realtime, logout/login другим пользователем; без дублей запросов и сериализации SDK/Provider в client props. Визуальный mount без parent reader недостаточен.

## R08. CRM Form → Step → Input → Request

Целевые каталоги: CRM Form/Step/Input и relation frontend, RBAC Subject form-request-create/support, соответствующие backend services/handler и notification templates.

Текущая support HTML-форма обходит CRM chain. В существующем generic chain теряются form/path/disabled, индекс внутреннего Step сбрасывается в `steps[0]`, text/textarea/select пишут разные payload shapes; backend сохраняет плоский payload и часть validation выполняет после writes.

1. Загрузить конкретный Form, упорядоченные forms-to-steps и steps-to-inputs/options через штатные find relation components. Прокинуть control, уникальный стабильный path, disabled, язык и metadata. Ревалидация metadata не сбрасывает пользовательский draft.
2. Определить один typed submission contract и adapter для Notification. Поля разных Steps и одинаковые slug не пересекаются; text/textarea/select/options сохраняют форму данных.
3. Backend до записи проверяет Form ownership, принадлежность каждого Input/Option, required/value types. Request + Form–Request создаются через сервисный слой с определённой транзакцией; Notification после commit имеет определённый повтор/ошибку без двойного Request.
4. Проверить именно готовое сообщение и доставку в изолированный test sink, не отправлять сообщения реальным адресатам.

Приёмка: минимум два Step с несколькими полями, textarea/select/required, чужой Input/Option отклонён без writes, повтор submit, DB Request+relation, корректный notification payload/render. Старый smoke `supportRequestSubmitted: false` подтверждает только отсутствие полноценной отправки, а не успешный end-to-end сценарий.

## R09. Knowledge через сервисы владельцев

Целевые каталоги: существующий `libs/modules/knowledge/backend/app/api`, services Source/Chunk/SourceChunks/SourceFiles, File Storage File service/repository и RBAC Files handler. Новая layer/shared package не нужна.

Knowledge — модуль, не модель БД; искусственная `knowledge-to-sources` таблица не требуется. Модульный фасад получает `this.source`, `this.chunk`, relation services и `this.fileStorageModule.file` через DI с effective startup implementation. Каждый model/relation service обращается к своему repository. Indexer/MaterialService получают service capabilities, не общий multi-table repository.

1. Зафиксировать характеризационные tests для Source scope/order, preserved-upsert/slug uniqueness, attachment order/idempotence, expected hash/snapshot CAS, атомарной публикации chunks, shared File invalidation и confirmation recovery.
2. Создать operation-scoped service instances с общим tx. Не менять `repository.db` singleton на время запроса. Сохранить File-before-Source locks, sorted multi-ID locks, reread relation и slug advisory lock. Внутри SQL transaction не выполнять SDK HTTP.
3. Перенести все 32 метода по таблице ниже. Сначала убрать обратные Source/Relation→KnowledgeRepository вызовы, иначе DI создаст рекурсию. Primitive relation service возвращает affected IDs; orchestrator вызывает Source invalidation и post-commit analysis.
4. Generic Source/Relation CRUD, admin/SDK/MCP и RBAC Files handler должны использовать те же commands. Последний сейчас вызывает `new KnowledgeRepository`, sourceFiles/setFiles/findSourceById напрямую.
5. Model/embedding ошибки не отменяют сохранённые пользовательские заметки. Storage provider delete имеет отдельные компенсации: общий SQL tx не возвращает удалённые bytes. На rollback не публиковать event; после commit bump кеша предшествует WS. CLI/background получают явный mutation effects path.

Строки inventory относятся к `libs/modules/knowledge/backend/app/api/src/lib/repository.ts` на проверенном HEAD.

| Метод:строка                    | Данные сейчас                                                          | Владелец после рефакторинга                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sourceCrud:47                   | SourceRepository + generic CRUDService                                 | Удалить wrapper; SourceService → собственный SourceRepository.                                                                                                                               |
| getStatus:53                    | Source + Chunk count SQL                                               | KnowledgeService → SourceService.count и ChunkService.count.                                                                                                                                 |
| findSourceById:60               | Source generic CRUD                                                    | SourceService.findById.                                                                                                                                                                      |
| findSourcesByIds:64             | Source SELECT                                                          | SourceService.find с IDs; порядок ответа и пустой scope сохраняет фасад.                                                                                                                     |
| listSourcesForIndex:72          | Source SELECT/limit                                                    | SourceService index candidates → свой repository.                                                                                                                                            |
| upsertSourceBySlug:79           | Source advisory lock + SELECT/create/update                            | SourceService atomic preserved-upsert → свой repository; сохранить slug lock/unique.                                                                                                         |
| updateSource:106                | Wrapper aggregate update                                               | SourceService command.                                                                                                                                                                       |
| updateSourceWithAttachments:110 | File lock; Source lock/write; relation append; derived invalidation    | SourceService command → File/SourceFiles/Chunk/SourceChunks services, общий tx.                                                                                                              |
| deleteSourceWithDerivedData:158 | Source + derived chunk/link delete                                     | SourceService aggregate delete → relation/chunk services, Files сохраняются.                                                                                                                 |
| clearSourceChunks:172           | SourceChunks SELECT/DELETE + Chunk DELETE                              | SourceChunksService list/unlink; ChunkService delete, общий tx.                                                                                                                              |
| clearDerivedData:189            | Все Chunk/SourceChunks + Source index markers                          | Internal rebuild command через Source/Chunk/relation services.                                                                                                                               |
| invalidateFileContent:202       | Source hash CAS + strip content + clear chunks                         | SourceService conditional invalidation + child services.                                                                                                                                     |
| publishChunks:229               | Source hash lock; Chunk/SourceChunks inserts; index markers            | SourceService publish command → Chunk/SourceChunks; единый tx.                                                                                                                               |
| saveAnalyzedContent:264         | Source hash CAS; SourceFiles/File snapshot join; Source update         | SourceService conditional publish → relation/File service snapshot в том же tx.                                                                                                              |
| sourceFiles:316                 | Ordered SourceFiles/File join                                          | SourceService → SourceFilesService.find → FileService.findByIds; сохранить форму и порядок результата.                                                                                       |
| relationCrud:337                | Generic relation CRUD/rebound db                                       | Удалить wrapper; effective SourceFilesService → свой repository.                                                                                                                             |
| lockFiles:347                   | File lock/order/missing check                                          | FileService reference-lock → FileRepository; structured missing error сохраняется.                                                                                                           |
| lockSources:373                 | Ordered Source locks                                                   | SourceService → SourceRepository.                                                                                                                                                            |
| invalidateSources:383           | Source/user text + Chunk/relations                                     | SourceService material invalidation.                                                                                                                                                         |
| mutateFileRelation:404          | Relation/File/Source locking; relation CRUD + Source invalidation      | Source attachment command; relation service владеет своими CRUD. Прямые relation HTTP CRUD направить в этот же command.                                                                      |
| mutateStoredFile:456            | File lock/affected Source capture; FileService mutation; invalidation  | KnowledgeService orchestrates FileService + relation lookup + Source commands.                                                                                                               |
| attachFiles:493                 | File/Source locks; append; invalidation                                | SourceService.appendAttachments.                                                                                                                                                             |
| appendSourceFiles:503           | Existing links/order; unique append                                    | SourceFilesService operation под блокировкой Source aggregate.                                                                                                                               |
| fileSourceIds:529               | Reverse SourceFiles lookup                                             | SourceFilesService.                                                                                                                                                                          |
| setFiles:542                    | File/Source locks; expected hash + ordered File IDs; set/reorder links | SourceService.replaceAttachments → relation service, один tx.                                                                                                                                |
| ensureFileForSource:598         | Links; raw File insert; append                                         | Index import → FileService.import/create + SourceService.attach.                                                                                                                             |
| searchChunks:613                | Chunk/SourceChunks/Source vector join/freshness                        | Source scoped retrieval → relation/Chunk services; vector SQL в ChunkRepository, доступ к owner tables через owner services. Сохранить materialized scoped candidates vs ranked global HNSW. |
| findNeighborChunks:666          | Three-table join/range/freshness                                       | SourceService → SourceChunksService + ChunkService range query.                                                                                                                              |
| toSlug:694                      | Pure path helper                                                       | Existing service/utils.ts пока приватный; established shared utils при реальном повторном использовании.                                                                                     |
| createFilePayload:701           | fs bytes/metadata/Provider upload                                      | FileService import/upload; Knowledge validates до вызова.                                                                                                                                    |
| detectFileType:733              | file-type + special SVG extension                                      | FileService metadata detection; Knowledge отдельно запрещает SVG.                                                                                                                            |
| detectImageDimensions:747       | image-size                                                             | FileService metadata detection.                                                                                                                                                              |

Приёмка: delegation к effective service и отказ дочернего сервиса, PostgreSQL rollback/lock/CAS с настоящими UUID fixtures и cleanup, параллельные запросы не разделяют tx. Перенести repository integration сценарии на service entrypoints; fault после relation create/chunk insert, concurrent edit/move/File delete, provider failure, confirmation recovery. Scoped retrieval сохраняет freshness и ранжирование; перенос join не должен превратить каждый candidate в отдельный network request.

## R10. SVG не входит в Knowledge

Целевые каталоги: действующие attachment guards/utils, Knowledge Source attachment commands/MediaService, RBAC message/files/AI document/context, index CLI и File attachment UI. File Storage остаётся самостоятельным нижним модулем.

Проверять весь batch до первого upload/link/Source write. Extension/URL basename, MIME и bounded byte sniffing должны распознавать переименованный SVG, SVGZ, XML prolog/BOM/UTF-16 и пустой/octet-stream MIME. Не выполнять SVG render, external entity expansion или model request при проверке. Обычная Markdown-заметка с примером `<svg>` не равна SVG attachment.

Одинаковая политика нужна во всех путях:

- multipart Message create и Source files upload/replace;
- уже загруженные File IDs, append/set/updateSource, generic SourceFiles CRUD/admin/SDK/MCP;
- `/learn`, document create/edit/propose/confirm и background reanalysis;
- index/import CLI, включая замаскированный `content.txt`, dry-run без writes/model calls;
- rebuild/material analysis и повторная проверка bytes после generic File update;
- исторические AI attachments до image_url/file_url/text payload;
- Knowledge UI: blocked generic card для legacy SVG, без img/iframe/object и active image link из Knowledge.

Original File сохраняется; неподдерживаемое вложение не становится applied draft и не публикует частичный generated index. Общая serving/download policy File Storage проверяется отдельно, без импорта Knowledge вверх в File Storage. Текущая SVG→PNG ветка, accepted-SVG unit и README заменяются запретом; SVG fixture в document integration заменяется supported fixture и отдельным rejection case.

Приёмка: матрица MIME/имя/bytes/legacy/existing IDs/CLI/generic relation/history, ноль upload/link/Source writes для rejected new batch и ноль model/sharp SVG rendering для legacy. PNG/JPEG/WebP/GIF/PDF/text — positive controls. Проверка реальным HTTP и DOM дополняет unit stubs; exploit не объявляется без воспроизведения.

## R11. RBAC service facades, Identity и checkout

Целевые каталоги: существующие Subject service/controller/middlewares, Identity service и bootstrap; не импортировать приватный ProfileSkills в controller.

1. Identity update вызывает `this.service.identity.changePassword`; self-HTTP findById/update внутри Identity service также заменяются собственными методами. Текущая проверка JWT Subject и Subject–Identity уже существует. Перенести guard в экспортируемый middleware package с тем же JWT требованием: существующий owner middleware, принимающий secret без JWT, не является готовой заменой. Negative tests проверяют password body и отсутствие changePassword при чужом Subject/Identity/нет relation/wrong password; response не содержит credentials.
2. Message create использует публичный typed Subject service method для document skill. ProfileSkills создаётся внутри service layer с startup override. Выбор ограничен сохранённой Thread metadata и разрешёнными Profile/Chat/Thread связями; client skill IDs не расширяют доступ.
3. Product checkout извлечь в общую Subject service capability: handler и оба Proceed пути (free/Telegram Stars renewal) вызывают её напрямую. Текущий `ecommerceOrderCheckout` — другая стадия. Сохранить Order + SubjectOrder/OrderProduct/StoreOrder/OrderCurrency mutations и компенсации. Внешний Product route разрешает `ecommerce.checkout`; актуальность Order сейчас обеспечивают вложенные SDK writes. При сохранении внутренних SDK mutations не переписывать их в DI без отдельного mutation-effects решения.
4. Проверить все входы: Subject PATCH, generic Identity change-password, Product checkout, check/id-check и cron. Внутренний HTTP сейчас несёт middleware effects; после удаления явные topics должны покрывать реальные затронутые модели/связи, а не только внешний route alias. Bump до WS, local patch не заменяет второго клиента.

Приёмка: service delegation/startup override, ownership negative tests, свободное продление/Stars renewal/duplicate/no invoice/compensation, warm GET → mutation → GET, второй subscribed client. Платные операции и реальные уведомления заменяются test providers.

## R12. Static params, ISR и production поведение

`apps/host/app/[[...url]]/page.tsx` сохраняет `dynamicParams=true`, `revalidate=86400` и возвращает `[]` из generateStaticParams. В исходной production-ветке также был пустой список; удалён dev-перебор всех URL, вызывавший большой cache item. Build отмечает catch-all как SSG, но не доказывает фактическую ISR-семантику каждого маршрута.

Проверить на отдельном production runtime первую/повторную публичную страницу, response/cache observations, revalidation после Content/Relation write, фактические dynamic fetches и отсутствие identity-scoped данных в общем кеше. Authenticated чаты проверяются двумя пользователями. Если нужен prebuild публичных URLs, использовать ограниченный явный список после согласования политики прогрева; массовое перечисление пользовательских сущностей не возвращать.

Файлы шрифтов проверять в dev и production Webpack: file URL, относительный `/_next/static/media` и HTTP URL. Существующий production font fix не удалять как лишний fallback. Telegram business module остаётся удалённым, `apps/telegram` и Agent/Notification transport сохраняются.

## R13. Правила review-pr и будущие проверки

Внесены изменения в `.agents/workflows/engineering/review_pr.md`: Studio transitive isolation, interface/literal/override, aliases/stories, static icons/Skeleton, instance relation composition, CRM submit, service ownership/tx, transport effects, SVG и SSG/ISR evidence. `.agents/contracts/engineering/frontend-components.md` уточняет публичные типы, имена imports, ChildComponent, один reader owner и недопустимость stale constant queryFn. Тонкие Codex/Claude adapters направляют к этому общему процессу. `design-to-implementation.md` приведён к фактическому плоскому Studio model layout; relation projections сейчас исключены.

Независимая read-only проверка обновлённого навыка подтвердила обнаружение Workspace test imports, приватного model import, variant-local props, icon ownership, service bypass и SVG policy. Public union и отсутствие build enumeration описываются без недоказанных функциональных выводов. Scope frontend contract включает Studio, имена SDK имеют примеры внутри/между модулями, обязательные structural findings отделены от functional bugs. Studio README согласован с interface.ts.

YAML metadata и маршруты обоих адаптеров проверены через установленный js-yaml; Prettier и git diff --check проходят. Штатный skill-creator quick_validate.py не запускается: PyYAML отсутствует и в системном, и в bundled Python. Этот ограниченный metadata check не заменяет поведенческую проверку, выполненную отдельно.

Это инструкции для агента. Автоматические source gates — отдельная часть реализации R01–R04/R09, ещё не написанная. Добавить regression fixtures, которые находят Workspace→Modules через test/helper/glob, приватный cross-model import, numeric component aliases, отсутствие variant contract/registration, icon через Feature, неиспользуемый Skeleton и foreign repository construction. Для generator output требуется idempotence test. Межмодульные исключения и реальные семантические случаи разбирает reviewer; regex не заменяет ownership analysis.

## Проверки реализации

Исходный planning baseline: Studio 13 pass / 1 fail; Knowledge media/materials/indexer 3 suites / 12 tests pass. Результаты реализации и финального прогона приведены ниже; исходный baseline не считается проверкой исправлений.

После этапов запускать релевантные checks; полный scoped прогон — после собранного решения:

```bash
bun test tools/studio/design-system/isolation.test.ts tools/studio/design-system/model-entries.test.ts
npm run studio:presentation:test
npm run studio:validate
npm run studio:storybook:build
npm run test:unit:scoped
npm run test:integration:scoped
npx tsc --noEmit -p apps/host/tsconfig.json
npx tsc --noEmit -p apps/api/tsconfig.json
```

Доступные target names/schema проверить перед запуском. Drizzle generate относится только к затронутым relations. Для старых API TypeScript diagnostics сохранить baseline по file/code/message и сравнивать новые; зелёный Host не означает зелёный API. Тесты Postgres требуют инфраструктуры; fault tests используют fake storage/model gateway, без paid AI и writes в пользовательские проекты.

Runtime-проверка: отдельные test fixtures/accounts, production Host + реальный API; projects list/create с прежней фотографией; login/account switch; Thread creation/navigation; несколько CRM Steps и конечный notification sink; supported attachment upload/reorder/detach/confirm/reload и SVG rejection; исходные Files остаются; cache warm/mutate/refetch + два WebSocket subscribers. Browser/server console, network и RSC ошибки входят в evidence. Fixed-subject destructive scenario без изолированных UUID не запускать.

## Покрытие комментариев

Каждый пункт ниже имеет исходный ответ `flakecode` с планом изменения или проверенным объяснением. Реализация и её проверки дополняют эти ответы; ссылки сохраняют историю обсуждений. Review summaries по Studio и общей структуре покрываются R01–R13; они не обозначены как approved/resolved.

| Комментарий                                                                                          | Пункт   | Предмет                                  | Ответ                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [4280765808](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4280765808) | R12     | generateStaticParams / production ISR    | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282884420) |
| [4280793849](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4280793849) | R07     | Host Access / framework wrapper          | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282921389) |
| [4281412058](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281412058) | R02     | Source variant interface                 | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282921692) |
| [4281494693](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281494693) | R03     | Static shared icons                      | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282921912) |
| [4281564551](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281564551) | R02     | IdentityAction aliases                   | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282922163) |
| [4281577450](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281577450) | R02     | Subject public types                     | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282922414) |
| [4281607328](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281607328) | R04     | Model Skeletons                          | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282922666) |
| [4281796224](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281796224) | R02     | Example story wrapper                    | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282922967) |
| [4281884862](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281884862) | R02     | File VariantN aliases                    | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282923222) |
| [4281889595](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281889595) | R02     | Page VariantN aliases                    | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282923510) |
| [4281910074](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281910074) | R01     | Workspace isolation                      | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282923819) |
| [4281992056](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4281992056) | R08     | CRM Form/Step/Input/submit               | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282924224) |
| [4282005723](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282005723) | R07     | ChildComponent renderer                  | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282884742) |
| [4282020577](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282020577) | R02/R07 | Relation alias                           | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282885091) |
| [4282027550](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282027550) | R02/R07 | Foreign File component alias             | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282885321) |
| [4282033800](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282033800) | R02/R07 | Relation callback data                   | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282885608) |
| [4282140512](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282140512) | R05     | WebsiteBuilderModuleWidget alias         | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282885857) |
| [4282171933](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282171933) | R05     | RbacModuleWidget alias                   | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282886092) |
| [4282190741](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282190741) | R05     | RBAC project ownership                   | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282924478) |
| [4282243828](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282243828) | R06     | Local landing demo                       | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282924728) |
| [4282266082](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282266082) | R05     | Explicit instance composition            | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282924997) |
| [4282301071](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282301071) | R09     | Source/File service chain                | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282925309) |
| [4282313914](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282313914) | R09     | Knowledge repository refactor            | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282925567) |
| [4282335093](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282335093) | R10     | SVG policy                               | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282925879) |
| [4282462484](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282462484) | R11     | Identity service/ownership               | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282886512) |
| [4282519002](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282519002) | R11     | Public Subject skill capability          | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282886769) |
| [4282581791](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282581791) | R02/R09 | File API alias / hidden repository entry | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282886278) |
| [4282640843](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282640843) | R11     | Proceed checkout / effects               | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282886993) |
| [4282745406](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282745406) | R07     | Avatar index                             | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282926168) |
| [4282755468](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282755468) | R07     | Avatar server reader                     | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282926457) |
| [4282763196](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282763196) | R07     | Thread create                            | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282926781) |
| [4282775884](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282775884) | R07     | Workspace index/read ownership           | [Опубликован](https://github.com/singlepagestartup/singlepagestartup/pull/374#discussion_r4282927025) |

## Состояние исполнения

- [x] Проверенные пути, требования и все 32 комментария сопоставлены плану.
- [x] Ответы опубликованы без закрытия обсуждений.
- [x] Общие правила и адаптеры обновлены.
- [x] Реализованы R01–R12 и source regression gates R13.
- [x] Пройдены migration, production runtime и реальные двухклиентские cache/WebSocket проверки; ограничения браузерного прогона перечислены ниже.
- [ ] Изменения повторно рассмотрены человеком.

Изменения production-кода, схем и генераторов внесены. Финальные результаты проверок записаны ниже. Пять исходных незакоммиченных файлов пользователя вне этого задания исключаются из коммита.

## Результат реализации

- R01: Workspace не импортирует Modules, включая тесты и транзитивные helpers; реальные story roots проверяются AST gate и отдельной Vite сборкой. Module-owned сценарии перенесены к своему владельцу. Локальные assets и шрифты Workspace независимы.
- R02–R04: публичные literal interfaces и startup replacement contracts охватывают все варианты; stories используют публичные входы. Числовые aliases заменены именами моделей. Добавлен статический Icon с Phosphor/custom коллекциями, лицензией и типами glyphs. Все 63 модельных входа экспортируют Skeleton; Source/Profile/Chat/Thread имеют собственные Loading состояния. Генераторы воспроизводят контракт.
- R05: сгенерированы RBAC Widget→WB Widget и Widget→CRM Widget relations со схемами, API/SDK/admin/MCP. Host получает конкретные IDs, вложенная композиция принадлежит RBAC. Фото и подпись формы создания сохранены.
- R06: walkthrough главной страницы хранит демонстрационные файлы, сообщения и темы в локальном state; Social Chat и AI API для demo не нужны.
- R07: специализированные readers используют index/client/server/Component/ClientComponent, типы SDK и один Provider. Уже загруженные SDK результаты передаются дочернему renderer через `dataSource="props"`; query и realtime остаются у родителя. Access использует публичную authorized композицию. Добавлены loading, option-merging, serialization и subscription регрессии.
- R08: Support проходит Form→Steps→Inputs→Request. UUID полей и Option сохраняются в типизированном wire payload, несколько шагов не сбрасывают draft при refetch. Backend проверяет актуальную структуру, атомарно сохраняет Request со связью и использует idempotency key. Receipt различает сохранение и delivery `sent`/`failed`/`queued`; повтор запроса не дублирует уведомление. Реальные уведомления в проверках заменены sink.
- R09: Knowledge facade и Indexer делегируют Source service; SQL принадлежит сервисам/репозиториям своих сущностей. Operation-local transaction instances сохраняют effective startup методы, locks, CAS и atomic indexing. Retrieval использует согласованный snapshot. Mutation effects публикуются после commit.
- R10: SVG запрещён по расширению, MIME и реальному корню документа на всех Knowledge ingress; исходные Files не удаляются. Legacy SVG отображаются blocked cards без активного preview/download. Обычный Markdown с примером SVG остаётся текстом; поддерживаемые PNG/PDF проходят положительные проверки.
- R11: Identity обновляется через сервис владельца с JWT/Subject ownership middleware. Document Skill использует публичный Subject facade. Free/Stars checkout делит один service handler и сохраняет startup overrides и mutation effects.
- R12–R13: catchall сохраняет dynamic params и ISR без полной генерации entity URLs. Добавлен `check:module-dependencies`: imports, types, reexports, literal dynamic/require и neutral barrels сверяются с одним каноническим порядком. Проверки frontend/Studio отражены в review-pr и генераторах.

## Локальный перенос связей Widget

Перенос выполнен только в локальном API: 38 операций, шесть WB targets и Help Form→Step→Input/options. Повторный apply не сделал записей; новый prepare вернул 0 операций. Исходные WB/Form записи совпадают с before-readback. Пользовательские Subjects/chats не менялись.

CLI учитывает реальные особенности CRUD: server-generated ID сохраняется в manifest и подставляется в зависимые операции; PATCH/rollback передаёт полный набор текущих FK. Ответ потерянного create восстанавливается только по однозначному natural key.

Manifest: `/private/tmp/pr374-widget-cutover-local-manifest.json`; SHA-256 `c4a03a0a0ee7a860bfad8c17f0f2a60c486da54f6084e180317592fbe127f8e8`. Manifest содержит локальные IDs и не включается в перенос данных другого проекта.

```bash
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/ai-chat-widget-links.ts rollback /private/tmp/pr374-widget-cutover-local-manifest.json
```

Для другого окружения сначала применить сгенерированные migrations, подготовить собственный manifest из актуальных IDs, проверить before-state, выполнить apply и readback. Repository data snapshots для этого не редактируются.

## Финальная проверка, 15 октября 2026

| Проверка                          | Результат                                                                                                                                                                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:unit:scoped`        | 23 проекта, 301 suite, 1 361 test; exit 0.                                                                                                                                                                                                    |
| `npm run test:integration:scoped` | 16 проектов, 29 suites, 91 test; exit 0. Отдельная БД `sps_pr374_tests`; пропущенных suites/tests нет.                                                                                                                                        |
| Studio/Workspace presentation     | 368 tests; Modules/design-system отдельно 186 tests. Оба прогона без fail.                                                                                                                                                                    |
| Studio validate / Storybook       | TypeScript и 135 structural tests проходят; Storybook production build exit 0. Workspace content check сохраняет 5 исходных gaps: 1 structural и 4 approval; решения человека не подтверждались автоматически.                                |
| TypeScript                        | Host, Studio, MCP, runtime CLI и строгая generator fixture проходят. API: те же 22 baseline diagnostics; новых file/code/message нет после нормализации смещённых строк и эквивалентного порядка Blob/Buffer union.                           |
| Module order / placement          | 14 772 TS/JS source files, 0 upward dependencies; 4 gate regression tests. Совпадающих file/folder имён в изменённых исходниках нет.                                                                                                          |
| Real transport                    | Production HTTP cache + local Redis + Bun TCP/WebSocket; оба клиента видят 10 из HIT, после отложенного bump и события сразу 20. До bump событий нет. Два WS закрыты, TCP listener закрыт, Redis fixture keys — 0.                            |
| Production Host                   | Полный Webpack build exit 0, отдельный `next start` на 3103 из `apps/host`. Публичный `/en` обслуживается из ISR cache; после `/api/revalidate?tag=/api/host/pages` следующий ответ — MISS. Пустой manifest не отключает on-demand rendering. |
| Fonts                             | Dev и production image-generator возвращают 640×360 PNG, 22 401 bytes. Production SHA-256 совпадает с проверенным dev output: `2fe617a48701642d9262011cdc61533c2a0340b1afb27c6cff472d450d8cac70`.                                             |
| Formatting / diff                 | Prettier для изменённых code/docs и `git diff --check` проходят. Generated Drizzle meta и inventory остаются в формате своих генераторов.                                                                                                     |

Логи финальных общих прогонов: `/private/tmp/sps-pr374-unit-final.log`, `/private/tmp/sps-pr374-integration-final.log`, `/private/tmp/sps-pr374-presentation-final.log`, `/private/tmp/sps-pr374-storybook-final.log`, `/private/tmp/sps-pr374-host-build-8gb.log`. API comparison: `/private/tmp/sps-pr374-api-tsc-final-comparison.json`.

Браузер: локальный walkthrough выполнен до редактирования draft и новой demo темы с пятью документами, затем reset; реальных Chat/AI writes нет. Форма создания с прежней фотографией и возвратом в chooser проверена без submit. Production Help показывает все три поля и семь Topic options без fetch/RSC/hydration ошибок; форма не отправлялась. Mobile viewport имеет фактическую CSS-ширину 390 px без горизонтального переполнения до и после локального сообщения. В отдельной guest Chrome-сессии `/ai-chat/projects` перенаправляет на Sign in без списка проектов; синтетический private route показывает Page not found. Открытие существующей приватной переписки автоматическая проверка отклонила из-за риска раскрытия данных; её содержимое не открывалось. Полный browser evidence: `/private/tmp/sps-pr374-browser-final.md`.

Границы проверки: paid AI, реальные уведомления, платежи и удаление аккаунта не запускались. Повторная проверка Help на dev origin столкнулась с CDP timeout; production Help работает. Alternate guest origin `127.0.0.1` показывал fetch toasts, штатный production origin — нет. Существующая server-side Node 24/i18n диагностика `localStorage.getItem is not a function` воспроизводится и остаётся вне этих исправлений; успешный browser smoke не означает отсутствия этой серверной диагностики. Внешний storage delete сохраняет прежнюю семантику Provider: SQL rollback не восстанавливает уже удалённые bytes. Полный Docker deployment не выполнялся.
