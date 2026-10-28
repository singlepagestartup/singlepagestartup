---
issue_number: 380
issue_title: "SEO для сборки страниц Host, блога и каталога"
repository: singlepagestartup
created_at: 2026-10-28
last_updated: 2026-10-28
status: completed
current_phase: code_review
---

# Process log: SEO для сборки страниц

## Purpose

Ход Core-пайплайна, подтверждённые ограничения и результаты проверок.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: code_review
- Next step: Code Review PR #382; приёмка и выпуск в дочернем проекте отдельно

## Phase Notes

### Create

- Scope: техническое SEO общего Host на примере m2commerce.ru.
- Ветка: codex/studio-linear-workflow. Существующие изменения не относятся к SEO.
- Авторизация: пользователь запросил весь Core-пайплайн до внедрения в текущей ветке.

### Research

- Вебмастер: 129 дублей title и description, 91% страниц, общий title «М2коммерц».
- На стороне Яндекса временно не обновляется сводка и отключён экспорт дублей.

### Plan

- План: thoughts/shared/plans/singlepagestartup/ISSUE-380.md.
- Статус плана: редакция 2 согласована, внедрение разрешено без промежуточных остановок.
- Редакция 2: Page → Metadata, квадратные маски с локализацией и переходом по связям, Metadata → File, hidden для всех моделей и связей, рекомендации по JSON/keywords/author/viewport и пояснение JSON-LD.
- JSON-объём: Article, Product, Profile. Metadata у Message, Thread и Chunk сохраняет своё назначение.
- Редактор масок и SEO-полей проходит через Studio перед реализацией в libs/modules.
- Авторизация: последующее сообщение пользователя разрешает внедрение всех этапов редакции 2 в той же ветке.

### Implement

- Прогресс: thoughts/shared/handoffs/singlepagestartup/ISSUE-380-progress.md.

## Incident Log

<!-- incident-count: 9 -->

### Incident 1 — GitHub недоступен из sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: load_config сообщает error connecting to api.github.com.
- **Root Cause**: ограничение сетевого доступа sandbox.
- **Fix**: тот же bash helper flow выполнен с network escalation; target repository подтверждён.
- **Preventive Action**: выполнять сетевые GitHub helpers с escalation.

### Incident 2 — Модель специализированных агентов недоступна

- **Phase**: Research
- **Occurrences**: 2
- **Symptom**: codebase-analyzer не запускается: gpt-5.4 не поддерживается для аккаунта.
- **Root Cause**: закреплённая модель роли недоступна.
- **Fix**: исследовательские подзадачи переданы default-агентам с унаследованной моделью.
- **Preventive Action**: использовать доступную default-роль для этих подзадач.

### Incident 3 — Реализация до проверки архитектуры

- **Phase**: Plan / Implement
- **Occurrences**: 1
- **Symptom**: незакоммиченный SEO-черновик содержит решения, которые пользователь ещё не проверил.
- **Root Cause**: исходный запрос полного Core-цикла был принят как разрешение продолжить внедрение без отдельной проверки плана.
- **Fix**: архитектура пересмотрена в редакции 2; её последующее согласование разрешает текущую реализацию.
- **Preventive Action**: сохранять approval: pending и не продолжать Core 30 до явного согласования актуального плана. Не выдавать рекомендации по JSON за уже утверждённые изменения всех моделей.

## Reusable Learnings

- Core-пайплайн заканчивается Core 30 и передачей в Code Review; Core 40 в этом checkout нет.
- Данные Вебмастера проверять по текущему HTML: отчёты могут отражать предыдущий обход.
- Наличие hidden в SDK variants не подтверждает публичную фильтрацию. Проверять отдельно маршруты, списки, связи, метаданные, кеш и административный доступ.
- При пересмотре требований отличать исходный generate.ts из HEAD от незакоммиченного SEO-черновика; JSON-поле metadata уже существует у части моделей с другим назначением.

## Разрешение на внедрение редакции 2

План согласован. Все этапы выполняются последовательно без промежуточных остановок. Ветка codex/studio-linear-workflow содержит Studio и SEO. Ранее установленная пауза снята; production-развёртывание остаётся отдельным действием.

## Результат внедрения

- Page → Metadata: первая видимая запись по orderIndex/ID, квадратные маски,
  точные ID/slug, локаль, явные связи и разрешённые JSON SEO-поля.
