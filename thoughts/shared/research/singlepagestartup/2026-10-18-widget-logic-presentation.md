---
date: 2026-10-18
repository: singlepagestartup/singlepagestartup
branch: codex/studio-host-models
base_commit: 3eede112773ca28820e65d0b07ff148956245c53
scope: AI Chat Widget composition and follow-up candidates
---

# Логика Widget и представление Website Builder

## Контракт

Доменный Widget владеет Subject, правами, SDK-запросами, выбором формы,
мутациями и состояниями операции. Website Builder Widget владеет компоновкой,
изображениями и редактируемым контентом. Доменный Widget передаёт функциональное
содержимое через children или другой типизированный JSX-слот. Стандартная связь
хранит ссылки, порядок и общие параметры, загружает связанный экземпляр и
передаёт слот без знания бизнес-сценария.

Разные операции требуют отдельных доменных вариантов; разные компоновки —
вариантов представления. Замена текста или фотографии в записи не требует
нового доменного варианта. Формы, поля, строки сущностей и их локальное
состояние могут оставаться в доменном children: правило не требует переносить
каждый JSX-элемент в Website Builder.

Обязательный источник для разработки и ревью:
`.agents/contracts/engineering/frontend-components.md`, раздел
`Functional Widgets and presentation Widgets`.

## Область текущего изменения

Шесть RBAC Widget-сценариев используют default-связи: вход, регистрация,
восстановление и сброс пароля, создание/выбор проекта и Help. Отдельного
бизнес-режима в relation renderer нет. Четыре варианта авторизации имеют свои
Website Builder варианты и общий статический layout внутри этого модуля.
Website Builder не импортирует RBAC и не выбирает форму. В Studio три публичных
варианта RBAC Widget собирают формы входа, регистрации и Help; соответствующие
Host Page используют эти Widget entries. Прототипы сохраняют независимые
fixtures и не подключают production SDK.

Перенос через `tools/runtime/ai-chat-widget-links.ts` сохраняет ID существующих
связей, порядок, className и исходный общий Website Builder Widget. Отдельные
представления копируют его локализованные поля и исходящие связи с файлами,
features, button arrays, logotypes и sliders. Исходные файлы и дочерний контент
сохраняются. Generated migration удаляет только специальный индекс; стандартные
FK, каскады и уникальность пары остаются. Исходные записи и manifest находятся в
игнорируемой `.artifacts/widget-default/`, без credentials в manifest.

## Параметры страницы и Host-адаптеры

Реализация routeParams использует сохранённую маску Page.url. findByUrl
возвращает IResolvedPage — исходную Page и вычисляемую карту с полными именами
placeholder. Поле не хранится в таблице. Общий extractRouteParams находится в
существующем shared-utils/routes; backend и совместимый urlSegmentValue
используют один разбор. Скалярный ответ и legacy partial-name selection
сохраняются. Несуществующий ключ возвращает null, включая маршрут с пропущенной
pagination; значение 1 относится только к pagination token.

Host entrypoint удаляет locale и разрешает Page. Leaf-композиция внешнего Widget
использует Page render-reader и передаёт полную карту routeParams в Widget
модуля. Верхние Page, Layout и Host Widget передают URL и готовые nodes; карта
через них не проходит. Widget модуля выбирает полные ключи своей операции,
проверяет обязательные значения и передаёт Content/Subject явные props.
RBAC не импортирует Host; общий readonly IRouteParams находится в shared-utils.

В базовом дереве Host было 23 JSX-вызова url-segment-value в 17 файлах. В текущих
адаптерах таких вызовов нет. Частные реестры rbac/widget и rbac/subject удалены
из Host. Публичный RBAC Widget entrypoint рендерит сохранённый variant точного
Widget с dataSource=props. Семь legacy Widget-композиций находятся в RBAC рядом
со своими view; девять session/Subject wrappers, три Product compositions и
навигационные controls зарегистрированы в публичном RBAC Subject.

