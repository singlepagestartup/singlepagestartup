import {
  securityNotificationTopicSlug,
  securityNotificationTemplateSlugs,
} from "@sps/shared-utils";
import type { ISetupRecommendation } from "./interface";

export const copy = {
  ru: {
    settings: "Настройки",
    introduction:
      "Обслуживание проекта и данные для подключения нужных функций после установки.",
    setup: "Настройка проекта",
    setupDescription:
      "Это инструкции, а не проверка текущей конфигурации. Откройте нужный раздел, проверьте существующие записи и создайте недостающие. Данные не добавляются автоматически.",
    recommendation: "Рекомендация",
    example: "Пример текста сводки",
    exampleDescription:
      "Скопируйте пример в поле «Текст уведомления» шаблона и отредактируйте под свой проект. Укажите свой Title — он станет темой письма. Для Telegram и email создаются отдельные шаблоны. Время в UTC.",
    copy: "Скопировать текст",
    copied: "Текст скопирован.",
    copyFailed:
      "Не удалось скопировать автоматически. Выделите текст и скопируйте вручную.",
    title: "Кэш страниц",
    description: "После сброса страницы обновятся при следующем открытии.",
    action: "Сбросить кэш страниц",
    pending: "Сбрасываем кэш…",
    success: "Кэш страниц сброшен.",
  },
  en: {
    settings: "Settings",
    introduction:
      "Project maintenance and records needed to enable features after installation.",
    setup: "Project setup",
    setupDescription:
      "These are setup instructions, not a configuration check. Open a section, review existing records and create any that are missing. No data is added automatically.",
    recommendation: "Recommended setup",
    example: "Example summary content",
    exampleDescription:
      "Copy this example into the template's Notification content field and adapt it to your project. Set Title to the email subject you want. Create separate templates for Telegram and email. Times use UTC.",
    copy: "Copy content",
    copied: "Content copied.",
    copyFailed:
      "Could not copy automatically. Select the content and copy it manually.",
    title: "Page cache",
    description: "Pages will refresh the next time they are opened.",
    action: "Invalidate page cache",
    pending: "Invalidating cache…",
    success: "Page cache invalidated.",
  },
};

export const securityTemplateExample = {
  ru: `Сводка безопасности: {{project}}
Период: {{start}} — {{end}}
Неверный пароль: {{counts.password-failed}}
Ограничения подбора пароля: {{counts.password-limited}}
Ограничения аутентификации: {{counts.auth-limited}}
Неверный служебный ключ: {{counts.operator-mismatch}}
Ограничения служебного ключа: {{counts.operator-limited}}
Ограничения API: {{counts.api-limited}}
Успешные входы после ошибок: {{counts.password-recovered}}
Событие: {{incidentId}}
Лимиты применены автоматически. Подробности смотрите в серверных логах.`,
  en: `Security summary: {{project}}
Period: {{start}} — {{end}}
Wrong passwords: {{counts.password-failed}}
Password limits: {{counts.password-limited}}
Authentication limits: {{counts.auth-limited}}
Wrong operator keys: {{counts.operator-mismatch}}
Operator key limits: {{counts.operator-limited}}
API limits: {{counts.api-limited}}
Successful logins after failures: {{counts.password-recovered}}
Incident: {{incidentId}}
Rate limits were applied automatically. See server logs for details.`,
};

