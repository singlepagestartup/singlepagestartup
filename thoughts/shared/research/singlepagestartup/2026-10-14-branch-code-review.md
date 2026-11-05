---
repository: singlepagestartup
branch: codex/studio-host-models
reviewed_head: ced0f3713a89d09c5627a9cc1f502a55e17d754e
comparison_base: ea69bb036ae9d0f60c5123ad0b72a7037297957c
main_head: 6664a9841bd81a9c02a711b92f1906a70ef72bcb
source_date: 2026-10-14
status: fixes-verified-with-gaps
execution: local
---

# Code review ветки Studio и AI Chat

Актуальное состояние повторной проверки по обновлённым frontend/cache правилам:
[исправления и проверки следующего прохода](2026-10-15-branch-code-review-followup.md).

В рабочей копии исправлены десять подтверждённых функциональных и структурных
дефектов, а также пять диагностик TypeScript в новых маршрутах загрузки файлов
и баланса. Исправления остаются незакоммиченными. Открытый PR для ветки не найден.
Проверка охватывает изменения ветки относительно общего предка с `origin/main`
и необходимые для их оценки читатели, middleware и вызывающий код.

## Как связаны инструкции и инструменты

| Узел                                                                                      | Назначение                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`, `CLAUDE.md`                                                                  | Входные инструкции и checklist. Оба требуют читать общий workflow при review PR или локального diff. `AGENTS.md` распространяет это требование и на встроенное Code Review.                              |
| `.codex/skills/review-pr/SKILL.md`                                                        | Навык Codex, который направляет к общему workflow.                                                                                                                                                       |
| `.claude/commands/review_pr.md`                                                           | Адаптер команды Claude с тем же источником.                                                                                                                                                              |
| `.agents/workflows/engineering/review_pr.md`                                              | Основная инструкция: границы проверки, архитектура, API и кэш, evidence, формат findings и полномочия разработчика.                                                                                      |
| `.agents/contracts/engineering/frontend-components.md`                                    | Шаблоны читателей и Provider, явные props на границе server/client, JSX slots и проверка реального публичного пути компонента.                                                                           |
| `.agents/contracts/engineering/code-placement.md`                                         | Размещение файлов по их виду и запрет файла рядом с одноимённой папкой.                                                                                                                                  |
| README модулей, моделей и relations                                                       | Направление зависимостей, принадлежность данных и локальные исключения. Документация HTTP-кэша, revalidation и frontend API задаёт отдельные обязанности читателей и мутаций.                            |
| `.agents/contracts/engineering/knowledge-first.md`                                        | Сначала процесс, ticket, исследование, план и документация; затем целевые проверки и запись результатов для следующей сессии.                                                                            |
| `.codex/skills/validate-plan/SKILL.md` → `.agents/workflows/engineering/validate_plan.md` | Проверка согласованности ticket/research/plan перед реализацией либо соответствия реализации плану в явно выбранном post-implementation режиме.                                                          |
| `.claude/helpers/submit_pr_for_code_review.sh`                                            | Проверяет открытый недрафтовый PR, связывает его с issue и переводит GitHub Project из `In Dev` в `Code Review`. Сам анализ кода этот скрипт не выполняет. Его вызывает финализация `core/30-implement`. |

В `.github/workflows` нет workflow, запускающего этот навык или общий review
workflow на каждый commit. Статус `Code Review` в GitHub Project обозначает
этап процесса. Настройки внешнего GitHub/Codex-сервиса автоматического review
в этой проверке не инспектировались.

Review сам по себе разрешает анализ и findings. Исправления в этой сессии
разрешены запросом оператора. Публикация комментариев, изменение Project,
approval и merge в выполненную работу не входят.

`local_review` имеет отдельное назначение: подготовка worktree коллеги.
Его каноническая инструкция содержит устаревшие ссылки на `humanlayer` и
`make setup`; к текущему анализу SPS она не применялась.

## Исправленные findings

### CR-01 — P1: приватные Subject-ответы обходили авторизацию через HTTP-кэш

Источник исправления: `libs/middlewares/src/lib/http-cache/routes/singlepage.ts:57`.

При `MIDDLEWARE_HTTP_CACHE=true` запрос владельца без `Cache-Control: no-store`
создавал запись с приватным ответом. Следующий анонимный запрос к тому же URL
получал `200` до выполнения ownership middleware. Воспроизведение использует
реальный Hono и HTTP-cache middleware с KV в памяти.

Исключение в `libs/middlewares/src/lib/http-cache/routes/singlepage.ts`
охватывает все пути под Subject ID. Регрессионные тесты прогревают URL запросом
владельца и проверяют отказ анонимному caller и другому аккаунту. Публичные
модельные маршруты сохраняют кэширование.

### CR-02 — P1: сохранение заметок удаляло свежий анализ файла

Источник исправления: `libs/modules/knowledge/models/source/frontend/component/src/lib/singlepage/form-ai-chat/ClientComponent.tsx:30`.

Редактор Source игнорировал обновлённый `content`, пока заметки были dirty.
После загрузки и анализа файла последующее сохранение отправляло старые
материалы вместе с новыми заметками. UI-последовательность воспроизведена;
перезапись полного содержимого прослежена до Knowledge repository.

`form-ai-chat/ClientComponent.tsx` сохраняет локальные заметки и заголовок,
перенося их в свежие разделы материалов. Перед загрузкой файла сохранённого
Source dirty-заметки сохраняются. Тест через публичный Source и его SDK-reader
проверяет анализ, удаление материалов и порядок save → upload.

### CR-03 — P1: пересборка каталога удаляла вложенные варианты Studio

Источник исправления: `tools/studio/design-system/catalog.ts:291`.

`tools/studio/design-system/catalog.ts` находил только первый уровень каталогов,
а parser aliases распознавал только одноуровневые imports. Пересборка теряла
вложенные `sidebar`, `agent`, `scope` и другие варианты.

Генератор находит вложенные каталоги вариантов и сохраняет aliases по полному
относительному пути. Повторная сборка временных копий сохраняет все 429 записей
вариантов в 63 каталогах моделей. Проверены keys, пути imports и отсутствие
дублирующихся aliases. Новый runtime-тест проверяет вложенные custom keys и
приоритет `startup` после двух сборок.

### CR-04 — P2: подтверждение текста и вложений могло сохраниться частично

Источник исправления: `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:109`.

KnowledgeService сохранял текст, затем добавлял Files отдельной транзакцией.
Удалённый после подготовки предложения File приводил к ошибке после изменения
текста и hash; предложение оставалось pending и теряло возможность повтора с
исходным hash. Частота неизвестна.

`KnowledgeRepository.updateSourceWithAttachments` блокирует Files перед Source,
проверяет hash и сохраняет заметки, ссылки и invalidation в одной транзакции.
Обычный `updateSource` сохраняет возвращаемый контракт `Source | null`.
Анализ выполняется после commit и возвращает отдельный `processingError`.
PostgreSQL-тест подтверждает неизменность текста, ссылок и индекса при
отсутствующем staged File; успешный путь проверяет атомарное добавление и dedup.

### CR-05 — P2: изменения аккаунта не попадали в кэш его читателей

Источник исправления: `libs/shared/frontend/client/api/src/lib/cache/index.ts:7`.

Profile/Identity readers используют URL-ключ с `?`, даже без параметров.
Мутации передавали в `patchInListQueries` URL коллекции без query string.
Array-key matching TanStack не обновлял эти записи; интерфейс зависел от
WebSocket refetch.

Общие list helpers в `libs/shared/frontend/client/api/src/lib/cache/index.ts`
поддерживают factory keys и URL keys. Detail и соседние коллекции остаются
отдельными. Filtered append инвалидируется, а patch/remove обновляют имеющиеся
элементы. Тесты используют настоящий QueryClient.

### CR-06 — P2: изменения Knowledge не инвалидировали всех читателей

Источник исправления: `libs/shared/utils/src/lib/topics/singlepage.ts:102`.

Scoped Source/Files handlers и подтверждение документа меняют relations и
chunks прямыми backend-вызовами. Прежние stopping topic rules не включали
всех читателей производных данных.

`libs/shared/utils/src/lib/topics/singlepage.ts` включает topics chunks,
Source–Chunk и Source–File relations для scoped Sources и AI reaction.
Reaction также включает Message–Source relation. Resolver-тест проверяет
пересечение topics мутации с topics затронутых читателей. Живой сценарий с Redis
и вторым WebSocket-клиентом не выполнен.

### CR-07 — P2: поздний ответ Sources удалял несохранённый черновик

Источник исправления: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat/ClientComponent.tsx:65`.