Ecommerce Product сохраняет данные, представление и JSX slots. RBAC Subject
собирает scoped cart/checkout; четыре сценария каталога, товара, категории и
магазина находятся в публичных RBAC Widget variants. Их внешняя композиция и
сохранённые тексты принадлежат связанному Website Builder Widget. Частных
реестров Ecommerce Product, Order и Widget в Host нет. Host разрешает точный
внешний Widget и передаёт ему полную карту из Page render-reader.

SDK-команда tools/runtime/ecommerce-widget-links.ts переносит сохранённые
подключения с before manifest, повторным применением и откатом. Она сохраняет
ID и порядок активных Host-связей, исходные Ecommerce Widgets и локализованный
контент. Связи hidden сохраняют исходные seed lookup keys. Схемы и seed snapshots
не меняются. Публичные списки категорий и магазинов остаются в Ecommerce.

authentication-me остаётся RBAC session reader: URL не определяет текущего
пользователя. Resource ownership и Thread–Chat membership проверяются scoped
API. Сам findByUrl по-прежнему раскрывает Page masks через withUrls, коллекции
моделей и buildTreePaths. Прямое сопоставление маски вместо этого алгоритма —
отдельная работа с проверкой static/create priority, 404 и pagination. Legacy
cache exclusions для этих зависимых reads сохраняются. Отдельные metadata и
sitemap операции сохраняют свои lookup-пути; один разбор здесь относится к
цепочке Page/Widget, а не к общему числу HTTP-запросов документа.

## Кандидаты на отдельные изменения

| Место                                                                                                                                                  | Наблюдаемое смешение                                                                                                                                                      | Целевая граница и проверка                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `libs/modules/rbac/models/widget/frontend/component/src/lib/singlepage/subject-me-social-module-profile-create-ai-chat/Projects.tsx`                   | Представление chooser содержит заголовки, пустое состояние, карточки и кнопки рядом с состояниями loading/error/creating. SDK и навигация уже вынесены в ClientComponent. | Следующий шаг возможен для общей оболочки chooser; функциональный список проектов остаётся children. Перед переносом определить отдельный сохраняемый WB экземпляр и его связь, сохранить query-driven создание, фокус и карточку с фотографией. Не заменять явную связь глобальным поиском по variant. |
| `libs/modules/ecommerce/models/widget/frontend/component/src/lib/singlepage/category/list-default/Component.tsx`                                       | Доменный Widget читает Category через find и одновременно задаёт внешнюю карточку и сетку.                                                                                | Выделить внешнюю композицию в WB; Category views остаются в Ecommerce. Перед реализацией определить явные связи и проверить фильтры, порядок, цены, корзину и startup overrides.                                                                                                                        |
| `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-ai-chat-authentication/Component.tsx`, profile-create и help | Часть статического текста и изображений задаётся presentation defaults в коде; локализованные поля модели покрывают не весь контент.                                      | Отдельный CMS-перенос может использовать существующие Feature/File связи и явные поля. Сохранить отредактированные тексты, доступность, исходные изображения и рендер при пустой конфигурации; не добавлять бизнес-логику в WB ради заполнения defaults.                                                |

`ecommerce/widget/product/list-default/Component.tsx` уже получает содержимое через
children и не выполняет доменный запрос в этом view. Он не является примером
того же смешения, что Category find внутри grid.

Это кандидаты, а не доказанные функциональные ошибки. Их рефакторинг не входит
автоматически в изменение default-связей. Исследование ограничено перечисленными
путями и не является аудитом всей кодовой базы.

## Проверки