export const recommendations: Record<"ru" | "en", ISetupRecommendation[]> = {
  ru: [
    {
      id: "security",
      title: "Сводки безопасности",
      description:
        "Сообщают администраторам о превышениях лимитов и накопленных ошибках входа. Текст и канал доставки задаются шаблонами Notification.",
      steps: [
        `В Topic создайте запись со Slug «${securityNotificationTopicSlug}». Title можно выбрать свой.`,
        `В Template создайте Slug «${securityNotificationTemplateSlugs.telegram}», Variant «content-telegram» и/или Slug «${securityNotificationTemplateSlugs.email}», Variant «content-email». Заполните Title и текст. Достаточно одного канала.`,
        "Настройте контакты администраторов и задачу rbac-module-subjects-check из карточек ниже. Telegram-бот или почтовый провайдер должны быть настроены на сервере.",
        "По умолчанию сводка охватывает 15 минут. После успешной отправки повтора нет; при ошибках — не более трёх попыток на получателя за период, включая резервный канал. Удаление шаблона отключает этот канал. Без Topic или подходящих шаблонов сводки не отправляются; ограничения API и логи продолжают работать.",
      ],
      links: [
        { label: "Темы", path: "notification/topic" },
        { label: "Шаблоны", path: "notification/template" },
      ],
    },
    {
      id: "contacts",
      title: "Получатели уведомлений",
      description:
        "Сводки безопасности и уведомления администратору используют пользователей с ролью admin и связанные с ними Identity.",
      steps: [
        "У нужного Subject проверьте связь с Role, у которой Slug равен admin. Эта роль также даёт административные права — не назначайте её только ради рассылки.",
        "Свяжите Subject с его Identity: Email для писем или Provider «telegram» и Account с числовым ID чата для Telegram. Проверьте, что контакт принадлежит получателю.",
        "Для сводок Telegram используется первым, email — при его недоступности, если оба шаблона и провайдера настроены. Ключи провайдеров остаются в окружении сервера.",
      ],
      links: [
        { label: "Пользователи", path: "rbac/subject" },
        { label: "Контакты", path: "rbac/identity" },
      ],
    },
    {
      id: "crm",
      title: "Уведомления о заявках",
      description:
        "Нужны, если проект принимает заявки через формы CRM. Настройте до публикации формы, чтобы администратор получал новые обращения.",
      steps: [
        "В Topic создайте Slug «information», если такой записи ещё нет.",
        "Создайте Template с Variant «generate-email-crm-form-request-created-admin» и/или «generate-telegram-crm-form-request-created-admin». Slug и Title можно выбрать свои.",
        "Эти варианты используют компоненты проекта для оформления сообщения. Проверьте контакты администраторов, затем отправьте пробную заявку через свою форму.",
      ],
      links: [
        { label: "Темы", path: "notification/topic" },
        { label: "Шаблоны", path: "notification/template" },
        { label: "Формы CRM", path: "crm/form" },
      ],
    },
    {
      id: "orders",
      title: "Уведомления о заказах",
      description:
        "Подключите, если в проекте есть продажи. Шаблоны для покупателя и администратора выбираются отдельно.",
      steps: [
        "Используйте Topic со Slug «information». Общую тему не нужно создавать повторно.",
        "Для покупателя создайте Template с Variant «generate-email-ecommerce-order-status-changed-default» и/или «generate-telegram-ecommerce-order-status-changed-default».",
        "Для администратора есть Variant «generate-telegram-ecommerce-order-status-changed-admin». Это шаблоны на компонентах проекта. После настройки проверьте смену статуса тестового заказа.",
      ],
      links: [
        { label: "Темы", path: "notification/topic" },
        { label: "Шаблоны", path: "notification/template" },
        { label: "Заказы", path: "ecommerce/order" },
      ],
    },
    {
      id: "schedule",
      title: "Регулярные задачи",
      description:
        "Записи Agent задают, какие фоновые действия выполнять и с какой частотой. Выбирайте только те, которые нужны проекту.",
      steps: [
        "Для сводок безопасности и обработки заказов пользователей создайте Agent со Slug «rbac-module-subjects-check», Variant «default» и Interval «* * * * *» — раз в минуту.",
        "Для повторной отправки обычных уведомлений со статусом new: Slug «notification-module-topics-send-all». Для удаления устаревших сообщений Broadcast: «broadcast-module-messages-delete-expired». Укажите подходящий Interval в формате cron.",
        "Запись расписания сама не запускает сервер. Планировщик развёртывания должен регулярно вызывать /api/agent/agents/cron; при локальной установке это нужно настроить отдельно. Повторы сводок контролируются отдельно и не попадают в обычную рассылку.",
      ],
      links: [{ label: "Задачи Agent", path: "agent/agent" }],
    },
  ],
  en: [
    {
      id: "security",
      title: "Security summaries",
      description:
        "Notify administrators about rate limits and accumulated login failures. Notification templates control message content and delivery channels.",
      steps: [
        `Create a Topic with Slug “${securityNotificationTopicSlug}”. Choose your own Title.`,
        `Create a Template with Slug “${securityNotificationTemplateSlugs.telegram}” and Variant “content-telegram”, and/or Slug “${securityNotificationTemplateSlugs.email}” and Variant “content-email”. Fill in Title and content. One channel is sufficient.`,
        "Configure administrator contacts and the rbac-module-subjects-check task using the cards below. The Telegram bot or email provider must be configured on the server.",
        "The default summary period is 15 minutes. Successful deliveries are not repeated; failures get at most three attempts per recipient and period, including fallback. Removing a template disables that channel. No summaries are sent without the Topic or suitable templates; API limits and server logs remain active.",
      ],
      links: [
        { label: "Topics", path: "notification/topic" },
        { label: "Templates", path: "notification/template" },
      ],
    },
    {
      id: "contacts",
      title: "Notification recipients",
      description:
        "Security summaries and administrator notifications use Subjects with the admin role and their linked Identities.",
      steps: [
        "Check that the intended Subject is linked to the Role with Slug admin. This also grants administrative rights; do not assign it solely to subscribe someone to notifications.",
        "Link the Subject to their Identity: Email for email delivery, or Provider telegram and a numeric chat ID in Account for Telegram. Verify that the contact belongs to the recipient.",
        "Summaries try Telegram first and use email as fallback when both templates and providers are configured. Provider credentials stay in the server environment.",
      ],
      links: [
        { label: "Subjects", path: "rbac/subject" },
        { label: "Identities", path: "rbac/identity" },
      ],
    },
    {
      id: "crm",
      title: "Form submission notifications",
      description:
        "Configure these before publishing CRM forms so administrators can receive new submissions.",
      steps: [
        "Create a Topic with Slug information if it does not already exist.",
        "Create a Template with Variant generate-email-crm-form-request-created-admin and/or generate-telegram-crm-form-request-created-admin. Choose your own Slug and Title.",
        "These variants use project components to render content. Check administrator contacts, then submit a test request through your form.",
      ],
      links: [
        { label: "Topics", path: "notification/topic" },
        { label: "Templates", path: "notification/template" },
        { label: "CRM forms", path: "crm/form" },
      ],
    },
    {
      id: "orders",
      title: "Order notifications",
      description:
        "Enable these for projects that sell products. Customer and administrator templates are selected separately.",
      steps: [
        "Use the Topic with Slug information. Create it only if it is missing.",
        "For customers, create a Template with Variant generate-email-ecommerce-order-status-changed-default and/or generate-telegram-ecommerce-order-status-changed-default.",
        "For administrators, use Variant generate-telegram-ecommerce-order-status-changed-admin. These templates render through project components. Verify delivery with a test order status change.",
      ],
      links: [
        { label: "Topics", path: "notification/topic" },
        { label: "Templates", path: "notification/template" },
        { label: "Orders", path: "ecommerce/order" },
      ],
    },
    {
      id: "schedule",
      title: "Scheduled tasks",
      description:
        "Agent records define which background actions run and how often. Enable only the actions your project needs.",
      steps: [
        "For security summaries and Subject order processing, create an Agent with Slug rbac-module-subjects-check, Variant default and Interval * * * * * (every minute).",
        "To retry ordinary notifications with status new, use Slug notification-module-topics-send-all. To remove expired Broadcast messages, use broadcast-module-messages-delete-expired. Set a suitable cron Interval.",
        "A schedule record does not start the server. The deployment scheduler must call /api/agent/agents/cron regularly; configure this separately for a local installation. Summary retries are bounded independently and are excluded from ordinary delivery.",
      ],
      links: [{ label: "Agent tasks", path: "agent/agent" }],
    },
  ],
};
