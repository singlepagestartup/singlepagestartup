import { frameworkActions } from "../journey";
interface IWebsiteAsset {
  id: string;
  src: string;
  alt: string;
}

interface ILandingArtwork {
  hero: IWebsiteAsset;
  modules: IWebsiteAsset[];
  articles: Record<string, IWebsiteAsset>;
}

export interface IWebsiteItem {
  title: string;
  text: string;
}

interface IWebsiteLink {
  text: string;
  href: string;
}

interface IWebsiteSection {
  title: string;
  paragraphs: string[];
  items: IWebsiteItem[];
  links: IWebsiteLink[];
  quote: string;
}

export interface ICodeFrameworkWebsiteContent {
  hero: IWebsiteSection;
  foundation: IWebsiteSection;
  journey: IWebsiteSection;
  request: IWebsiteSection;
  modules: IWebsiteSection;
  articles: IWebsiteSection;
  handoff: IWebsiteSection;
  price: IWebsiteSection;
  questions: IWebsiteSection;
  footer: IWebsiteSection;
  labels: Record<string, string>;
}

const generated = "/workspace-assets/singlepage/generated/living-focus";

const acquisition =
  "/workspace-assets/singlepage/generated/framework-acquisition-v2";

/** Product-only artwork; the existing Modules/runtime asset choices are untouched. */
export const landingArtwork: ILandingArtwork = {
  hero: {
    id: "singlepage-generated-framework-acquisition-v2-hero",
    src: `${acquisition}/hero.png`,
    alt: "Сайт, собранный из готовых функций личного кабинета, магазина и статей.",
  },
  modules: [
    "accounts",
    "social",
    "blog",
    "knowledge",
    "ecommerce",
    "billing",
    "pages",
    "forms",
  ].map((key) => ({
    id:
      key === "knowledge"
        ? "singlepage-generated-framework-webinar-v1-knowledge-ai"
        : `singlepage-generated-framework-acquisition-v2-${key}`,
    src:
      key === "knowledge"
        ? "/workspace-assets/singlepage/generated/framework-webinar-v1/knowledge-ai.png"
        : `${acquisition}/${key}.png`,
    alt: "",
  })),
  articles: Object.fromEntries(
    ["social", "billing", "knowledge"].map((key) => [
      key,
      {
        id: `singlepage-generated-framework-article-covers-dark-v1-${key}`,
        src: `/workspace-assets/singlepage/generated/framework-article-covers-dark-v1/${key}.png`,
        alt: "",
      },
    ]),
  ),
};

/** Asset choices only. Page copy is owned by the website source. */
export const websiteAssets: Record<
  "logo" | "photograph" | "modules" | "agents",
  IWebsiteAsset
> = {
  logo: {
    id: "singlepage-generated-living-focus-primary-lockup",
    src: `${generated}/singlepagestartup-primary-lockup.svg`,
    alt: "SinglePageStartup",
  },
  photograph: {
    id: "singlepage-generated-living-focus-photography-business-conversation-square",
    src: `${generated}/singlepagestartup-photography-business-conversation-square.png`,
    alt: "Редакционная фотография: два человека обмениваются идеей за рабочим столом.",
  },
  modules: {
    id: "singlepage-generated-living-focus-illustration-module-hierarchy-cool-square",
    src: `${generated}/singlepagestartup-illustration-module-hierarchy-cool-square.png`,
    alt: "Концептуальная схема: готовые модули соединены с общей программной основой.",
  },
  agents: {
    id: "singlepage-generated-living-focus-illustration-coordinated-agents-cool-square",
    src: `${generated}/singlepagestartup-illustration-coordinated-agents-cool-square.png`,
    alt: "Концептуальная схема: человек направляет агентов программирования к общей задаче.",
  },
};

/** Reuse the registered acquisition masters in the Product module catalogue. */
export const moduleArtwork: Record<string, IWebsiteAsset> = {
  host: landingArtwork.hero,
  "website-builder": landingArtwork.modules[6],
  blog: landingArtwork.modules[2],
  social: landingArtwork.modules[1],
  crm: landingArtwork.modules[7],
  rbac: landingArtwork.modules[0],
  ecommerce: landingArtwork.modules[4],
  billing: landingArtwork.modules[5],
  knowledge: landingArtwork.modules[3],
  agent: websiteAssets.agents,
  startup: websiteAssets.modules,
};