- JSONB Article/Product/Profile с ограничениями и атомарной проверкой предыдущего
  значения. Оба admin-редактора и MCP сохраняют соседние секции; конфликт даёт 409.
- Metadata → File: сгенерированная связь, загрузка обложки, alt/размеры/MIME,
  приоритет явного поля и связанных обложек. Favicon не становится OG-обложкой.
- Hidden есть у 61 модели и 95 связей, включая новую. REST, публичные SDK readers,
  рендеринг, счётчики, маршруты и sitemap применяют правила видимости.
- Языковая уникальность Page, indexing auto/noindex, canonical, robots, JSON-LD,
  корректный sitemap с разделением на части и HTTP 503 при отказе API.
- Статьи и публичная часть товара доступны в серверном HTML с H1; действия
  корзины и checkout сохраняют клиентскую сессию. TipTap и alt доступны до JS.
- Изменение alt/variant File без загрузки обновляет существующий File.

## Проверки

Локальная среда: API :4100, production Host :3100, Storybook :6007;
отдельная БД sps_seo_380_clean. Рабочая БД и production не изменялись.

| Проверка                         | Результат                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Host module Jest                 | 90 тестов                                                                    |
| Host app Jest                    | 63 теста                                                                     |
| Shared backend API Jest          | 77 passed, 1 existing skipped                                                |
| Shared frontend components Jest  | 56 тестов                                                                    |
| Middleware auth/cache Jest       | 51 тест                                                                      |
| Shared metadata/routes Jest      | 35 тестов                                                                    |
| MCP Jest                         | 57 тестов                                                                    |
| File Storage Jest                | 19 тестов                                                                    |
| Product anonymous SSR regression | 2 теста                                                                      |
| TipTap SSR/browser Jest          | 17 тестов                                                                    |
| TypeScript Host и MCP            | passed                                                                       |
| ESLint изменённых SEO-файлов     | passed, 8 GiB heap                                                           |
| Studio design-system validation  | passed                                                                       |
| Module dependencies              | 0 нарушений                                                                  |
| Каталог hidden                   | 61 модель, 95 связей, пропусков нет                                          |
| Изменения data snapshots         | отсутствуют                                                                  |
| Полная миграция новой БД         | passed; analytic применён отдельным target                                   |
| Upgrade с записями               | 3 статьи, 3 товара, 1 профиль, 9 страниц сохранены; новые defaults корректны |
| API/SDK/MCP round-trip           | JSON, локали, маски, новая связь, конфликт 409                               |
| Загрузка PNG                     | MCP → File → Metadata; публичный URL 200 image/png                           |
| Прогретый HTML                   | новый title виден, hidden → 404, восстановление → 200                        |
| Прогретая обложка                | hidden File/связи убирает OG; восстановление возвращает                      |
| Отказ тестового API              | HTML 500 no-store; sitemap 503 no-store, Retry-After: 60                     |

HTTP-матрица: главная, статическая en/ru, две статьи, два товара, профиль,
noindex, две страницы пагинации, вложенная категория, скрытые модели/связь/Page,
несуществующий адрес и выход за пагинацию. В sitemap 20 ожидаемых URL, скрытые и
noindex исключены; неверная часть sitemap даёт 404. Canonical очищен от tracking.
Финальная production-сборка прошла вместе с проверкой типов и повторной HTTP-матрицей.
Ответы в финальном прогоне: 13–841 мс (841 мс — первый запрос главной); это небольшая
тестовая БД, не нагрузочная оценка m2commerce.ru.

Браузер: статья показывает H1 и текст после гидратации без ошибок; Studio SEO
показывает ошибку JSON, восстанавливает правку title и сохраняет campaign и другую
локаль. Studio Product имеет один H1. Приёмка владельцем интерфейса отдельно от
агентской браузерной проверки; она не объявляется выполненной.
Финальный браузерный прогон товара подтвердил H1 и описание. Тестовые права не
покрывают чтение двух связей атрибутов checkout; соответствующие уведомления
зафиксированы как ограничение fixture, полный checkout этим прогоном не проверялся.

### Incident 4 — ISR fallback и текущий запрос

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: собранный Host возвращает 500 DYNAMIC_SERVER_USAGE.
- **Root Cause**: ISR fallback читает headers/session, отсутствовавшие при static generation.
- **Fix**: явный request rendering catch-all, предварительная проверка Page до streaming.
- **Preventive Action**: проверять HTTP первого запроса production-сборки вместе с 404 и сессией.

