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
  change: IWebsiteSection;
  chat: IWebsiteSection;
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
    title: "Создайте свой продукт уже сегодня",
    paragraphs: [
      "Сайты и веб-сервисы за 1 день",
      "Опишите свою идею ИИ-помощнику. Он поможет выбрать функции, собрать страницы из готовых блоков и добавить ваши тексты и изображения. Опубликуйте проект прямо из чата и получите ссылку, которую можно отправить клиентам.",
    ],
    items: [],
    links: [
      {
        text: "Создать продукт",
        href: "/rbac/subject/authentication/email-and-password/registration",
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
        title: "Создайте аккаунт",
        text: "Зарегистрируйтесь и откройте чат с ИИ-помощником. Расскажите, что хотите предложить клиентам и как будет работать ваш бизнес.",
      },
      {
        title: "Спроектируйте проект с ИИ",
        text: "Вместе с ИИ-помощником выберите функции и страницы, подготовьте тексты и изображения. Помощник соберёт проект из готовых блоков, а вы сможете посмотреть его и сказать, что изменить.",
      },
      {
        title: "Опубликуйте проект",
        text: "Создайте аккаунт GitHub и подключите его к AI Chat. Сервис создаст репозиторий с кодом вашего проекта. Затем подключите аккаунт хостинг-провайдера и выберите сервер. Подтвердите развёртывание: проект будет опубликован из репозитория, а вы получите ссылку на него.",
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
  change: {
    title: "Продолжайте работу со знаниями проекта в новом чате",
    paragraphs: [
      "Сохранённые знания о проекте",
      "Откройте новый чат в том же проекте и опишите задачу. ИИ-помощник автоматически ищет нужные сведения в знаниях этого проекта. Например, использует условия курса, аудиторию и оформление школы при подготовке новой страницы.",
    ],
    items: [],
    links: [],
    quote:
      "Добавь на сайт запись на новый курс. Используй описание школы и её оформление.",
  },
  chat: {
    title: "Дополняйте знания о проекте и используйте их в работе",
    paragraphs: [
      "Ваш бизнес в цифровом виде",
      "Идея, описание бизнеса, сведения о клиентах, функции и оформление сохраняются в документах проекта. Возвращайтесь к ним, дополняйте и используйте в новых задачах. Вам не придётся каждый раз заново объяснять ИИ-помощнику, что вы создаёте.",
    ],
    items: [],
    links: [
      {
        text: "Создать продукт",
        href: "/rbac/subject/authentication/email-and-password/registration",
      },
      {
        text: "Тарифы и токены",
        href: "/ecommerce",
      },
    ],
    quote: "",
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
    title: "Запустите проект уже сегодня и начните проверять вашу гипотезу",
    paragraphs: [
      "Начните со своей идеи",
      "Опишите, что хотите предложить клиентам. Вместе с ИИ-помощником выберите функции, посмотрите проект и опубликуйте его через чат.",
    ],
    items: [],
    links: [
      {
        text: "Начать",
        href: "/rbac/subject/authentication/email-and-password/registration",
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
        title: "Нужно ли уметь программировать, чтобы начать?",
        text: "Для начала достаточно описать идею своими словами. ИИ-помощник поможет выбрать функции, подготовить страницы и опубликовать проект. Вы смотрите, как работает проект, и говорите, что изменить.",
      },
      {
        title: "Как дорабатывать код самостоятельно?",
        text: "Скачайте свой репозиторий и откройте его в Claude Code или Codex. Передайте ИИ-помощнику документы проекта, опишите изменения и проверьте результат перед публикацией.",
      },
      {
        title: "Как появится мой проект?",
        text: "ИИ-помощник соберёт страницы из готовых блоков и добавит ваши тексты и изображения. Сначала подключите GitHub: сервис создаст репозиторий и сохранит в нём код проекта. Затем подключите хостинг, выберите сервер и подтвердите развёртывание через GitHub Actions. После публикации вы получите адрес проекта.",
      },
      {
        title: "Можно ли дорабатывать проект потом?",
        text: "Да. Возвращайтесь в тот же чат, описывайте нужные изменения и дополняйте знания о проекте. Если потребуется особая функция, можно доработать код с ИИ-помощником или подключить разработчика.",
      },
      {
        title: "Что здесь бесплатно?",
        text: "Code Framework и документация доступны бесплатно по лицензии MIT. AI Chat, инструменты разработки и хостинг оплачиваются отдельно.",
      },
      {
        title: "Кто поддерживает фреймворк?",
        text: "SinglePageStartup поддерживает общую кодовую базу. Исходники, обсуждение ошибок и история изменений доступны на GitHub.",
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
        text: "AI Chat",
        href: "/",
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
    "navigation-chat": "AI Chat",
    "navigation-start": "Создать продукт",
    "navigation-start-mobile": "Создать продукт",
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
    "chat-reply":
      "Давайте разберёмся, для кого они и что смогут делать участники.",
    "document-one": "Бриф",
    "document-two": "Продукты",
    "document-three": "Стратегия",
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
    "document-four": "Бренд",
    "document-five": "Дизайн",
    "context-project": "Проект: школа создания ИИ-продуктов",
    "context-saved": "1. Сохранённые знания о проекте",
    "context-new": "2. Новая задача на основе этих знаний",
    "context-attachment": "Знания текущего проекта",
    "context-publish": "3. Обновите опубликованный проект",
    "context-publish-description":
      "Посмотрите новую страницу и попросите ИИ-помощника опубликовать изменения. Они появятся на вашем сайте. Продолжайте дорабатывать проект через тот же чат.",
    "module-article-action": "Как работает модуль",
    "module-articles-all": "Все модули",
    "repository-action": "GitHub",
    "journey-register": "Зарегистрироваться",
    "document-example": "Пример содержания",
    "document-one-description":
      "Исходные сведения о бизнесе: идея, цели, ресурсы и ограничения. Из них ИИ-помощник формирует основу для описания продуктов и стратегии.",
    "document-one-example":
      "Школа Firstship учит начинающих создавать цифровые продукты с ИИ. Первый курс проходит онлайн.",
    "document-two-description":
      "Для каждого продукта — описание, аудитория, конкуренты, семантика, экономика и продажи. Эти сведения определяют предложение, темы статей и путь клиента.",
    "document-two-example":
      "Курс «Первый ИИ-сервис»: для начинающих, шесть практических занятий. Следующее действие посетителя — заявка на открытый урок.",
    "document-three-description":
      "Общий план достижения целей бизнеса: на какую аудиторию опираться, какую роль играет каждый продукт и как привлекать клиентов. Стратегия использует сведения из брифа и исследования продуктов.",
    "document-three-example":
      "Открытый урок знакомит со школой. Статьи отвечают на вопросы начинающих и приводят на урок, после которого человек выбирает курс.",
    "document-four-description":
      "Общий характер бренда: как его должны воспринимать, каким голосом он говорит и как объясняет свою ценность. Эти правила применяются ко всем продуктам и материалам.",
    "document-four-example":
      "Firstship говорит спокойно и предметно: показывает результат практики, объясняет термины и разбирает конкретные действия.",
    "document-five-description":
      "Общий внешний вид: логотип, цвета, шрифты, изображения и компоненты интерфейса с примерами применения. Материалы всех продуктов используют эти правила.",
    "document-five-example":
      "Светлые рабочие страницы, тёмные акцентные блоки, лаймовые кнопки и фотографии людей за работой.",
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
    "document-six": "Материалы",
    "document-six-description":
      "Для каждого продукта — сайт, презентация, рекламные материалы и статьи. Они используют предложение продукта, его аудиторию, поисковые запросы и путь клиента, сохраняя общий бренд и дизайн.",
    "document-six-example":
      "Для курса: посадочная с заявкой на открытый урок, презентация программы, рекламный баннер и статьи по вопросам начинающих.",
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
