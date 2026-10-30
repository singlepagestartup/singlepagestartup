---
issue_number: 380
issue_title: SEO сборки страниц
start_date: 2026-10-28
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-380.md
status: complete
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
- [x] Опубликовать результаты и ограничения в issue #380, обновить PR #382, подтвердить Code Review.

Исходная локальная проверка: 102 Page, 2 Page→Metadata (обе для главной), 2 Metadata, 0 Metadata→File. У /blog и шаблонов Article/Product связей нет. Admin v2 передаёт серверные children через клиентскую проверку доступа; server card/table reads с includeHidden=1 не получают сессию. Новый Metadata→File admin/table не передаёт имя/форму контроллеру. Счётчик общей admin/table не учитывает фильтры.

Итоговая проверка: [0.0.331](https://github.com/singlepagestartup/singlepagestartup/releases/tag/0.0.331), код приложения `55ed9ad9b2`. Фактические Host/API — 0.0.331, running/completed. Все 102 локальные и 104 production Page связаны с отдельными Metadata и File. Прежние записи/связи сохранены; fresh prepare/apply не создаёт дублей. Все 104 публичные обложки проходят SHA-256/MIME/размеры/alt/HTTP 200. Семь иллюстраций Living Focus, оригиналы и WebP находятся в `apps/studio/workspace/assets/singlepage/generated/page-seo-v1/`.

Обе админки проверены в браузере: вход, таблицы, Page→Metadata→File, сохранение Metadata/File и draft preview. Новая Page использует ru из настроек. Публичный маршрут — SSG/ISR. Production: Metadata title → обновление HIT, hidden Page/Article/Product/обязательной связи → 404, восстановление → 200, остальные поля сохранены. Cookie не меняет публичный HIT; анонимный административный read — 403.

Production sitemap: 136 URL, все 200 с canonical/lang/description/OG и одним H1, без noindex и ошибочного JSON-LD. Локально — 124 URL после исправления H1, noindex формы создания статьи/demo Store и восстановления Analytic из точной прежней резервной копии. Четыре прежние пустые production-статьи сохраняют hidden. Все временные fixture удалены.

Lighthouse 13.6.0 mobile: SEO 100 на семи URL; Performance 80/50/30/22/31/32/51. Долги: JS, LCP/CLS, восемь общих description, переводы, FileInput и seed Metadata. Полная рецензия: [ISSUE-380-completion-review.md](../../research/singlepagestartup/ISSUE-380-completion-review.md).

Яндекс: живые проверки 404 и 200 прошли. 136 адресов приняты на переобход 30.10.2026 14:25, все «В очереди». Общая диагностика не обновляется из-за сбоя Яндекса; её кнопка проверки отключена.

Код: 60 целевых тестов, TypeScript/production build, scoped ESLint 24 файла без ошибок/предупреждений, module dependencies 15 495 файлов без нарушений. Сценарий публикации оптимизирован для библиотеки около 8 700 File: точный slug и связанные File ID, без повторного чтения всей библиотеки. Улучшения CLI находятся в той же ветке и не меняют развёрнутое приложение. 451 посторонний путь сохранён.

Рецензия опубликована: https://github.com/singlepagestartup/singlepagestartup/issues/380#issuecomment-6521794094. PR #382 обновлён; helper подтвердил статус issue **Code Review**. Работа по текущему запросу завершена, приёмка владельцем остаётся в PR.

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

## Перенос предпросмотра в Metadata API — 30.10.2026

Запрос: предпросмотр принадлежит модели Metadata в apps/api и вызывается
через SDK. Ветка codex/studio-linear-workflow сохраняется.

- [x] Общая сборка масок, fallback, обложек и JSON-LD перенесена в сервис Metadata.
- [x] API предоставляет POST /api/host/metadata/preview и GET /api/host/metadata/seo.
- [x] Host /api/seo-preview удалён; Next SDK оставляет адаптацию Metadata и 404.
- [x] Preview исключён из публикации событий мутаций и кеширования.
- [x] Проверки сервиса, HTTP-контракта, SDK и зависимостей.
- [x] Проверка предпросмотра в admin v1 и admin v2 на исходной базе.
- [x] Hidden Page/основная сущность проверены тестами; HTTP 404 проверен для отсутствующей страницы и служебного предпросмотра.

Проверка переноса завершена:

- 51 тест Metadata, Next-адаптера, Page document и URL SDK; 20 тестов правил
  авторизации, кеша и инвалидации — пройдены.
- Обе админки открыты в браузере под существующей сессией. Несохранённые маски
  title/description разрешились в русский заголовок статьи framework-blog;
  показаны canonical и обложка. Admin v2 отклоняет /ru/admin/host с 404.
  Формы закрыты без сохранения; повторное чтение Metadata подтвердило исходные значения.
- HTTP: preview 200/no-store/noindex; отсутствующая и служебная Page 404,
  неизвестный язык и неверная маска 400, превышение 64 KiB 413.
- Production build Host пройден. Публичный catch-all — SSG, admin — dynamic;
  Host /api/seo-preview отсутствует в сборке.
- Отдельный production-процесс на 3301: framework и статья вернули 200,
  MISS → HIT и s-maxage=3600. Запрос с тестовым cookie получил тот же HTML.
  Preview не изменил и не инвалидировал прогретую публичную страницу.
  Отсутствующая Page вернула 404. Старый Host URL: GET 404, POST 405
  (Next не обслуживает этот метод после удаления endpoint).
- Проверка типов Host пройдена. API: 21 диагностическое сообщение совпадает
  с исходным кодом; новых нет. Сравнение выполнено CompilerHost с исходными
  текстами из Git в памяти, без изменения рабочей копии.
- При подключении Page SDK к Bun проверен тип запроса Urls: no-store задаётся
  через общий NextRequestOptions, без изменения поведения запроса.
- Временный production-процесс остановлен; 3000/4000 сохранены.
  Ветка codex/studio-linear-workflow не менялась. Production не обновлялся.

Снимки проверки: /tmp/sps-seo-admin-v1.png, /tmp/sps-seo-admin-v2.png.
Технические результаты: /tmp/sps-seo-api-types.json,
/tmp/sps-seo-host-build.log, /tmp/sps-seo-api-types-summary.log.

## Page как источник политики SEO — 30.10.2026

Требование владельца: состояние индексации хранится в Host Page.variant.
Модели, используемые в URL и масках Metadata, не получают отдельной политики SEO.
Page → Metadata остаётся источником заголовка, описания, keywords и изображений.

- [x] Удалены SEO_NON_INDEXABLE_PATHS, SEO_PUBLIC_ROUTE_COLLECTIONS и SEO_ROUTE_RELATIONS.
- [x] Источники URL/масок зарегистрированы из фактических API-моделей; ключи
      связей берутся из схем внешних ключей. Имена моделей в SEO не перечисляются.
- [x] default/пользовательский вариант публикует Page; hidden/draft дают 404;
      noindex оставляет доступную страницу без sitemap и с robots=noindex.
- [x] 48 прежних исключений на исходной базе перенесены в variant=noindex
      через SDK. Снимок исходных состояний: /tmp/sps-page-variant-migration.json.
- [x] SEO использует связанную Metadata и её маски; автоматические fallback
      из article/product/profile.metadata.seo и угадывание BlogPosting/Product удалены.
      Общий JSON-LD WebPage строится из рассчитанных метаданных Page.
- [x] Robots разрешает чтение noindex и указывает sitemap. Host не повторяет
      фильтры маршрутов и не назначает поисковикам универсальные Clean-param.
- [x] Аудит 318 форм: связи перенесены вниз в восьми формах; preview Metadata
      помещён после полей. У 14 таблиц добавлены явные имена.
- [x] В карточках Metadata показан title; подсказки о масках удалены.
      Связь с File Storage названа Files/File. Исправлены шаблоны генератора таблиц.
- [x] 67 целевых тестов пройдены. Проверка типов Host пройдена; API сохраняет
      21 исходное диагностическое сообщение, новых нет. Проверка 15 509 исходных
      файлов не нашла нарушений направления модульных зависимостей.
- [x] Проверка обеих админок в браузере: названия Metadata видны, поля находятся
      перед связями/preview, вкладка связи названа Files. Несохранённая маска title
      разрешилась в русский заголовок статьи в обеих формах. Формы закрыты без сохранения.
- [x] Production build Host пройден: публичный catch-all — SSG с ISR,
      административный — dynamic. У framework и статьи проверены MISS → HIT,
      s-maxage=3600 и одинаковый публичный HTML с тестовым cookie. Preview не
      изменяет и не инвалидирует сохранённый публичный HTML.
- [x] На production Host с исходной базой проверен полный цикл
      default → noindex → hidden → default. Проверены HTTP-статусы, robots в HTML,
      связанные Metadata и исключение URL из sitemap, включая общий URL-шаблон,
      который перекрывается отдельной Page. Временные записи удалены.
- [x] Все 122 URL из текущего Page API возвращают SEO HTTP 200, index=true,
      непустые title/description и ожидаемый canonical. Временных URL в выдаче нет.
- [x] Robots разрешает обход и публикует sitemap. Отдельный процесс на 3301
      остановлен. Собранный Host оставлен на 3000, API — на 4000; API отправляет
      инвалидации на настроенный Host 3000. Ветка не менялась. Удалённый сервер
      в этой доработке не обновлялся.

Аудит порядка полей охватывает 318 форм; пропущенных имён нет в 636 файлах
таблиц. Тесты приоритета маршрутов подтверждают, что общий URL-шаблон не
возвращает в sitemap адрес отдельной hidden/draft/noindex Page того же языка.

У 26 URL есть диагностические сообщения о неразрешившихся масках; используется
fallback Metadata. У восьми из них пусты исходные текстовые поля товара или
категории: free-subscription, startup, website и important-tomato-bonobo
в ru/en. Эти замечания относятся к наполнению тестовой базы; они не изменяют
сохранённый вариант Page. Остальные сообщения относятся к маскам файлов.
Подробный результат: /tmp/sps-page-final-audit.json. Проверка типов API после
финальных изменений также сохранила 21 исходное сообщение без новых ошибок.

Снимки: /tmp/sps-page-admin-v1-preview.png,
/tmp/sps-page-production-metadata-cards.png,
/tmp/sps-page-production-metadata-files.png.
Логи: /tmp/sps-page-production-build.log,
/tmp/sps-page-isr-result.log,
/tmp/sps-page-shadow-policy-production-3000.log,
/tmp/sps-page-api-types-final-summary.log.

Старая колонка Page.indexing сохранена для совместимости схемы и не участвует
в решении об индексации. При обновлении дочернего проекта необходимо проверить
и перенести прежние исключения в сохранённые варианты Page.

## Варианты компонентов и единый кеш — 30.10.2026

Вариант модели/связи выбирает компонент представления. Общий CRUD и readers
не назначают варианту hidden правил доступа или фильтрации. Ограничения выборки
передаются явно через стандартные filters. Ранее согласованная политика
публичного URL и sitemap остаётся в Host Page.

- [x] Удалить includeHidden/publicOnly и автоматические фильтры/404 из общего CRUD.
- [x] Удалить shouldHideRecord из входных компонентов и шаблонов генератора.
- [x] Сохранить обычный выбор компонента hidden через registry.
- [x] Удалить старый кеш ответов и переключение на него; сохранить один
      кеш с изоляцией авторизационного контекста и проверкой версий зависимостей.
- [x] Сохранить проверки RBAC, Next-инвалидацию и WebSocket-уведомления.
- [x] Проверить обычные filters, обе админки, Host Page и защиту приватных ответов.
- [x] Обновить документацию и инструкции для дочерних проектов.

Входные компоненты выбирают вариант из registry. Сохранённый variant записи
не отменяет явно выбранный компонент. Общие find/count/findById возвращают
записи по переданным filters и правилам RBAC; скрытие на уровне общего CRUD
удалено. Компоненты hidden и их регистрация сохранены. Это распространяется
и на шаблоны генератора новых моделей и связей.

Проверки:

- 163 целевых теста пройдены, включая кеш, REST, readers, выбор варианта,
  Metadata, Host Page, SDK публикации SEO и интеграцию с Redis и двумя
  WebSocket-клиентами. Повторные запуски одних тестов в число не включены.
- Проверка типов Host пройдена. API сохраняет 21 исходное диагностическое
  сообщение; новых нет. Проверка 15 510 исходных файлов не нашла нарушений
  направления модульных зависимостей. `git diff --check` пройден.
- Production build Host пройден: публичный catch-all использует SSG с ISR.
  Framework и статья возвращают HTTP 200, MISS → HIT, `s-maxage=3600` и
  одинаковый публичный HTML с тестовым cookie. Preview не меняет и не
  инвалидирует этот HTML. Несуществующая Page возвращает 404; удалённый
  Host preview route — 404 для GET и 405 для POST.
- На исходной тестовой базе проверен цикл Page
  default → noindex → hidden → default: HTTP-статусы, robots в HTML,
  связанные Metadata и sitemap. Общий URL-шаблон не возвращает исключённую
  отдельную Page в sitemap. Временные Page, Metadata и связи удалены.
- Через реальный API проверено: Metadata с variant hidden доступна в find,
  count и findById; обычный фильтр `variant ne hidden` исключает её.
  Кеш возвращает HIT и после изменения записи отдаёт новое состояние.
  Временная Metadata удалена.
- После прогрева приватного URL оператором анонимный запрос к тому же URL
  получает отказ. Анонимная очистка кеша запрещена; операторская очистка
  работает повторно и сама не кешируется. Её guard выполняется до кеша.
  Очистка удаляет только пространство ключей ответов API, сохраняя остальные
  данные KV. Изоляция Authorization, Cookie и X-RBAC-SECRET-KEY также
  проверена отдельными тестами.
- В обеих админках загрузились поля Metadata и связи с File и Page.
  Ошибок в консоли нет. Формы закрыты без сохранения.

Host с проверенной production-сборкой оставлен на 3000, API — на 4000.
Для проверки единого кеша API временно запускался с
`MIDDLEWARE_HTTP_CACHE=true`; после проверки восстановлен исходный режим
запуска без этого флага. Файлы окружения не менялись. Ветка остаётся
`codex/studio-linear-workflow`. Удалённый сервер в этой доработке не обновлялся.
Схемы БД и сохранённые снимки данных не менялись.

При переносе в дочерний проект:

- Удалить использование includeHidden/publicOnly и helpers public-read.
  Ограничения выборки задавать обычными filters в нужном reader или сервисе.
  Проверки доступа остаются в RBAC и специализированных API.
- Удалить импорт HTTPCacheMiddleware и настройку SPS_CONSISTENCY_MODE.
  Для кеша ответов использовать `consistencyRuntime.cache()` после
  авторизации, сохраняя исключения маршрутов с controller-level guards.
  Единственный переключатель кеширования — `MIDDLEWARE_HTTP_CACHE`.
- Сохранить `consistencyRuntime.middleware()`, доставку изменений,
  Next-инвалидацию и WebSocket-уведомления независимо от переключателя кеша.
  Очистка по `/api/http-cache/clear` остаётся защищённой ключом оператора.
- Проверить сохранённые варианты Host Page: только эта модель управляет
  политикой публичных URL и включением в sitemap.

Снимки: /tmp/sps-variant-admin-v1.png, /tmp/sps-variant-admin-v2.png.
Логи: /tmp/sps-variant-production-build.log,
/tmp/sps-variant-page-isr-cycle.log, /tmp/sps-variant-isr-hit.log,
/tmp/sps-variant-http-check.log, /tmp/sps-single-cache-transport.log,
/tmp/sps-variant-host-types.log, /tmp/sps-variant-api-types.log,
/tmp/sps-variant-module-dependencies.log.

## Рефакторинг API composition — 30.10.2026

Входной app.ts подключает модули, middleware и транспорт. Глобальная защита
графа демонстрационной статьи удаляется; показ дополнительных виджетов остаётся
за клиентским вариантом с проверкой доступа. Правила подписок сохраняются в RBAC.
Host получает описания источников масок через публичные контракты модулей,
контроллеров и сервисов. Прямого доступа к репозиториям из apps/api нет.
HTTPCacheMiddleware сохраняется как отдельный middleware над единым кешем.

- [x] Убрать глобальный граф статьи и восстановить клиентский пример доступа.
- [x] Перенести правила отзыва подписок в сервис RBAC и его подключение в модуль.
- [x] Передавать Host описания маршрутов через слои приложения без Table в composition.
- [x] Вынести transport/read tracking и вернуть HTTPCacheMiddleware.
- [x] Проверить SEO, SSG/ISR, обычный API, подписки, middleware и WebSocket transport.

В app.ts осталось 163 строки вместо 558: модули, middleware, CORS и выдача
статических файлов. Правила заказов, отзыв подписок, обход графа и доступ к
репозиториям из этого файла удалены.

Модули публикуют describeRoutes. Описание ресурса проходит через
DefaultApp → RESTController → CRUDService → DatabaseRepository.describe;
оно содержит строки с именами полей, квалифицированными именами таблиц и
внешними ключами. Host связывает эти описания с Page/Metadata через контроллеры.
Объекты Drizzle Table и экземпляры репозиториев между модулями не передаются.
Публичные bootstrap возвращают конкретный App; генератор сохраняет этот контракт.

HTTPCacheMiddleware снова является отдельным middleware. Он получает единый
runtime и делегирует ему кеширование и очистку. ConsistencyMiddleware владеет
отслеживанием чтений, check/status routes, WebSocket и запуском доставки.
Авторизация и разбор запроса выполняются до кеша; guard очистки — вне кеша.
Административный доступ к исходным Profile остаётся в middleware RBAC.

Глобальные content/byte guards статьи, граф, Subject content-route и его SDK
удалены. Клиентский пример проверяет разрешение перед монтированием читателей
виджетов. Вариант private у связи отображает Widget обычным способом; ограничения
общего API из этого варианта не выводятся. Правила оплаты, периодов подписки
и отзыва ролей сохранены в сервисе RBAC Subject.

Проверки:

- 134 целевых теста пройдены: 54 теста новых контрактов и композиции,
  78 регрессионных и две интеграционные проверки. Повторные восемь тестов
  middleware также пройдены и в итоговое число повторно не включены.
- Интеграция с настоящим Redis и двумя TCP WebSocket-клиентами использует
  ConsistencyMiddleware и HTTPCacheMiddleware. SDK/controller checkout
  проверен в транзакционных фикстурах исходной БД с фиктивной оплатой.
- Типы Host и production build пройдены. API содержит 20 прежних ошибок
  типов вместо 21; новых нет. Проверка 15 501 исходного файла не нашла
  нарушений направления зависимостей модулей. git diff --check пройден.
- На запущенном API с временно включённым HTTP cache проверены HIT,
  свежесть после записи, изоляция операторского и анонимного запроса и
  операторская очистка. Metadata с hidden читается обычным CRUD и исключается
  явным фильтром. Временная Metadata удалена.
- Временная связь статьи с private и её Widget доступны через обычный
  анонимный API. Удалённый content-route возвращает 404. Временные Article,
  Widget и связь удалены. Анонимное чтение исходных Profile возвращает 403.
- Новая production-сборка: Page default → noindex → hidden → default,
  соответствующие HTTP/robots/sitemap, связанные Metadata, перекрывающиеся
  маски и robots.txt проверены. Временные Page/Metadata/связи удалены.
- Framework и статья сохраняют SSG/ISR, s-maxage=3600 и HIT с тем же публичным
  HTML при тестовом cookie. Preview не заменяет и не инвалидирует публичный
  HTML. Изолированная проверка выполнена после доставки инвалидаций очистки
  фикстур: первая попытка совпала с этой асинхронной доставкой и получила MISS.
- Framework, статья и обе админки открыты в браузере без ошибок консоли.
  В обеих формах несохранённая маска title разрешилась в русский заголовок
  статьи через API preview. Связи File/Page загрузились; формы закрыты без
  сохранения.

Host с новой production-сборкой оставлен на 3000, API — на 4000 с исходными
настройками окружения. MIDDLEWARE_HTTP_CACHE=true использовался только для
проверки и не записывался в env-файлы. Схемы, миграции и снимки данных БД
не менялись. Ветка прежняя; удалённого deployment в этой доработке нет.

При переносе дочерних изменений необходимо сохранить describeRoutes в своих
module App, описания через контроллер/сервис для собственных источников масок
и типизированный bootstrap. Подключать Host через configureRouting, RBAC через
middleware модуля, а HTTP cache — через HTTPCacheMiddleware с единственным
runtime. Собственные подписочные правила остаются в RBAC. Демонстрационный
frontend статьи не предоставляет отдельной доставки приватных статей;
проекты с такой функцией сохраняют её в своих Subject-scoped операциях.

Снимки: /tmp/sps-api-composition-article.png,
/tmp/sps-api-composition-admin-v1-preview.png,
/tmp/sps-api-composition-admin-v2-preview.png.
Логи: /tmp/sps-api-composition-tests.log,
/tmp/sps-api-composition-regressions.log, /tmp/sps-api-composition-transport.log,
/tmp/sps-api-composition-types.log, /tmp/sps-api-composition-production-build.log,
/tmp/sps-api-composition-http-cache-check.log,
/tmp/sps-api-composition-public-article.log,
/tmp/sps-api-composition-page-cycle.log, /tmp/sps-api-composition-isr.log.

## Page владеет SEO-операциями — 30.10.2026

Page разрешает URL, проверяет публикацию и через PagesToMetadata выбирает
метаданные. Metadata хранит и редактирует свои значения и связи с Files.
Page-зависимые сервисы, роуты, контракты и SDK переносятся в Page; Metadata
не обращается к Page. Предпросмотр подключается к формам через слот из Host.

- [x] Перенести SEO/preview endpoints и сборку результата в Page.
- [x] Перенести контракты и SDK, обновить Next document/metadata.
- [x] Перенести preview в Page и подключить слотом к обеим админкам.
- [x] Обновить пермишены, кеш/инвалидацию, документацию и проверки.
- [x] Проверить новые/удалённые API, обе админки и production SSG/ISR.

Итоговая цепочка: Page service → PagesToMetadata SDK → Metadata SDK.
Page читает собственный findByUrl через внедрённый callback; обращения
к Page HTTP SDK из этого сервиса нет. GET /api/host/pages/seo и POST
/api/host/pages/seo-preview зарегистрированы в Page. Старые специализированные
обработчики Metadata удалены. Metadata содержит CRUD, редактируемые SEO-значения
и связи с Files. Обратных импортов Page в Metadata нет.

Page SDK обслуживает Next generateMetadata/document и обе клиентские формы.
Host передаёт Page seo-preview через типизированный preview-слот Metadata;
Control остаётся у формы, useWatch — у preview reader. В клиентские формы
передаются явные UI-пропсы. Studio preview зарегистрирован под
host.page.seo-preview; блок, история, Figma metadata и ссылки композиции обновлены.

Проверки:

- 132 теста Host и затронутых middleware плюс 5 тестов Next Page: 137 passed.
- Полная проверка типов Host и окончательная production-сборка прошли.
  Публичный catch-all отмечен Next как SSG; админка остаётся dynamic.
- API: 20 прежних type diagnostics, новых нет. Проверка зависимостей:
  15 503 исходных файла, 0 нарушений. Общий code-placement check показывает
  существующий конфликт Files.tsx/Files в незавершённых изменениях Studio;
  этот перенос новых конфликтов не добавляет.
- На исходной тестовой БД Page SDK разрешил title-маску статьи и обложку.
  Preview вернул no-store/noindex и не сохранил черновик.
- При включённом едином HTTP cache агрегат Page SEO вернул HIT. Изменение
  Metadata обновило результат; preview сохранил прогретый ответ.
- Цикл default → noindex → hidden → default проверен по HTTP, HTML robots,
  связанным Metadata и sitemap, включая перекрывающую URL-маску.
  Изменение связанной Metadata обновило уже прогретый ISR HTML без cache busting.
- /ru/framework и /ru/blog/articles/framework-blog: HTTP 200, HIT и
  s-maxage=3600; тестовая cookie не изменила публичный HTML. Preview не
  инвалидировал документ. Несуществующая Page вернула 404; удалённый Host
  preview вернул GET 404 / POST 405. Robots публикует sitemap без списков URL.
- Обе production-админки открыли Metadata и разрешили несохранённую маску
  [blog.articles.title] для /ru/blog/articles/framework-blog. Console errors: 0. Формы закрыты без сохранения; временные записи всех API-проверок удалены.
- Storybook 4321 открыл Modules/Host/Page/Singlepage/seo-preview / Localized Masks.

Дочерние проекты переводят свои SEO imports, API consumers и Page-aware типы
с Metadata на Page; preview подключают из Host клиентским слотом. Источники
URL/масок конфигурируются только у Page. Данные Page–Metadata–File, их ID,
связи и маски сохраняются; миграция БД для этого переноса не нужна.

Доказательства: /tmp/sps-page-seo-admin-v1-preview.png,
/tmp/sps-page-seo-admin-v2-preview.png. Логи:
/tmp/sps-page-seo-all-jest.log, /tmp/sps-page-seo-next-jest.log,
/tmp/sps-page-seo-api-types-final.log, /tmp/sps-page-seo-host-types-final.log,
/tmp/sps-page-seo-build.log, /tmp/sps-page-owned-api-check.log,
/tmp/sps-page-owned-cache-check.log, /tmp/sps-page-owned-policy-check.log,
/tmp/sps-page-owned-isr-check.log. Эти изменения проверены локально на 3000/4000;
удалённый релиз и повторный Lighthouse в этот перенос не входят.

## Одна Page для всех языков — 31.10.2026

Page определяется URL и маской. Язык выбирает представление JSON-полей и SEO,
а не отдельную запись Page. Язык не передаётся отдельным query-параметром.
Полный URL с префиксом определяет язык; путь без префикса использует настройку
по умолчанию. Legacy Page.language не участвует в поиске или sitemap.

- [x] Удалить language из lookup/SEO query и фильтрации Page.
- [x] Объединить 51 языковую пару тестовых Pages, сохранив исходные ID,
      общие виджеты/макеты, переводы SEO в JSON и резервную копию исходных записей.
- [x] Вернуть уникальность URL штатной Drizzle-генерацией после объединения.
- [x] Обновить обе формы, sitemap, SDK, runtime-инструменты и документацию.
- [x] Проверить русский, английский и язык по умолчанию, отсутствие language
      в query, одинаковый Page ID, hidden/noindex, кеш и production ISR.

Результат:

- Page lookup и URL enumeration не фильтруют записи по language. Контроллеры,
  SDK и SEO schema не принимают отдельный language query. SEO и preview
  используют полный URL: /en/about выбирает английские JSON-значения, /about —
  настроенный русский язык. Компоненты сохраняют свой контекст отображения.
- В исходной тестовой БД 102 Page объединены в 51 уникальный URL. Сохранены
  исходные ID, одинаковые Widget/Layout связи и все Metadata/File записи.
  Различающиеся буквальные SEO-переводы находятся в Page.metadata.seo и
  Page.metadata.seoDisplay; связанные Metadata используют явные маски.
  Одинаковые динамические маски Article/Product/Profile сохранены.
- Legacy Page.language существовал до SEO-задачи. Он сохранён как неиспользуемое
  поле совместимости и не участвует в identity, lookup, sitemap или формах Page.
- Два файла миграций и snapshots/journal созданы repository-generate:
  0003 добавляет JSON metadata, 0004 восстанавливает unique(url). Runtime-tool
  page-languages.ts сохраняет before-images, проверяет состав страниц и отказывается
  перетирать изменения после prepare. Повторный apply сохраняет завершённые шаги.
- Для обновления установок с дублями Page migrate поддерживает --through=3:
  сначала штатный префикс generated migrations через Drizzle, затем SDK
  consolidation, затем обычный migrate. Это не переписывает SQL/journal.
  Обычный общий мигратор без аргументов сохраняет прежнее поведение.
- Обе формы Page редактируют JSON через существующий MetadataField; передают
  \_expectedMetadata при записи. Studio использует URL uniqueness и JSON-поле.
  page-seo input v2 содержит одну декларацию на URL и допускает Page metadata.
- Sitemap разворачивает один набор Page URL во все настроенные языки. Hidden,
  draft и noindex исключаются до разворачивания; отдельные записи для языков
  не создаются.

Проверки:

- 129 Jest-проверок Host/мигратора + 10 Next route/sitemap + 13 Bun runtime
  - 1 Studio Provider: 153 passed. Полная проверка типов Host и production
    build прошли; публичный catch-all остаётся SSG/ISR. API: прежние 20
    type diagnostics, новых нет; module-dependencies — 0 нарушений.
- /about, /ru/about и /en/about разрешаются в Page
  99ffcce1-adf1-44c0-878a-19902b9151ff. Русский заголовок — «О SinglePageStartup»,
  английский — «About SinglePageStartup». Bare /about перенаправляется 308 на
  /ru/about. В захваченных SDK запросах language query отсутствует.
- Article SEO и HTML: /ru/blog/articles/framework-blog — «Покажите свой опыт
  в статьях — SinglePageStartup»; /en/... — «Share your expertise in articles
  — SinglePageStartup». Статья и Page общие для двух языков.
- About HTML: верные title, canonical, html lang и og:locale, ISR HIT и
  s-maxage=3600. API response cache даёт HIT отдельно для обоих полных URL
  и не смешивает тексты. Изменение английского JSON-заголовка обновляет ISR;
  русский заголовок остаётся прежним.
- noindex → hidden → default проверен в обоих языках по HTTP status, robots и
  sitemap. Missing English Page возвращает 404. Временная Page, Metadata и
  связь удалены; в БД осталось 51 уникальное значение URL.
- Обе production-админки открыли JSON одной Page, переключили его на English
  и разрешили /en/about в Metadata preview. Console errors: 0; формы закрыты
  без сохранения. Тестовое включение HTTP cache не меняло env-файлы.

Before-images и завершённый manifest: /tmp/sps-page-languages-manifest.json
(вне Git). Логи: /tmp/sps-page-language-check.log,
/tmp/sps-page-languages-host-check.log, /tmp/sps-page-languages-build.log,
/tmp/sps-page-languages-jest-final.log, /tmp/sps-page-languages-next-jest.log,
/tmp/sps-page-languages-runtime-tests-final.log,
/tmp/sps-page-languages-studio-tests.log, /tmp/sps-page-languages-api-types.log.
Снимки: /tmp/sps-page-languages-page-admin-v1.png,
/tmp/sps-page-languages-page-admin-v2.png,
/tmp/sps-page-languages-preview-admin-v1.png,
/tmp/sps-page-languages-preview-admin-v2.png. Проверено локально на 3000/4000;
удалённый сервер этим исправлением не обновлялся.

## Публичный Subject API для деталей товара — 31.10.2026

Widget product overview использует публичный Subject и его варианты вместо
глубоких импортов Category/Profile из me Product card. Категории и авторы —
публичные данные товара; отдельная сессия для них не нужна. Их варианты
зарегистрированы как ecommerce-module-product-category-default и
ecommerce-module-product-profile-default в singlepage registry и props union.
Префикс me остаётся у текущего Subject и действий корзины/покупки.

- [x] Перенести помощники в самостоятельные варианты Subject; передавать
      ecommerceModuleProductId и language через явные типы.
- [x] Подключить Widget, me Product card и overview через публичный Subject.
- [x] Сохранить public authorFind DTO, обычные фильтры связей и client/server
      readers; не читать текущий Subject при показе публичных деталей.
- [x] Проверить отсутствие запросов без Product ID, публичный SSR H1 и
      прежнюю работу me readers. 30 tests passed; Host typecheck прошёл;
      module-dependencies: 15 507 файлов, 0 нарушений.
- [x] Production build прошёл; публичный catch-all отмечен SSG. На реальном
      товаре framework-startup анонимный HTML содержит H1, категорию и автора;
      повторный запрос получил ISR HIT с revalidate 3600. В браузере категория
      и автор отображаются; ошибок и предупреждений в консоли нет.

Старые приватные пути и IProductDetailProps удалены. Новые варианты могут
переопределяться через обычный startup registry. Проекты с собственными
глубокими импортами переходят на публичный Subject, выбирают соответствующий
вариант и передают Product ID; me cart/checkout сохраняют текущий Subject.

Проверки: /tmp/sps-subject-public-details-tests.log,
/tmp/sps-subject-public-details-types.log,
/tmp/sps-subject-public-details-dependencies.log,
/tmp/sps-subject-public-details-build.log,
/tmp/sps-subject-public-details-http.json.
Снимок: /tmp/sps-subject-public-details-product.png.
Host 3000 запущен из .next-subject-public-details, API 4000 и Storybook 4321
сохранены. Изменения проверены локально; удалённый сервер не обновлялся.

## Отдельные Author-операции и стандартный Profile CRUD — 31.10.2026

Profile Service наследует find/count/findById из CRUDService. Отдельный
Author Service не наследуется от CRUD; его методы теперь явно называются
`authorFind`, `authorFindCount`, `authorFindById`. Profile делегирует им
одноимённые операции. Стандартные методы не обогащают модель связями;
articles/products возвращает только Author detail DTO.

- [x] Убрать CRUD-названия из Author Service и обновить делегирование и тесты.
- [x] Проверить отдельные маршруты контроллера: GET/HEAD /authors,
      /authors/count и /authors/:id. SDK уже использует эти маршруты;
      публичный API не меняется.
- [x] Проверить HTTP-контракт через настоящий Profile Controller и Service
      с подставными репозиториями: стандартные фильтры/пагинация и модель,
      Author DTO со связями, отклонение CRUD-фильтров в Author route.
      Всего 10 тестов прошли. Транзакция snapshot заменена в unit-тесте,
      поскольку подставные репозитории не используют БД.
- [x] Проверить оба контракта через настоящий SDK/API 4000 на исходной базе:
      обычные list/count/detail возвращают Profile, отдельные Author-операции
      возвращают публичные данные и связанные работы. Изменений данных нет.
- [x] API: 20 существующих диагностик, новых нет. Module dependencies:
      15 508 исходных файлов, нарушений нет. Обновлена документация Profile.

Логи: /tmp/sps-author-crud-tests.log, /tmp/sps-author-crud-types.log,
/tmp/sps-author-crud-runtime.log, /tmp/sps-author-crud-dependencies.log.
Изменения локальные; релиз и обновление удалённого сервера не выполнялись.
