---
issue_number: 376
repository: singlepagestartup
branch: codex/issue-376-framework-visual
source_revision: 129dd65f92
status: ready_for_human_code_review
---

# ISSUE-376 — Blog после пользовательского review

Локальный Blog содержит шесть полных статей на EN/RU, по две для Frontend,
Backend и DevOps. Каждая статья объясняет используемый в SPS архитектурный
приём, содержит код и ссылки на проверенные исходники. Категории, изображения
и редакционный автор читаются из настоящих SDK-связей. Карточки Article и
Category открываются по изображению и свободной области; вторичные ссылки
работают отдельно. Navbar использует размеры, отступы, mobile menu и controls
из Studio, сохраняя текущие ссылки и операции корзины.

## Статьи

| Категория | Тема                                                   | Local URL                                                                  |
| --------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Frontend  | Next.js readers, client boundaries и Widget slots      | /en/blog/articles/nextjs-server-client-readers-and-widget-slots            |
| Frontend  | React Query, realtime и principal scopes               | /en/blog/articles/react-query-realtime-and-principal-scopes                |
| Backend   | Hono: controllers, services, repositories и middleware | /en/blog/articles/hono-api-layers-di-and-owned-middleware                  |
| Backend   | Подписка и доступ к private Article content            | /en/blog/articles/framework-private-content-audit                          |
| DevOps    | Nx, Bun, Docker и generated migrations                 | /en/blog/articles/nx-bun-docker-and-generated-migrations                   |
| DevOps    | Сборка, revalidation и безопасные content cutovers     | /en/blog/articles/building-and-revalidating-sps-with-safe-content-cutovers |

Публичные тексты, TipTap JSON, ссылки на источники и EN/RU content находятся в
`ISSUE-376-blog-content.json`. Каждый английский текст содержит 709–738 слов,
русский — 712–728, без кода и списков источников. Автор — редакция
SinglePageStartup с существующим brand avatar; личные биографии не придуманы.

## Контент и изображения

Публикация через нормальные server SDK на localhost:4000 выполнила 51 операцию.
Проверены точные Article/Category/author/cover/avatar и Widget curation links.
Восемь прежних Article удалены после проверки нового графа. Три категории
сохранили свои ID. Private Article сохранила ID и slug, association, subscription
Product и защищённый Website Builder/File graph; её публичное описание и
закрытый практический appendix обновлены отдельно. Protected body и before
snapshots хранятся вне Git.

Отдельный old public WB Widget удалён после свежей проверки единственного
входящего Article-link, всех исходящих связей и отсутствия Host/других
потребителей. Перед удалением сохранён mode-0600 before snapshot. Файлы,
Product и другие WB records не удалялись. Две отсутствующие public Social GET
permissions созданы только для author/avatar relations; существующие Role
bindings не менялись. Subject routes не открывались.

Повтор apply выполнил 0 записей; fresh prepare по окончательному состоянию
показал 0 операций. Verify: 6 Articles, 3 Categories, 8 retired, protected graph
unchanged. Инструмент `tools/runtime/blog-example-content.ts` требует явные IDs,
localhost origin и exclusive CMS window; snapshot и прогресс позволяют
продолжить неизвестный результат запроса. Автоматического rollback удалённых
Article нет. Repository database snapshots не изменялись.

Шесть photographic masters с людьми созданы через image_gen.imagegen в
стилистике Living Focus. Квадратные delivery images получены отдельным outpaint
с расширением canvas; masters сохранены. Все 12 изображений зарегистрированы
с proposal_id living-focus, lifecycle proposed и confirmation false. Exact
prompts и adaptation находятся в workspace/utils/media/issue-376-blog-\*.json,
изображения — assets/singlepage/generated/living-focus/blog. Семь загруженных
File bytes (шесть covers и brand avatar) сверены по SHA256 с источниками.

## Компоненты и границы

Social владеет Profile byline и точной author association; Host создаёт
rendered author slot после загрузки Article. Blog не импортирует Social или
RBAC. Category cover использует первое вложение первой ordered Article;
схема Category не менялась. Один Profile-owned BylineSkeleton покрывает model,
association и Host reader. API results остаются в общем Query cache.

