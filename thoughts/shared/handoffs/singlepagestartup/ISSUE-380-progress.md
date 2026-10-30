---
issue_number: 380
issue_title: SEO сборки страниц
start_date: 2026-10-28
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-380.md
status: in_progress
---

# Implementation progress: ISSUE-380

Ветка: `codex/studio-linear-workflow`. Редакция 2 согласована; все этапы разрешены
последовательно. Существующие Studio/workflow-правки сохраняются отдельно от SEO-коммита.

## Phase progress

- [x] Studio: маски, локализованный JSON, ошибки и предпросмотр.
- [x] Схемы: Article/Product/Profile JSONB, Metadata image, Metadata→File, Page indexing/locale.
- [x] Runtime: точные маски, локали, fallback, OG, canonical, JSON-LD.
- [x] Hidden: 61 модель, 98 связей, генератор, публичный API/SDK/рендеринг, admin isolation.
- [x] Sitemap: XML/части/ошибки, pagination, noindex, required associations.
- [x] SSR: Article/Product H1 и текст до сессии/гидратации, alt, true404.
- [x] Миграции, API/SDK/MCP, браузер, прогретые ответы и отказ API.
- [x] Заключительная production-сборка и повторная HTTP-матрица.
- [x] SEO-коммит, PR и Code Review.

## Verification

Подробные результаты и перенос: [process](../../processes/singlepagestartup/ISSUE-380.md).
554 focused tests, один прежний skipped; Host tsc, scoped ESLint, Studio validation,
module-dependencies. Полная новая БД и upgrade с записями проверены. HTTP-матрица
содержит 18 маршрутов; sitemap содержит 20 публичных URL. Ошибки API сохраняют 5xx.

## Remaining

Реализация `a3694a93a8`, [PR #382](https://github.com/singlepagestartup/singlepagestartup/pull/382).
Статус #380 подтверждён как Code Review. Production и данные m2commerce.ru не изменены.
Тестовая среда остановлена и удалена; дальнейший выпуск описан в process.
Приёмка владельцем интерфейса не отмечена как завершённая.

## Incident Log

<!-- incident-count: 12 -->

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
- **Fix**: update по uuid и HTTP 200; regression-тест и live-проверка обложки.
- **Preventive Action**: проверять редактирование метаданных файла отдельно от загрузки.

### Incident 9 — Токен конкурирующего обновления MCP

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: strict schema удаляет \_expectedMetadata до SDK-запроса.
- **Root Cause**: транспортный токен отсутствует в схеме хранения.
- **Fix**: update-схема MCP принимает валидированный токен без добавления колонки БД.
- **Preventive Action**: проверять конфликт через полный MCP round-trip, не только REST.

### Incident 10 — CodeQL после публикации PR

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: три замечания к регулярным выражениям HTML и маски пагинации.
- **Root Cause**: неполный набор закрывающих HTML-тегов; динамическая сборка regex из имени коллекции.
- **Fix**: варианты регистра и закрывающих тегов учтены, имя коллекции сравнивается буквально; добавлены regression-тесты.
- **Preventive Action**: проверять итоговый CodeQL вместе с локальными тестами.

### Incident 11 — Конфликт с обновлённой main

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: PR конфликтует с main после включения framework visual/API изменений.
- **Root Cause**: общие регистры вариантов, презентации Article/Product и история consistency capture изменены в обеих ветках.
- **Fix**: конфликты сведены в текущей ветке; новые презентации сохранены, hidden добавлен трём новым связям; capture сгенерирован target как 0010. 284 исходных файла Studio/workflow восстановлены побайтно и остаются незакоммиченными.
- **Preventive Action**: сверять mergeability и проверять новые публичные API при совмещении изменений.

### Incident 12 — Занятый Git index и прерванный hook

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: git add получает index.lock, а следующий commit запускает hook с прежним индексом.
- **Root Cause**: блок команд не остановился после ошибки staging; индекс кратковременно занят фоновым Git.
- **Fix**: commit прерван; индекс и скрытые hook-файлы восстановлены из автоматического snapshot. Контрольные суммы 284 пользовательских файлов совпали.
- **Preventive Action**: staging и commit связывать успешным exit code; ожидать освобождения индекса, не удалять активный lock.

### Проверка ISR на исходной базе — 30.10.2026

Публичный маршрут помечен Next как SSG, админка — dynamic. Получены
`x-nextjs-cache: MISS` и затем `HIT`; Cache-Control содержит s-maxage=3600.
Проверены изменение title, hidden/восстановление Page, Article и Product,
обязательная Category–Article связь и прямая запись Page в PostgreSQL.
Все скрытые адреса вернули HTTP 404; восстановленные — 200. SDK-инвалидизация
в проверенном прогоне заняла 23–133 мс. Публичный ответ с cookie остался HIT.
Локальный sitemap: 170 адресов, 0 служебных URL, правильный namespace и локаль.

Host: 58 тестов; модель Host: 105 тестов. Проверка зависимостей: 15 494 файла,
0 нарушений. Code-placement сообщает о прежнем конфликте Files.tsx/Files в
пользовательских правках Studio, вне SEO-изменений.

Холодная страница при отказе API возвращает 500 no-store; sitemap — 503
no-store с Retry-After: 60. API восстановлен и использует `sps-lite-7`.
Отдельный контроль прогретого ответа во время отказа ещё нужно повторить:
предыдущие мутации Page инвалидировали его до остановки API.

Текущая финальная сборка выполняется. После первой успешной сборки устранён
циклический импорт Metadata SDK через отдельный настроенный CRUD provider.
Также отключена предварительная загрузка всех начертаний шрифтов: исходный
Lighthouse показывал 22 запроса шрифтов, около 1,19 МБ на каждой странице.
После этой последней правки нужна окончательная сборка и повторная проверка.

Production ещё не обновлён. Пробный перенос локализованных Page на production
без записи прошёл: 52 английских шаблона, 0 русских. Массовый перенос выполняется
SDK-скриптом после обновления схемы, с сохранением существующих данных и связей.
Релиз 0.0.328 пока не создан. Последний опубликованный релиз — 0.0.327.

## Текущее продолжение

Код ISR завершён и прошёл production build, 193 теста и HTTP-сценарии.
Локальный итоговый sitemap — 128 адресов после noindex для демонстрационных
дублей. Все адреса отвечают 200 и имеют canonical; шесть отсутствующих H1 и
пустые тестовые материалы записываются в итоговую рецензию.
Осталось выпустить проверенный коммит, перенести языковые шаблоны и политику
noindex на тестовый production, выполнить повторный аудит/Lighthouse и
опубликовать рецензию в issue #380. Статус остаётся in_progress до этих действий.