export const websiteContent: ICodeFrameworkWebsiteContent = {
  hero: {
    title: "SinglePageStartup Code Framework",
    paragraphs: [
      "Фреймворк с открытым исходным кодом",
      "Соберите сайт, магазин или веб-сервис на готовых модулях. Используйте аккаунты, чат, каталог, заказы и оплату в одном проекте и меняйте их под свои задачи.",
    ],
    items: [],
    links: [
      {
        text: "Услуги ИИ-агентов",
        href: "/framework/services",
      },
    ],
    quote: "",
  },
  foundation: {
    title: "Посмотрите, каким может быть ваш продукт",
    paragraphs: [
      "Найдите сценарий для своей идеи",
      "SinglePageStartup — фреймворк с модульной и расширяемой кодовой базой, проверенный на десятках проектов. Начните с функций, которые нужны вашему бизнесу, и подключайте новые по мере развития проекта.",
    ],
    items: [
      {
        title: "Сбор контактов",
        text: "Посетитель знакомится с темами и ведущим бесплатного вебинара и записывается на участие. Школа получает контакты для следующего шага.",
      },
      {
        title: "Сообщество вайб-кодеров",
        text: "Участники показывают свои проекты, находят авторов и обсуждают решения в чате.",
      },
      {
        title: "Магазин курсов",
        text: "Покупатель выбирает курс, добавляет его в корзину и оформляет заказ. После подтверждения открывается учебный материал.",
      },
      {
        title: "Блог об ИИ",
        text: "Читатель находит статью по теме, сохраняет её и знакомится с автором. Дополнительные материалы доступны по подписке.",
      },
    ],
    links: [
      {
        text: "Посмотреть готовые возможности",
        href: "/framework/modules",
      },
    ],
    quote: "",
  },
  journey: {
    title: "Три шага до запуска вашего проекта",
    paragraphs: ["От описания идеи до ссылки для клиентов"],
    items: [
      {
        title: "Опишите задачу",
        text: "Сформулируйте, что продукт помогает сделать клиенту. Если нужны бриф или стратегия, выберите услугу ИИ-агента.",
      },
      {
        title: "Выберите модули",
        text: "Подберите готовые функции для основной задачи. Используйте справочник модулей, чтобы понять, какие данные и связи уже есть.",
      },
      {
        title: "Запустите и проверьте",
        text: "Возьмите код на GitHub, запустите проект локально по README и проверьте сценарий клиента перед развёртыванием.",
      },
    ],
    links: [],
    quote: "",
  },
  request: {
    title: "Хотите работать с кодом самостоятельно?",
    paragraphs: [],
    items: [],
    links: [],
    quote:
      "На основе приложенных и проверенных документов о бизнесе и продукте составь план первой версии моего продукта на SinglePageStartup Code Framework. Помоги запустить проект на моём компьютере. Используй подходящие готовые функции, убери ненужные и адаптируй остальные под мои требования. Отдельно укажи нерешённые вопросы и покажи, что мне нужно проверить.",
  },
  modules: {
    title: "15 модулей уже готовы к подключению",
    paragraphs: [
      "Используйте проверенный код",
      "Модули добавляют в проект функции: аккаунты, чат, каталог товаров, оплату и другие. Выберите нужные для своего бизнеса. Команда SinglePageStartup поддерживает эти модули и выпускает обновления.",
    ],
    items: [
      {
        title: "Аккаунты и доступ",
        text: "Вход в аккаунт и доступ к личным данным.",
      },
      {
        title: "Профили и общение",
        text: "Профили участников и пространство для общения.",
      },
      {
        title: "Статьи и категории",
        text: "Публикуйте материалы и помогайте читателям их находить.",
      },
      {
        title: "База знаний",
        text: "Дайте ИИ доступ к документам, чтобы он находил нужное для ответа.",
      },
      {
        title: "Товары и заказы",
        text: "Показывайте, что продаёте, и работайте с заказами.",
      },
      {
        title: "Платежи и валюты",
        text: "Принимайте оплату в валютах ваших покупателей.",
      },
      {
        title: "Конструктор сайтов",
        text: "Собирайте страницы под своё предложение.",
      },
      {
        title: "Формы и обработка заявок",
        text: "Собирайте заявки и организуйте работу с ними.",
      },
    ],
    links: [
      {
        text: "Все модули",
        href: "/framework/modules",
      },
    ],
    quote: "",
  },
  articles: {
    title: "Узнайте, как работает фреймворк",
    paragraphs: [
      "Выберите модули для своей задачи",
      "Для каждого модуля — отдельная статья о его работе, связях и применении.",
    ],
    items: [],
    links: [
      {
        text: "Social: профили и переписка",
        href: "/framework/modules/social",
      },
      {
        text: "Billing: платежи и валюты",
        href: "/framework/modules/billing",
      },
      {
        text: "Knowledge: документы и знания",
        href: "/framework/modules/knowledge",
      },
      {
        text: "Все модули",
        href: "/framework/modules",
      },
    ],
    quote: "",
  },
  handoff: {
    title: "Начните с кода фреймворка",
    paragraphs: [
      "Код и документация на GitHub",
      "Откройте репозиторий и запустите проект по README. В справочнике модулей перечислены готовые функции и примеры их использования.",
    ],
    items: [],
    links: [
      {
        text: "Все модули",
        href: "/framework/modules",
      },
      {
        text: "Посмотреть код",
        href: "https://github.com/singlepagestartup/singlepagestartup",
      },
    ],
    quote: "",
  },
  price: {
    title: "Развивайте свой продукт, используя open-source",
    paragraphs: [
      "Код остаётся у вас",
      "Ваш проект работает на фреймворке SinglePageStartup. Мы поддерживаем его модули, добавляем возможности и исправляем ошибки. Если для вашей задачи не хватает существующих функций, вы можете доработать модуль или создать свой с ИИ-помощником либо разработчиком. Доступ ко всему коду вашего проекта всегда остаётся у вас.",
    ],
    items: [],
    links: [],
    quote: "",
  },
  questions: {
    title: "Что ещё стоит знать.",
    paragraphs: [],
    items: [
      {
        title: "Нужны ли навыки программирования?",
        text: "Для запуска и развёртывания понадобятся инструменты разработки. README описывает требования и команды.",
      },
      {
        title: "Как дорабатывать код самостоятельно?",
        text: "Клонируйте репозиторий, запустите проект и меняйте нужные модули. Перед публикацией проверьте сценарий клиента.",
      },
      {
        title: "Как запустить первую версию?",
        text: "Откройте README, настройте окружение и подготовьте базу данных. После локальной проверки разверните проект на выбранном хостинге.",
      },
      {
        title: "Можно ли дорабатывать проект потом?",
        text: "Да. Подключайте готовые модули и расширяйте их по мере развития проекта.",
      },
      {
        title: "Что здесь бесплатно?",
        text: "Код фреймворка и документация доступны по лицензии MIT. Услуги, инструменты разработки и хостинг оплачиваются отдельно.",
      },
      {
        title: "Кто поддерживает фреймворк?",
        text: "SinglePageStartup поддерживает общую кодовую базу. Код, обсуждения ошибок и история изменений доступны на GitHub.",
      },
    ],
    links: [],
    quote: "",
  },
  footer: {
    title: "Ссылки",
    paragraphs: [
      "Помогаем создавать и развивать сайты, магазины и веб-сервисы на фреймворке с открытым исходным кодом.",
    ],
    items: [],
    links: [
      {
        text: "Фреймворк",
        href: "/framework",
      },
      {
        text: "Модули",
        href: "/framework/modules",
      },
      {
        text: "Блог",
        href: "/blog",
      },
      {
        text: "Статьи о фронтенде",
        href: "/blog/categories/frontend",
      },
      {
        text: "Статьи о бэкенде",
        href: "/blog/categories/backend",
      },
      {
        text: "Статьи о DevOps",
        href: "/blog/categories/devops",
      },
      {
        text: "Услуги ИИ-агентов",
        href: "/framework/services",
      },
      {
        text: "Токены",
        href: "/ecommerce",
      },
      {
        text: "Документация",
        href: "https://github.com/singlepagestartup/singlepagestartup#readme",
      },
      {
        text: "Лицензия",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/LICENSE",
      },
      {
        text: "Вопросы и помощь",
        href: "https://github.com/singlepagestartup/singlepagestartup/issues",
      },
    ],
    quote: "",
  },
  labels: {
    "navigation-framework": "Фреймворк",
    "footer-build": "Разработка",
    "footer-prepare": "Ваш проект",
    "footer-learn": "Материалы",
    "navigation-foundation": "Модули",
    "navigation-local": "Запустить на компьютере",
    "navigation-code": "Получить код",
    "navigation-included": "Посмотреть модули",
    "navigation-blog": "Блог",
    "navigation-tokens": "Токены",
    "navigation-sign-in": "Войти",
    "navigation-profile": "Мой профиль",
    "navigation-menu": "Открыть меню",
    "navigation-label": "Основная навигация",
    "navigation-mobile-label": "Мобильная навигация",
    "external-link-hint": "Откроется в новой вкладке",
    "skip-link": "Перейти к содержимому",
    "copy-action": "Скопировать запрос",
    "copy-pending": "Копируем…",
    "copy-success":
      "Запрос скопирован. Вставьте его в приложение для разработки.",
    "copy-error": "Выделите запрос выше и скопируйте вручную.",
    "copy-idle": "Отредактируйте запрос под свой проект.",
    "github-hint": "GitHub откроется в новой вкладке",
    "hero-image-alt":
      "Сайт, собранный из готовых функций: аккаунтов, магазина и статей.",
    "reading-time": "мин. чтения",
    "article-cover-1": "Обсуждение проекта за ноутбуком.",
    "article-cover-2": "Коллеги вместе работают над идеей.",
    "article-cover-3": "Команда готовит среду для разработки.",
    "demo-selector-label": "Примеры продуктов",
    "demo-preview-label": "Мобильный пример",
    "demo-local-note":
      "Данные остаются в этом примере и не отправляются на сервер.",
    "demo-academy": "Firstship",
    "demo-back": "Назад",
    "demo-course-one": "Запустите свой ИИ-сервис",
    "demo-course-one-description":
      "Соберите сервис на SinglePageStartup: от сценария пользователя до первой публикации.",
    "demo-course-one-lessons": "6 занятий · для начинающих",
    "demo-course-two": "ИИ-чат с платежами",
    "demo-course-two-description":
      "Добавьте аккаунты, оплату и учёт токенов в свой ИИ-сервис.",
    "demo-course-two-lessons": "8 занятий · с практикой",
    "demo-course-meta": "Бесплатный вебинар · онлайн",
    "demo-contact-title": "Ваш первый ИИ-продукт: с чего начать",
    "demo-contact-description":
      "Разберём путь от идеи до работающего сервиса на SinglePageStartup. Покажем, как поставить задачу ИИ, собрать нужные функции и подготовить проект к публикации.",
    "demo-program": "Что будет на курсе",
    "demo-program-idea":
      "Определите аудиторию и основной сценарий. Подготовьте бриф и список функций с ИИ-помощником.",
    "demo-program-build":
      "Соберите интерфейс, подключите аккаунты, чат и платежи на готовых модулях SPS.",
    "demo-program-launch":
      "Проверьте путь пользователя, настройте окружение и опубликуйте проект.",
    "demo-contact-form": "Записывайтесь на бесплатный вебинар",
    "demo-contact-submit": "Записаться бесплатно",
    "demo-contact-success": "Запись сохранена в примере",
    "demo-edit": "Изменить заявку",
    "demo-name-label": "Ваше имя",
    "demo-name-placeholder": "Как к вам обращаться",
    "demo-email-label": "Почта",
    "demo-email-placeholder": "you@example.com",
    "demo-format": "Как будете участвовать",
    "demo-format-self": "Посмотрю запись",
    "demo-format-mentor": "Приду на эфир",
    "demo-community-name": "Buildfolk",
    "demo-community-kicker": "Сообщество создателей",
    "demo-community-title": "Покажите, что вы собрали",
    "demo-community-description":
      "Сообщество вайб-кодеров: делимся проектами, разбираем решения и помогаем друг другу с запуском.",
    "demo-community-navigation": "Разделы сообщества",
    "demo-feed": "Лента",
    "demo-people": "Участники",
    "demo-chat": "Чат",
    "demo-member-one": "Анна Лебедева",
    "demo-member-two": "Марк Волков",
    "demo-member-1-role": "Создаёт ИИ-продукты",
    "demo-member-2-role": "Разрабатывает с агентами",
    "demo-member-1-bio":
      "Собираю сервисы для обучения на SPS. Делюсь прототипами и тем, чему учусь в процессе.",
    "demo-member-2-bio":
      "Создаю ИИ-помощников и проверяю идеи небольшими запусками. Здесь обсуждаю архитектуру и интерфейсы.",
    "demo-profile-project": "Проект участника",
    "demo-project-1": "Мой первый ИИ-репетитор",
    "demo-project-1-body":
      "Собрала чат, личный кабинет и оплату занятий на SPS. Сейчас проверяю первый сценарий урока.",
    "demo-project-2": "Помощник для создателей курсов",
    "demo-project-2-body":
      "Из программы обучения делает черновик структуры курса. Добавляю роли преподавателя и участника.",
    "demo-like": "Поддержать проект",
    "demo-join": "Вступить",
    "demo-join-title": "Присоединитесь к вайб-кодерам",
    "demo-join-action": "Войти в демо",
    "demo-share-project": "Показать свой проект",
    "demo-project-title-label": "Название проекта",
    "demo-project-description-label": "Что вы создаёте",
    "demo-publish": "Опубликовать в демо",
    "demo-open-chat": "Перейти в чат",
    "demo-chat-locked": "Чат для участников",
    "demo-chat-locked-body":
      "Представьтесь, чтобы обсуждать проекты и задавать вопросы.",
    "demo-chat-welcome":
      "Привет! Что вы сейчас собираете с ИИ? Покажите идею или задайте вопрос.",
    "demo-chat-history": "Сообщения сообщества",
    "demo-chat-input": "Ваше сообщение",
    "demo-send": "Отправить",
    "demo-courses-name": "Lessonloop",
    "demo-courses-title": "Научитесь запускать ИИ-продукты",
    "demo-courses-description":
      "Выберите курс и применяйте каждое занятие в своём проекте: чат, платежи и первая публикация.",
    "demo-catalog": "Все курсы",
    "demo-currency": "Валюта",
    "demo-cart": "Корзина",
    "demo-add-cart": "В корзину",
    "demo-in-cart": "В корзине · открыть",
    "demo-remove": "Удалить из корзины",
    "demo-total": "Итого",
    "demo-cart-empty": "В корзине пока нет курсов.",
    "demo-choose-course": "Выбрать курс",
    "demo-checkout": "Оформить заказ",
    "demo-access-email": "Почта для доступа к курсу",
    "demo-payment": "Способ оплаты",
    "demo-payment-card": "Банковская карта",
    "demo-payment-sbp": "СБП",
    "demo-payment-note":
      "Это демо-заказ. Деньги не списываются, платёжные данные не запрашиваются.",
    "demo-confirm-order": "Подтвердить демо-заказ",
    "demo-order-success": "Демо-заказ оформлен",
    "demo-open-course": "Открыть курс",
    "demo-course-access": "Онлайн · в своём темпе",
    "demo-lesson-title": "Начните с задачи пользователя",
    "demo-lesson-body":
      "Опишите, для кого вы создаёте продукт и какое действие человек должен выполнить. Затем выберите готовые модули SPS и сформулируйте задачу для приложения разработки.",
    "demo-journal-name": "Signalnote",
    "demo-journal-kicker": "Журнал о продуктах и ИИ",
    "demo-journal-title": "Как создавать продукты с ИИ",
    "demo-category-all": "Все",
    "demo-category-agents": "Агенты",
    "demo-category-practice": "Практика",
    "demo-categories": "Категории статей",
    "demo-search": "Найти статью",
    "demo-all-articles": "Все статьи",
    "demo-to-article": "К статье",
    "demo-saved": "Сохранённые",
    "demo-bookmark": "Сохранить статью",
    "demo-bookmarked": "Статья сохранена",
    "demo-show-all": "Показать все",
    "demo-no-articles":
      "Таких статей пока нет. Попробуйте другую категорию или запрос.",
    "demo-author-bio":
      "Пишу о создании ИИ-продуктов, работе с агентами и готовыми модулями SinglePageStartup.",
    "demo-author-articles": "Статьи автора",
    "demo-private-title": "Чек-лист для подписчиков",
    "demo-private-description":
      "Дополнительные шаги подготовки проекта к запуску доступны по подписке.",
    "demo-private-unlock": "Открыть демо-подписку",
    "demo-private-open": "Доступ открыт в демо",
    "demo-private-reset": "Показать без подписки",
    "demo-journal-1-title": "Как поставить задачу ИИ-агенту",
    "demo-journal-1-excerpt":
      "Начните с пользователя и результата, который ему нужен.",
    "demo-journal-1-body":
      "Опишите, кто будет пользоваться продуктом, что человек хочет сделать и по каким признакам вы проверите результат. Передайте агенту эти требования вместе с контекстом проекта. Просите показать изменения и проверяйте каждый сценарий, прежде чем двигаться дальше.",
    "demo-journal-2-title": "Что не нужно создавать заново",
    "demo-journal-2-excerpt":
      "Аккаунты, чат и оплата могут стать основой вашего проекта.",
    "demo-journal-2-body":
      "В SPS уже есть модули для аккаунтов, общения, контента, товаров и платежей. Выберите то, что нужно вашей идее, и изучите готовый сценарий. Затем добавьте свои правила и интерфейс. Сохраните работающие связи между модулями, когда меняете внешний вид.",
    "demo-journal-3-title": "Готов ли ваш ИИ-продукт к запуску",
    "demo-journal-3-excerpt":
      "Проверьте путь пользователя до первой полезной задачи.",
    "demo-journal-3-body":
      "Пройдите регистрацию как новый пользователь, выполните главную задачу и проверьте обработку ошибок. Для платного продукта отдельно проверьте заказ, отмену оплаты и выдачу доступа. Для ИИ-чата проверьте отображение баланса и поведение при нехватке токенов.",
    "demo-journal-3-private":
      "Проверьте доступ гостя и участника, повторную оплату и отмену, сохранение переписки и поведение после выхода из аккаунта. Убедитесь, что закрытый материал не приходит пользователю без доступа. Зафиксируйте результат проверки каждого сценария перед публикацией.",
    "demo-sign-out": "Выйти из демо",
    "module-article-action": "Как работает модуль",
    "module-articles-all": "Все модули",
    "repository-action": "GitHub",
    "journey-services": "Выбрать услугу",
    "demo-journal-feature": "Практика, которую можно повторить",
    "demo-webinar-topics": "Что разберём на вебинаре",
    "demo-topic-idea-title": "Идея и бриф",
    "demo-topic-idea-text": "Для кого продукт и какую задачу поручить ИИ.",
    "demo-topic-build-title": "Сборка продукта",
    "demo-topic-build-text":
      "Как связать аккаунт, чат и оплату на готовых модулях.",
    "demo-topic-launch-title": "Первый запуск",
    "demo-topic-launch-text":
      "Что проверить перед публикацией и как выложить проект.",
    "demo-mentor-heading": "Кто ведёт вебинар",
    "demo-mentor-name": "Алексей Миронов",
    "demo-mentor-role": "Full-stack разработчик · 10 лет практики",
    "demo-mentor-description":
      "Разрабатывает веб-сервисы и помогает командам запускать первые версии продуктов. На вебинаре покажет работу с ИИ-помощником на конкретном проекте.",
    "demo-mentor-alt":
      "Портрет вымышленного ведущего вебинара Алексея Миронова",
    "demo-mentor-note": "Вымышленный ведущий демонстрационного проекта.",
  },
};

export const productExamplePreviews = [
  {
    id: "contacts",
    name: "contact",
    height: 1908,
    alt: "Снимок страницы вебинара Firstship: темы, запись и ведущий.",
  },
  {
    id: "community",
    name: "community",
    height: 998,
    alt: "Снимок сообщества Buildfolk: профили участников, проекты и обсуждения.",
  },
  {
    id: "courses",
    name: "courses",
    height: 995,
    alt: "Снимок магазина Lessonloop: курсы и кнопки добавления в корзину.",
  },
  {
    id: "journal",
    name: "journal",
    height: 1572,
    alt: "Снимок блога Signalnote: статьи, авторы и материалы по подписке.",
  },
];