- Локальный перенос: три новые презентации, шесть обновлённых связей. Повторный apply: ноль записей, девять пропущенных операций. Новый prepare: ноль операций. Readback подтверждает сохранность исходных WB записей, Host-связей, ID, orderIndex и className всех шести отношений.
- Модульные проверки: RBAC — 144 набора / 765 тестов на полном прогоне; после добавления проверки локализованного контента финальный authentication suite — шесть тестов. Website Builder — пять наборов / 16 тестов. Runtime manifest — восемь тестов, включая общий исходный auth Widget, его media-связи, повтор и rollback. Генератор — один интеграционный тест создания relation в виртуальном Nx workspace. Studio composition — 24 теста, включая передачу copy и порядок Host → RBAC Widget → Website Builder → Subject form.
- PostgreSQL: два интеграционных теста с применением generated migrations в изолированных схемах отдельной тестовой БД; FK, каскады, уникальность пары и несколько default-связей проходят.
- Host, Studio и runtime CLI TypeScript проходят. Production build Host и полный статический build Storybook проходят. Новые Website Builder registration, forgot-password и reset-password stories рендерят свой slot в живом Storybook на 4321. RBAC Widget stories входа, регистрации и Help показывают по одной форме; два изображения регистрации сохранены. Проверка порядка модулей: 14 791 source-файл, ноль нарушений. Проверка размещения не находит одноимённых file/folder пар. ESLint 65 изменённых исходников, Studio manifest/design-system validators и diff check проходят.
- Браузер: семь состояний в dev на 3000 и те же семь в локальном production build на 3333: вход, регистрация, восстановление, сброс, Help, chooser и создание проекта. Все шесть content-связей в DOM имеют variant=default; контент, изображение карточки создания и два изображения регистрации сохранены. Help содержит семь тем; выбор работает. Сброс без email-токена заблокирован. Возврат из создания восстанавливает список, существующий проект открывается с пятью документами и composer. Ошибок console нет.
- Доступ к конфигурации без сессии: 18 GET-проверок для шести цепочек RBAC Widget → default relation → Website Builder Widget возвращают HTTP 200 и ровно одну запись по явному ID. Права доступа не меняются.
- Обычный локальный QA Subject через SDK проходит вход, создание проекта, его получение в списке и разрешение workspace. AI generation, внешнее письмо, изменение пароля и отправка support request в этих проверках не выполняются. Browser и SDK evidence сохраняются в игнорируемой `.artifacts/widget-default/`.

## Развёртывание и ограничения

Локальный этап выше проверяет перенос на отдельной базе. Для развёртывания нужны generated migration,
matching application version и отдельный manifest по фактическим production ID;
локальные ID копировать нельзя. Owned startup overrides специального relation
renderer переносят функциональность в свой Widget и сохраняют общий slot contract.
Для отката данных используется сохранённый manifest с соответствующей версией
приложения. Частичный HTTP-перенос не является одной общей транзакцией.

## Проверки routeParams

- Shared route tests: 93 проходят, включая карту треда, query/hash, encoded
  values, static pages, pagination, несовпадение маски и повтор ключа.
- Host: 13 наборов / 33 теста; RBAC: 150 наборов / 776 тестов. Тесты Product
  composition и session wrappers перенесены вместе с владельцем.
- Host TypeScript проходит; порядок модулей — 14 775 файлов, ноль нарушений.
  Проверка размещения не находит одноимённых file/folder пар.
- Локальный SDK получает три параметра существующего треда; каждый старый
  scalar query возвращает то же значение. Статическая Page возвращает пустую
  карту. Данные сессии не входят в этот ответ.
- В dev браузере работают project chooser, существующий Thread, new Thread form
  и project settings. Отдельный тестовый Product добавлен в корзину обычного
  Subject; total 125 T меняется на 250 T после изменения quantity с 1 на 2.
  Новых console errors в этом прогоне нет.
- Production build Host проходит, включая TypeScript и генерацию восьми
  статических страниц. В production preview на 3333 работают те же chooser,
  Thread с пятью документами, new Thread form и project settings. Корзина
  сохраняет quantity 2 и total 250 T; изменение quantity до 3 даёт 375 T.
  Открытая dev-вкладка получает 375 T без перезагрузки. Console errors нет.
- При первом прямом открытии русской страницы project settings был переход
  на sign-in. Следующая попытка и последовательность en → ru → en открывают
  настройки проекта. Причина разового перехода не установлена; эти проверки
  не доказывают отсутствие ошибки инициализации сессии.