Navbar сохраняет saved logo и navigation. Runtime Host leaf содержит только cart; demo Sign-in полной Storybook
composition передаётся отдельным subjectAccount slot. Новые session/account операции не
добавлялись. Корзина использует 44px rounded control, нейтральную иконку и
правый quantity badge. Mobile menu сохраняет focus при открытии и Escape.

## Проверки

- Независимые focused frontend tests: 33 / 9 suites, PASS — Blog 13, Social 10,
  Host 3, navbar 4, cart 3.
- Publication tool: 9 tests / 36 assertions, PASS; unknown create/delete outcome,
  repeat, stale records, cascade/private drift и role-bound policy races.
- Focused TypeScript всех affected roots и последнего byline fix: 0 diagnostics.
- Targeted ESLint всех изменённых TypeScript файлов и финальных byline/cart
  правок: exit 0 после устранения одного duplicate type import.
- Module audit: 14 877 source files, 0 violations; diff check PASS.
- Полный studio:validate: exit 0, включая TypeScript, 147 design-system tests,
  380 presentation tests, GitHub и pipeline tests. После поправки asset metadata
  pipeline сохраняет только прежние mascot structural items и четыре approval
  gaps; новых Blog asset findings нет. Approval states не менялись.
- Frozen Host production build исходников 129dd65f92: exit 0, включая validity
  of types. Команда использует SPS_HOST_DIST_DIR=.next-issue376-blog-accepted,
  SPS_HOST_WEBPACK_CACHE=false, NX_SKIP_NX_CACHE=true и heap 8192 MB. Собранный
  Host работает на :3000; автоматически добавленный временный tsconfig include
  восстановлен к точному HEAD.
- Final HTTP: 27 ответов 200, включая все шесть EN/RU Article, три EN/RU
  Category, Blog/Framework и восемь HTML/RSC ответов private Article/alias.
  Private marker, Widget ID и not-found digest отсутствуют.
- Final API: private WB по ID — 403; фильтрованный list — []; count — 0;
  Cache-Control private,no-store. Общие Article/Category counts — 6/3.
- Browser PASS в проверенных сценариях: реальные 320 px без page overflow,
  localized byline/plain subtitle, mobile menu и Cart drawer/Escape focus,
  четыре settled private Blog/Framework gate на EN/RU. После cutoff
  2026-10-23T08:29:08.693Z console warning/error — 0. Финальные валидные
  visual captures: desktop 2250×1190, RU Article и Cart 320×900. Девять
  capture-файлов 320×169 исключены. Final index/code/private observations
  опираются на DOM/HTTP; прежние card clicks и валидные 320 screenshots
  атрибутированы предыдущей сборке с неизменённой логикой карточек.
- Независимый final review-pr: PASS на 129dd65f92, открытых source/tool/data/
  access findings нет. Полный review и browser scope сохранены в
  ISSUE-376-reviews.md и ISSUE-376-browser.md.

Ранее зафиксированный API TypeScript baseline из 20 diagnostics не объявляется
успешной проверкой. Этот follow-up не меняет backend/schema; полный повтор API
TypeScript не выполнялся. Изолированные private/commerce/CRM integration matrix
из предыдущей приёмки остаются отдельным доказательством исходной реализации.

## Исправления при приёмке

Review-pr выявил пустое доступное имя карточки без заголовка, отсутствие
отдельного byline loading и неправильный rich-text renderer для штатного
plain-text Profile.subtitle. Все три исправлены с regression tests. Временная
нормализация subtitle возвращена через SDK к исходному текстовому формату;
окончательный fresh manifest сверяет штатное значение. Browser QA выявила
старую круглую кнопку корзины; её классы согласованы со Studio.

Повторная сборка завершилась ENOSPC при записи дискового webpack cache.
Удалены только четыре неактивных task build outputs, работающий Host сохранён.
Существующие SPS_HOST_WEBPACK_CACHE=false и NX_SKIP_NX_CACHE=true исключают
повторную запись больших build caches. Финальная сборка с этими параметрами завершилась с exit 0.

## Передача

Реализация: 4db50ba65f, 2457eebd1e, 129dd65f92. Финальный Code Review выполняет
пользователь. PR, push, merge и Done не выполняются. GitHub status: Code Review, verified 2026-10-23T08:39:01Z. Summary: https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6360936917.