Неопределённые данные трактовались как пустой документ. Появление первого
сохранённого Source удаляло автоматически смонтированный draft вместе с текстом
и выбранными Files.

Document Source list создаёт initial draft после успешного пустого чтения,
имеет loading/error/retry и сохраняет начатые drafts до attachment.
Client view имеет key по Thread ID. Тесты с реальным редактором проверяют
отложенную загрузку, error/retry, сохранение текста и Files при refetch, а также
повтор attachment без дублирования Source и uploads.

### CR-08 — P2: ссылки и form navigation теряли русский locale

Источник исправления: `libs/modules/rbac/models/widget/frontend/component/src/lib/singlepage/subject-me-profile-settings/ClientComponent.tsx:39`.

Непрефиксные destinations на русских страницах проходили через middleware,
добавляющий default English. Затронуты landing, Help, authentication Markdown,
auth forms, создание Project/Thread и account Settings, включая sign out.

Эти destinations используют `getLocalizedHref`; Host передаёт language
authentication frame. Проверены публичные content readers для `en` и `ru`,
создание и retry проекта, создание Thread, secondary auth links и Settings.
Фрагмент disclosure сохраняется.

### CR-09 — P2: старые оригиналы истории были недоступны при повторяющихся запросах

Источник исправления: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/context/tools.ts:95`.

History tool возвращал только последние восемь совпадений. Text offset требовал
уже известный Message ID; listing/search не имел следующей страницы.
При opt-in `RBAC_AI_CONTEXT_MODE=compact` модель могла утратить доступ к
старому точному значению, отсутствующему в summary. Default остаётся `full`.

`profile_thread_history_read` возвращает `nextBeforeMessageId` и принимает
`beforeMessageId`. Тест проходит все страницы, читает самое старое совпадение
и отклоняет cursor вне текущего Thread snapshot.

### CR-10 — проверка Studio: syncKey не соответствовал перенесённому компоненту

Источник исправления: `apps/studio/modules/rbac/subject/singlepage/me/delete/default/figma.json:10`.

В `apps/studio/modules/rbac/subject/singlepage/me/delete/default/figma.json`
syncKey соответствует текущему пути компонента. Design-system validation
проходит. Блокирующее несоответствие воспроизводилось общей командой
`npm run studio:validate`.

## Автоматические проверки

| Проверка                                                            | Результат                                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:unit:scoped`                                          | 23 проекта, 261 suite, 1106 tests прошли.                                                                                                                                 |
| Дополнительные `jest:test` для Knowledge, Middlewares, Shared Utils | 3 проекта, 42 suites, 231 test прошли.                                                                                                                                    |
| Knowledge repository на локальном PostgreSQL                        | 9 tests прошли, включая две новые проверки атомарности.                                                                                                                   |
| `npm run studio:validate`                                           | Exit 0; type check, manifests, 99 design-system tests, 339 presentation tests и остальные проверки прошли. Report-mode pipeline отдельно сообщает 5 pre-development gaps. |
| `tsc -p apps/host/tsconfig.json --noEmit`                           | Прошёл.                                                                                                                                                                   |
| `tsc -p apps/api/tsconfig.json --noEmit`                            | 22 существующие source diagnostics; в исходном HEAD их 27. Ошибки новых Files и balance endpoints устранены.                                                              |
| Scoped Files и balance headers после исправления типов              | Отдельные regression suites проверяют bytes/name/MIME и object/tuple/Headers representations.                                                                             |
| Локальный Host в браузере                                           | Главная `/ru`, Settings, Projects и существующий workspace с редактором Brief.md открываются. Ссылки сохраняют `ru`; ошибок консоли на этих страницах нет.                |
| Prettier, `git diff --check`, code-placement                        | Прошли.                                                                                                                                                                   |
| `actionlint` для локальной правки Ansible                           | Прошёл; эта правка относится к предыдущей задаче и остаётся в рабочей копии.                                                                                              |

