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
  hosting: IWebsiteSection;
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
    title: "Начните свой цифровой продукт с понятной задачи.",
    paragraphs: [
      "Code Framework · Бесплатный код",
      "Опишите свой бизнес в AI Chat. Получите основу технического задания, затем доработайте нужные функции Code Framework с ИИ-агентом: страницы, заявки, каталог и оплату.",
      "Исходный код бесплатный по лицензии MIT. Вы владеете своим проектом и выбираете сервер для размещения.",
    ],
    items: [],
    links: [
      {
        text: frameworkActions.primary.label,
        href: frameworkActions.primary.href,
      },
      {
        text: frameworkActions.secondary.label,
        href: frameworkActions.secondary.href,
      },
    ],
    quote: "",
  },
  foundation: {
    title: "Покажите продукт, примите заявку или заказ.",
    paragraphs: [
      "Что есть в коде",
      "Возьмите функции, которые подходят вашему приложению. Например, сохраните готовую корзину и добавьте условие минимального заказа. Вместе с кодом вы получите документацию и инструкции для ИИ-агента.",
    ],
    items: [
      {
        title: "Страницы и статьи",
        text: "Опишите услугу, публикуйте статьи по вопросам покупателей и связывайте материалы с товарами. Страницы имеют адреса и SEO-метаданные.",
      },
      {
        title: "Заявки и заказы",
        text: "Собирайте обращения через формы. Для магазина используйте каталог, корзину, заказы и подключение Stripe или CloudPayments.",
      },
      {
        title: "Личный кабинет и доступ",
        text: "Дайте клиенту учётную запись и нужные права: например, доступ к закрытым материалам или действиям партнёра.",
      },
      {
        title: "Доработка с ИИ-агентом",
        text: "Документация и инструкции объясняют агенту структуру кода. Он меняет нужные модули под правила вашего бизнеса.",
      },
    ],
    links: [
      {
        text: "Изучить документацию репозитория",
        href: "https://github.com/singlepagestartup/singlepagestartup#readme",
      },
    ],
    quote: "",
  },
  journey: {
    title: "Сначала задача бизнеса. Затем — нужный код.",
    paragraphs: ["Как начать"],
    items: [
      {
        title: "Опишите свой продукт",
        text: "Передайте AI Chat заметки об услуге, клиентах и условиях. Уточните, какой результат вам нужен: контент или техническое задание.",
      },
      {
        title: "Соберите техническое задание",
        text: "Определите действия клиента и правила бизнеса. Например: заявка на услугу, заказ товаров или доступ к материалам.",
      },
      {
        title: "Доработайте готовые функции",
        text: "Для разработки откройте Code Framework с ИИ-агентом. Используйте существующие модули и добавьте правила своего продукта.",
      },
    ],
    links: [],
    quote: "",
  },
  request: {
    title: "С чего начать разговор в AI Chat",
    paragraphs: [],
    items: [],
    links: [],
    quote:
      "У меня мастерская керамики. Продаю кружки и тарелки наборами от шести изделий. Помоги описать продукт, его покупателей и сценарий заказа. На этой основе подготовим техническое задание для сайта.",
  },
  change: {
    title: "Опишите нужное изменение.",
    paragraphs: [
      "Пример запроса",
      "Проверьте заказ из пяти и из шести единиц. Убедитесь, что покупатель видит причину ограничения и может изменить количество. Затем переходите к следующей доработке.",
    ],
    items: [],
    links: [],
    quote:
      "В моём магазине минимальный заказ — шесть единиц. Добавь это правило, сохранив существующие аккаунт и корзину. Покажи, как изменится оформление заказа.",
  },
  hosting: {
    title: "Разместите проект на выбранном сервере.",
    paragraphs: [
      "Публикация сайта",
      "В репозитории есть сценарии развёртывания Docker и настройки HTTPS через Traefik. ИИ-агент помогает настроить окружение и запустить проект; сервер, домен и реквизиты внешних сервисов нужны отдельно.",
      "Планируется размещение через партнёрских провайдеров: выбрать сервер и развернуть проект одной кнопкой. Сейчас используется самостоятельное развёртывание; партнёрские тарифы пока не установлены.",
    ],
    items: [],
    links: [],
    quote: "",
  },
  price: {
    title: "Бесплатно",
    paragraphs: [
      "Цена фреймворка",
      "Исходный код, документация и инструкции для агента — по лицензии MIT.",
      "ИИ-агент, сервер и выбранные внешние сервисы оплачиваются отдельно. По вопросам кода можно обратиться через GitHub; помощь предоставляется по возможности.",
    ],
    items: [],
    links: [],
    quote: "",
  },
  questions: {
    title: "Перед началом",
    paragraphs: [],
    items: [
      {
        title: "Нужно ли писать код самому?",
        text: "Опишите задачу Claude Code или Codex Desktop. Агент меняет код; вы принимаете решения и проверяете получившийся интерфейс.",
      },
      {
        title: "Что я получу после разговора в AI Chat?",
        text: "Описание бизнеса и продукта, которое можно уточнять и использовать для статей, рекламы и технического задания. Разработка на Code Framework — следующий шаг, когда задача определена.",
      },
      {
        title: "Подойдёт ли для уже работающего бизнеса?",
        text: "Да. Например, можно представить услуги и принимать заявки, а позже добавить оплату или личный кабинет. Перенос существующих данных и подключение сервисов — отдельные задачи внутри вашего проекта.",
      },
      {
        title: "Можно ли получить помощь?",
        text: "Задавайте вопросы и предлагайте улучшения через GitHub. Помощь и обслуживание предоставляются по возможности.",
      },
    ],
    links: [],
    quote: "",
  },
  footer: {
    title: "SinglePageStartup · Code Framework",
    paragraphs: [
      "Код, документация и инструкции для приложений на вашем сервере.",
    ],
    items: [],
    links: [
      {
        text: "Документация",
        href: "https://github.com/singlepagestartup/singlepagestartup#readme",
      },
      {
        text: "Лицензия исходного кода",
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
    "navigation-foundation": "Готовые модули",
    "navigation-local": "Как начать",
    "skip-link": "Перейти к содержанию",
    "copy-action": "Скопировать запрос",
    "copy-pending": "Копирование…",
    "copy-success":
      "Запрос скопирован. Вставьте его в AI Chat и замените пример сведениями о своём продукте.",
    "copy-error": "Выделите запрос выше и скопируйте вручную.",
    "copy-idle": "Измените запрос под свой проект.",
    "github-hint": "Откроется GitHub в новой вкладке",
    "footer-build": "Разработка",
    "footer-prepare": "Ваш проект",
    "footer-learn": "Материалы",
    "navigation-framework": "Фреймворк",
    "navigation-blog": "Блог",
    "navigation-tokens": "Токены",
    "navigation-label": "Основная навигация",
    "navigation-start": frameworkActions.primary.label,
    "navigation-chat": "AI Chat",
    "navigation-code": "Получить код",
    "navigation-start-mobile": frameworkActions.primary.label,
    "navigation-menu": "Открыть меню",
    "navigation-mobile-label": "Мобильная навигация",
    "external-link-hint": "Откроется в новой вкладке",
  },
};
