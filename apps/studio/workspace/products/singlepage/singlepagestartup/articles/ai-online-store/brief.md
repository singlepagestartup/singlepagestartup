---
audience: Владелец небольшой мастерской, которому нужен собственный интернет-магазин
semantic_cluster: CF-G04
goal: Подготовить свой проект на GitHub и запустить магазин на основе SinglePageStartup с ИИ-агентом
journey:
  segment: makers
  stage: reached-explanation
---

# Как создать интернет-магазин с помощью нейросетей

## Для кого и зачем

**Читатель:** Владелец небольшой мастерской, который продаёт изделия через социальные сети и хочет собственный сайт. Бюджет на разработку ограничен; он готов работать с ИИ-агентом, но не хочет разбираться в устройстве всего приложения.

**Вопрос:** Как на основе SinglePageStartup подготовить магазин керамики с каталогом, корзиной, оформлением заказа, онлайн-оплатой и уведомлением владельцу в Telegram?

**Результат чтения:** Последовательность действий, команды запуска и задания агенту. Статья начинается с копии проекта на GitHub и заканчивается проверкой покупки. Желание собрать сайт за вечер описывает ситуацию читателя; срок запуска и отсутствие ошибок не обещаются.

## Связь с продуктом

SinglePageStartup предоставляет основу магазина. Агент настраивает её под ассортимент мастерской и оформление сайта. Этап пути клиента: `makers / reached-explanation`. [Продажи и путь клиента](/?path=/story/workspace-10-products-singlepage-singlepagestartup--sales).

Следующее действие — [подготовить GitHub и свою копию проекта](/?path=/story/workspace-50-materials-singlepage-singlepagestartup-articles--articles-github-setup), затем открыть её в агенте. [Страница Code Framework](/?path=/story/workspace-50-materials-singlepage-singlepagestartup-website--website#website-landing) объясняет состав основы и условия использования.

## Основание темы

Основная формулировка — «создать интернет-магазин с помощью нейросетей». Её точная частотность отдельно не измерена. В [семантике продукта](/?path=/story/workspace-10-products-singlepage-singlepagestartup--semantics) есть близкие запросы: «создать интернет магазин нейросеть» — 21, «интернет магазин нейросеть» — 126. Эти числа не переносятся на новую формулировку.

Перерабатывается существующая статья. Основной ответ — запуск своего магазина с агентом, а не согласование наличия или доработка минимального заказа.

## Источники и границы

Фактура сверена с кодом текущей ветки и официальными инструкциями 01.11.2026:

| Что входит в материал | Проверенная основа                                                              | Что потребуется при записи и запуске                                                             |
| --------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Каталог и корзина     | Ecommerce Product/Store, связи товаров и заказов, серверный расчёт итогов       | Добавить свои товары, цены, фотографии и сведения о доставке                                     |
| Онлайн-оплата         | Billing и оформление заказа; реализованы CloudPayments и Stripe                 | Настроить аккаунт выбранного сервиса и проверить тестовую оплату с серверным подтверждением      |
| Telegram владельца    | Шаблон уведомления администратора, обработка статуса заказа и Telegram-доставка | Задать токен бота, связать Telegram-учётную запись администратора и проверить доставку сообщения |
| Запуск                | Node.js 24, npm 11, Bun, Docker; `npm install`, `./up.sh`, seed, API и Host     | Выполнить весь путь на новой копии при подготовке видео                                          |
| Агент с DeepSeek      | Официальная интеграция DeepSeek с OpenCode                                      | Подключить API-ключ и выбрать доступную модель; расход API оплачивается по использованию         |

Источники: [расчёт корзины](https://github.com/singlepagestartup/singlepagestartup/blob/codex/studio-linear-workflow/libs/modules/ecommerce/models/order/README.md), [оформление заказа](https://github.com/singlepagestartup/singlepagestartup/blob/codex/studio-linear-workflow/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts), [уведомления о статусе](https://github.com/singlepagestartup/singlepagestartup/blob/codex/studio-linear-workflow/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts), [доставка уведомлений](https://github.com/singlepagestartup/singlepagestartup/blob/codex/studio-linear-workflow/libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts), [установка SPS](https://github.com/singlepagestartup/singlepagestartup/blob/codex/studio-linear-workflow/GETTING_STARTED.md), [DeepSeek и OpenCode](https://api-docs.deepseek.com/quick_start/agent_integrations/opencode/), [тарификация DeepSeek API](https://api-docs.deepseek.com/quick_start/pricing/).

Автоматическая сверка остатков с ERP и готовое ограничение минимального заказа в этот сценарий не входят. Уведомление проверяется отдельно от оплаты: ошибка Telegram не отменяет уже оформленный заказ. Не обещаем защиту от любых взломов или обслуживание сайта без участия владельца.

Отдельный демо-проект и видеозапись пока не создаются. Здесь собрана фактура и подготовлена инструкция; успешная покупка в новом магазине не заявляется как выполненный клиентский кейс.

## Состав комплекта

SEO-задание, пошаговая статья и пост. Отдельное руководство объясняет GitHub. Для будущих видео подготовлена последовательность: аккаунт и копия проекта → агент и установка → запуск → каталог → тестовая оплата → уведомление в Telegram. Снятого видео и публичного демо пока нет.