- Node 24 предоставляет экспериментальный localStorage без getItem при SSR,
  из-за чего Wallet SDK выдавал ошибку в preview. Обычные host:dev и host:start
  запускают прежние Nx targets через tools/runtime/host.mjs с
  --no-experimental-webstorage. NODE_OPTIONS и лимит памяти сохраняются.
  Два теста запуска Node проходят; production preview через npm run host:start
  работает без ошибки storage.
- ESLint 210 изменённых TS/TSX исходников, проверка launcher-файлов и diff check
  проходят. Тестовые Product, связи, строка корзины и пустой тестовый Order
  удалены через SDK; остальные данные корзины не меняются при очистке.

Доказательства и manifest временных записей находятся в игнорируемой
`.artifacts/route-params/`; они не входят в репозиторные snapshots. Все проверки
этого этапа локальные. Production-проверки описаны ниже.

## Production: релиз 0.0.314

API и Host работают на b0190bd6dfa29325bd3ff685802ebb77fc45c16c из текущей
ветки. [Workflow релиза](https://github.com/singlepagestartup/singlepagestartup/actions/runs/39166236042)
завершился успешно; пять прикладных сервисов имеют по одной работающей реплике.
Миграции и seed завершились до readiness API. Старый индекс
rbac_widget_ai_chat_content_slot отсутствует в PostgreSQL.

Шесть content-связей используют default; три отдельные authentication
презентации сохраняют контент общего источника. Повторный apply не меняет
записей. Проверка production выявила две устаревшие прямые связи Host с теми же
Website Builder Widgets у Help и проектов. Они давали второй пустой блок рядом
с композицией RBAC. Исходные записи связей сохранены в приватном before-файле;
две ассоциации восстановлены из before-данных в состоянии hidden через SDK,
Widgets и контент сохранены. Их natural keys предотвращают повторную вставку
активных дублей при seed; действующие шесть связей сохраняют прежние ID и
default. Help показывает один заголовок и одну форму. Инструмент переноса
проверяет активные дубли при подготовке и до записи новых manifests;
независимые и hidden-презентации допустимы. Frontend явно регистрирует уже
существующий в SDK hidden. Эта проверка относится к maintenance CLI.

Два новых QA Subject проверяют межпользовательские создание и редактирование
сообщения, WebSocket invalidation и отказ 403 при обращении к чужому Subject.
Карта трёх параметров треда совпадает со scalar API. Созданный до обновления
проект сохраняет пять документов и контрольную строку Brief. В браузере новый
тред появляется во второй вкладке без reload; ответ GPT 6.1 Sol приходит в обе
вкладки, черновик сохраняется. Корзина сохраняется через релиз; количества
1 → 2 → 3 дают 125 → 250 → 375 €, другая вкладка обновляется автоматически.
Тестовый товар, его связи и пустой тестовый Order удалены. Профиль сохраняет
новое имя; Purchases загружаются без permission error. Прямые en/ru переходы
не повторили локальный редирект на sign-in. В проверенных чатах console errors
нет; новый Host не пишет ошибку localStorage.getItem.

Приватные manifests и скриншоты находятся в `.artifacts/release/0.0.314/`.
Платёж, отправка support request, внешнее письмо и изменение пароля не входят
в этот smoke-прогон. QA-пользователи и проект остаются для ручной проверки.

## Исправления после production-проверки 0.0.314

На RU Help семь Option records имеют английские title, а Option view без
fallback рисует пустые подписи. CRM Option использует выбранный язык и затем
en, как уже делает его Select reader. Три регрессионные проверки покрывают
отсутствующий перевод, пустую строку и сохранение явного RU текста. CRM:
шесть наборов / 23 теста проходят. Host: 13 наборов / 33 теста; CLI переноса:
22 теста. ESLint, размещение файлов и направление зависимостей проходят
(14 779 исходных файлов, нарушений нет). Полная сборка Host с TypeScript и
восемью статическими страницами проходит. RU Help в dev и локальной production
сборке показывает семь подписанных тем без console errors.

Приватные результаты сборки и скриншоты находятся в
`.artifacts/release/0.0.315/`.

## Production: релиз 0.0.315

[Релиз 0.0.315](https://github.com/singlepagestartup/singlepagestartup/releases/tag/0.0.315)
использует коммит 6137f18820b699791bceb37498c12a0e556b2a5d из
codex/studio-host-models. [Workflow](https://github.com/singlepagestartup/singlepagestartup/actions/runs/39171008967)
завершился успешно. API, Host, MCP, Telegram и LLM работают на образе 0.0.315,
каждый с одной репликой; API healthy. У API и Host NEXT_DEPLOYMENT_ID совпадает
с коммитом релиза. Покрытие consistency capture — 155/155, lagMs — 0;
в итоговом измерении pending — 0.
В новом Host нет записей localStorage.getItem в проверенном логе.

После seed две сохранённые устаревшие ассоциации имеют прежние retired ID и
hidden; их Website Builder Widgets существуют. Свежий manifest содержит
шесть hostBindings и ноль операций. Активные content-связи остаются default.
RU Help показывает один заголовок, одну форму и семь читаемых тем; отсутствующий
перевод получает английскую подпись. Chooser содержит существующий проект,
форма создания — исходную фотографию без второго пустого блока.

Новый проект QA release 0.0.315 final создан через браузер с пятью документами.
Brief сохраняет строку production-00315 после перезагрузки; настройки проекта
открываются. Проект QA release 0.0.314 existing сохраняет исходный Brief,
пять документов и AI-ответ route-context-00314. Этот ответ получен реальным
запросом GPT 6.1 Sol к контексту Brief: значение Marker отсутствовало в тексте
запроса. Неотправленный черновик пережил замену API до перезагрузки клиента.

На новом API два QA Subject повторно проверяют создание и редактирование
сообщения, WebSocket ready/invalidation, совпадение трёх routeParams со scalar
API и отказ 403 при доступе к чужому Subject. Все проверки проходят. На
проверенных страницах production 0.0.315 console errors нет, статус Connected.
Корзина и полный набор auth-состояний проверены в 0.0.314; исправления 0.0.315
затрагивают guard переноса, hidden renderer и CRM Option, поэтому эти сценарии
не запускались повторно. Тестовые пользователи и оба проекта сохранены для
ручного ревью; тестовый товар и его Order удалены в предыдущем прогоне.

Production-код и опубликованный тег закреплены на 6137f18820; итоговый
коммит с отчётом и описанием PR содержит только документацию.
Ограничения smoke-прогона перечислены в разделе 0.0.314 выше.

## Page render-reader

Host leaf compositions use Page variant=url-segment-values and its children
callback. The client/server reader calls the existing findByUrl SDK and returns
the complete named map as data. Client readers for one URL share the SDK query.
The backend response field routeParams and scalar API remain available.

The external-Widget leaf forwards the original routeParams map into module
Widgets. RBAC selects its full Social, Subject and Ecommerce keys; Blog and
Social select their own resource keys. Content, model components and client
views receive explicit inputs. Host dispatches through public Widget registries;
Blog/Social typed slots compose RBAC operations without upward imports.

RBAC retains session and mutation ownership and imports no Host component.
The missing ./widget import was present in an uncommitted local copy of the old
Host adapter; the public RBAC registry owns those implementations.

The useful optimization is a complete named map from one Page resolution. It
is independent of whether UI composition uses a render callback or forwarded
props. The render-reader preserves this repository's JSX data-dependency style
and avoids coupling intermediate containers to the routing-map contract.

Validation: Host 15 suites / 38 tests, RBAC 150 / 776, standalone Host TypeScript,
changed-file ESLint, module direction (14 787 sources / zero violations),
placement and full Host production build pass. Reader tests cover static/unknown
Pages, a complete named map, shared client URL reads and retained drafts/focus
through background refetch.

Dev on 3000 opens the existing project and creates QA Page render-reader in its
chat. Project settings and the new thread work after restarting the dev Host.
The built preview on 3333 opens the same settings/thread, the account menu,
Help and the preserved photographic project form. Checked final browser states
have no console errors. The local test thread remains for manual inspection.
Screenshots are in .artifacts/route-render-reader/. This follow-up has no new
production release; the deployed version remains 0.0.315.