## Ограничения и ручная проверка

- Общая типизация API остаётся красной: diagnostics касаются payment providers,
  прежних File/Blob и audio adapters, Page/Telegram response types и Z-AI.
- AI Chat открывается на главной `/ru`. Браузер подтверждает отображение
  landing, account Settings, Projects и существующего workspace с редактором
  Source через Next.js. Создание Project/Thread и
  сохранение документов после этих исправлений проверены component/reader
  tests; полный живой сценарий с загрузкой и удалением Files остаётся ручной
  проверкой. Next.js сообщает предупреждение о `scroll-behavior: smooth`
  без атрибута `data-scroll-behavior`.
- Сценарий invalidation с двумя живыми клиентами и Redis остаётся ручной
  проверкой; scope и topics подтверждены кодом и resolver/cache tests.
- Pre-development pipeline сообщает четыре approval gaps и одно структурное
  несоответствие registry двух mascot assets. Эти результаты не являются
  подтверждением бизнес-документов.
- Общий Social прогон сообщил предупреждение о завершении worker. Отдельный
  прогон указанных suites с `--runInBand --detectOpenHandles` завершился штатно:
  6 tests прошли, открытые handles не сообщены.

Для ручной проверки открыть главную `/ru`, sign in и Settings; создать
Project/Thread; редактировать заметки,
загрузить и удалить File; проверить сохранение нового анализа и draft при
обновлении данных. Cache-сценарий требует прогретых GET и второго подписанного
клиента после attachment change и подтверждения документа.

## Замечания для повторного запуска

DB integration tests требуют environment из `apps/api/.env`:

```bash
node_modules/.bin/dotenv -e apps/api/.env -- node_modules/.bin/jest \
  --config libs/modules/knowledge/jest.integration.config.ts \
  --runInBand --runTestsByPath \
  libs/modules/knowledge/backend/app/api/src/lib/repository.integration.spec.ts
```

В sandbox доступ к локальному PostgreSQL блокировался с `EPERM`; проверка
успешна после разрешения локального сетевого доступа. Ошибка соединения без
environment или с сетевым запретом не доказывает ошибку repository.

Профиль `codebase-analyzer` назначает `gpt-5.4`, недоступную для этого аккаунта
при выполненном запуске. Целевые проверки выполнены эквивалентными агентами
с текущими настройками и общим review contract. Исходные process/plan artifacts
использованы как контекст; ключевые утверждения проверены на выбранном HEAD.