### Incident 5 — Ресурсы проверки

- **Phase**: Implement
- **Occurrences**: 3
- **Symptom**: ENOSPC при записи webpack cache; ESLint исчерпал 4 GiB heap.
- **Root Cause**: большой монорепозиторий и ограниченный свободный диск.
- **Fix**: удалён только SEO build output, webpack cache отключён, build cpus=1; ESLint scoped с 8 GiB.
- **Preventive Action**: изолировать distDir и проверять свободное место, не удалять чужие сборки.

### Incident 6 — Несогласованная исходная локальная БД

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: копия рабочей БД имеет существующие таблицы без соответствующего журнала и не имеет sl_profile.
- **Root Cause**: локальная БД не соответствует текущей истории миграций.
- **Fix**: полный прогон на новой БД и отдельный upgrade-прогон с существующим контентом/прежними полями.
- **Preventive Action**: перед выпуском сверить baseline проекта. Общий api:db:migrate не включает analytic;
  его текущие миграции на чистой БД выполнены отдельным target.

### Incident 7 — Публичный товар ожидал сессию

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: публичный HTML товара не содержит H1 и содержимого до authenticationMe.
- **Root Cause**: весь обзор находился внутри Subject reader.
- **Fix**: RBAC Widget рендерит Product сервером, Subject cart/checkout остаются клиентскими.
- **Preventive Action**: проверять анонимный исходный HTML, а не только гидратированную страницу.

### Incident 8 — File PATCH создавал новую запись

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: изменение hidden/alt без файла даёт конфликт уникальности.
- **Root Cause**: ветка без нового upload вызывала create вместо update.
- **Fix**: update по uuid и HTTP 200; пустой payload отклоняется, типы проверены; regression-тест и live-проверка обложки.
- **Preventive Action**: проверять редактирование метаданных файла отдельно от загрузки.

### Incident 9 — Токен конкурирующего обновления MCP

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: strict schema удаляет \_expectedMetadata до SDK-запроса.
- **Root Cause**: транспортный токен отсутствует в схеме хранения.
- **Fix**: update-схема MCP принимает валидированный токен без добавления колонки БД.
- **Preventive Action**: проверять конфликт через полный MCP round-trip, не только REST.

## Перенос в дочерний проект

1. Сверить журнал и текущую схему; сделать резервную копию. Применить сгенерированные
   миграции Article, Product, Profile, Metadata, Page, Metadata→File и provider capture.
2. Проверить Page.language, одинаковые пары URL/язык и legacy viewport. Настроить
   public Host/API origin. Обновить локальные overrides компонентов/SDK по новым правилам.
3. Через API/Studio/admin связать реальные Page с Metadata, заполнить маски и нужные
   локали, keywords у сущностей, загрузить обложки. Старые общие литералы в Metadata
   имеют приоритет и сами не станут уникальными.
4. Выдать редакторам право административного чтения (POST коллекции для includeHidden).
   Публичные чтения/кеш не должны получать admin данные. Для внешних JSON-updates
   сохранять полный объект и отправлять \_expectedMetadata.
5. Повторить HTTP/HTML/sitemap проверки на адресах проекта, проверить цену/автора/даты
   только по фактическим данным. После отдельного развёртывания отправить страницы
   на переобход и дождаться обновления отчётов Яндекса.

Production m2commerce.ru не развёрнут и его данные не изменены. Существующие отчёты
Яндекса не объявляются исправленными до выпуска и переобхода.

## Передача на Code Review

- Реализация: `a3694a93a8` в `codex/studio-linear-workflow`.
- PR: [#382](https://github.com/singlepagestartup/singlepagestartup/pull/382).
- `submit_pr_for_code_review.sh 380 382` связал PR с задачей и повторным чтением подтвердил `Code Review`.
- Pre-commit прошёл. После форматирования повторены File PATCH regression-тест и ESLint с 8 GiB heap; оба прошли.
- Исходные незакоммиченные изменения Studio/workflow сохранены.
- Тестовые Host/API/Storybook остановлены; три временные SEO-базы, тестовая загрузка и изолированный build output удалены. Рабочая БД и production сохранены.
