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

## Доработка после проверки владельцем — 30.10.2026

Текущая задача выполняется в `codex/studio-linear-workflow`. Владелец разрешил все этапы без дополнительных согласований, commit, release, проверку тестового production, Lighthouse и доступную диагностику Яндекс Вебмастера.

- [x] Весь аутентифицированный интерфейс админки и вложенные SDK reads выполняются на клиенте после authentication/authorization; серверные cookie/session reads не добавляются. Проверки прав на API сохраняются.
- [x] Исправить Metadata→File: название, создание и редактирование связи в обеих админках.
- [x] Счётчики/пагинация отношений учитывают фильтр текущего родителя; существующие связи видны одинаково в обеих админках.
- [x] Создание Page использует язык из internationalization.defaultLanguage; редактирование сохраняет язык записи.
- [x] Составить инвентаризацию всех Host Pages локально и на тестовом production. Связать каждую Page с редактируемой Metadata; динамические значения — квадратные маски, fallback сохраняется.
- [x] Создать обложки в стиле Workspace Living Focus через imagegen, сохранить оригиналы и данные происхождения; загрузить через File SDK и настроить Metadata→File для всех Page. Служебные страницы сохраняют noindex.
- [x] Сохранить существующие тексты/связи; data flow имеет preflight, backup, readback и повторный запуск без дублей. Snapshots не изменяются.
- [x] Проверить новые/существующие формы, аутентифицированные запросы, маски и images; выполнить целевые тесты, lint, production build, публичный ISR/hidden.
- [x] Commit/push в текущую ветку, release, проверить фактические образы и данные production, полный обход sitemap, Lighthouse.
- [x] Проверить доступный Яндекс Вебмастер и запустить проверку/переобход, если интерфейс и права позволяют. Не подменять чужой домен результатами singlepagestartup.com.
- [ ] Опубликовать результаты и ограничения в issue #380, обновить PR #382, подтвердить Code Review.

Исходная локальная проверка: 102 Page, 2 Page→Metadata (обе для главной), 2 Metadata, 0 Metadata→File. У /blog и шаблонов Article/Product связей нет. Admin v2 передаёт серверные children через клиентскую проверку доступа; server card/table reads с includeHidden=1 не получают сессию. Новый Metadata→File admin/table не передаёт имя/форму контроллеру. Счётчик общей admin/table не учитывает фильтры.

Итоговая проверка: [0.0.331](https://github.com/singlepagestartup/singlepagestartup/releases/tag/0.0.331), код приложения `55ed9ad9b2`. Фактические Host/API — 0.0.331, running/completed. Все 102 локальные и 104 production Page связаны с отдельными Metadata и File. Прежние записи/связи сохранены; fresh prepare/apply не создаёт дублей. Все 104 публичные обложки проходят SHA-256/MIME/размеры/alt/HTTP 200. Семь иллюстраций Living Focus, оригиналы и WebP находятся в `apps/studio/workspace/assets/singlepage/generated/page-seo-v1/`.

Обе админки проверены в браузере: вход, таблицы, Page→Metadata→File, сохранение Metadata/File и draft preview. Новая Page использует ru из настроек. Публичный маршрут — SSG/ISR. Production: Metadata title → обновление HIT, hidden Page/Article/Product/обязательной связи → 404, восстановление → 200, остальные поля сохранены. Cookie не меняет публичный HIT; анонимный административный read — 403.

Production sitemap: 136 URL, все 200 с canonical/lang/description/OG и одним H1, без noindex и ошибочного JSON-LD. Локально — 124 URL после исправления H1, noindex формы создания статьи/demo Store и восстановления Analytic из точной прежней резервной копии. Четыре прежние пустые production-статьи сохраняют hidden. Все временные fixture удалены.

Lighthouse 13.6.0 mobile: SEO 100 на семи URL; Performance 80/50/30/22/31/32/51. Долги: JS, LCP/CLS, восемь общих description, переводы, FileInput и seed Metadata. Полная рецензия: [ISSUE-380-completion-review.md](../../research/singlepagestartup/ISSUE-380-completion-review.md).

Яндекс: живые проверки 404 и 200 прошли. 136 адресов приняты на переобход 30.10.2026 14:25, все «В очереди». Общая диагностика не обновляется из-за сбоя Яндекса; её кнопка проверки отключена.

Код: 60 целевых тестов, TypeScript/production build, scoped ESLint 24 файла без ошибок/предупреждений, module dependencies 15 495 файлов без нарушений. Сценарий публикации оптимизирован для библиотеки около 8 700 File: точный slug и связанные File ID, без повторного чтения всей библиотеки. Улучшения CLI находятся в той же ветке и не меняют развёрнутое приложение. 451 посторонний путь сохранён.

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

Релиз [0.0.330](https://github.com/singlepagestartup/singlepagestartup/releases/tag/0.0.330), код `8324e42e97`, Host/API подтверждены на сервере. Публичные страницы используют ISR; session reads остаются в клиентских моделях/приватном no-store. Hidden Page/Article/Product/обязательная связь возвращают 404 после прогретого HIT, восстановленные — 200. Проверены все поля и внешние ключи после частичного PATCH.

Финальная ревизия: 281 тест пройден, один прежний skipped; TypeScript в production build; scoped ESLint — 36 файлов без ошибок/предупреждений; module dependencies — 15 494 файла без нарушений. Исходная локальная БД `sps-lite-7` используется API. Транзакционные проверки seed/partial PATCH откатились.

В production 52 ru Page шаблона со связями; маски Metadata статей/товаров, общая и домашняя обложки, H1 статических страниц. Четыре пустые тестовые статьи hidden; Article demo и тестовый Store noindex. Обход: 138 URL, все 200 с canonical/lang/description/OG и одним H1. Lighthouse SEO 100 на пяти URL; Performance 78/43/44/40/36.

Полная [рецензия в issue #380](https://github.com/singlepagestartup/singlepagestartup/issues/380#issuecomment-6514109866) и [локальный документ](../../research/singlepagestartup/ISSUE-380-production-review.md); 18 отчётов приложены к релизу. Серверный PATCH-инцидент и восстановление из версионированных данных описаны там же.

## Remaining

[PR #382](https://github.com/singlepagestartup/singlepagestartup/pull/382) передаётся в Code Review. Следующие улучшения вынесены в рецензию: bundle, CLS/изображения, описания/переводы, seed Metadata, Store и аналитика. Фактическое присутствие в Google требует Search Console и переобхода. m2commerce.ru не обновлялся.

Host 3000, API 4000 и Storybook 4321 оставлены работающими. Ветка `codex/studio-linear-workflow` сохранена; посторонние Studio/workflow-файлы не входят в SEO-коммиты. Ниже — история промежуточных инцидентов, включая прежнее временное request rendering; актуальный режим — ISR.

## Incident Log

<!-- incident-count: 14 -->

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

## История продолжения до 0.0.330

Код ISR завершён и прошёл production build, 193 теста и HTTP-сценарии.
Локальный итоговый sitemap — 128 адресов после noindex для демонстрационных
дублей. Все адреса отвечают 200 и имеют canonical; шесть отсутствующих H1 и
пустые тестовые материалы записываются в итоговую рецензию.
Осталось выпустить проверенный коммит, перенести языковые шаблоны и политику
noindex на тестовый production, выполнить повторный аудит/Lighthouse и
опубликовать рецензию в issue #380. Статус остаётся in_progress до этих действий.

### Incident 13 — Тип filters в счётчике admin v1

- **Phase**: Implement continuation
- **Occurrences**: 1
- **Symptom**: production build отклонил обращение `params.filters` в ветке без поиска.
- **Root Cause**: выводимый union-тип не гарантировал это поле после spread.
- **Fix**: начальные фильтры явно включены в обе ветки; таблицы — 7 тестов, повторная production-сборка с TypeScript прошла.
- **Preventive Action**: проверять общий reader production-сборкой после изменения параметров запросов.

### Incident 14 — Объём File inventory в сценарии публикации

- **Phase**: Production verification
- **Occurrences**: 1
- **Symptom**: библиотека production содержит около 8 700 File; полное чтение на каждую обложку и при readback задерживало публикацию.
- **Root Cause**: несвязанные File перечислялись вместе с целевыми.
- **Fix**: загрузки ищутся по точному slug с limit=2; verifier читает связанные и ожидаемые File ID пакетами по 100 и проверяет конкурирующие связи. Runtime — 9 тестов; 104 production комплекта проверены. Старый read-only verifier остановлен, его собственный lock удалён после подтверждения завершения процесса.
- **Preventive Action**: проверять data-management flows на большой посторонней библиотеке; не сканировать коллекцию для поиска одного стабильного ключа.

Один ранний apply остановился на валидации File. Новая попытка использовала тот же manifest и переиспользовала загрузки; все 104 комплекта завершены и проверены без дублей. Причина разового неполного ответа не установлена; ошибка upload теперь содержит диагностические поля без секретов.
