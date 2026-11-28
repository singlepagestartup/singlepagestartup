import type { IFrameworkService } from "./interface";

export const services: IFrameworkService[] = [
  {
    slug: "framework-business-brief",
    title: {
      en: "Business brief",
      ru: "Бриф бизнеса",
    },
    summary: {
      en: "A brief with goals, facts, constraints and open questions",
      ru: "Бриф с целями, фактами, ограничениями и открытыми вопросами",
    },
    description: {
      en: "The account manager prepares a brief from your business notes and price list. Review the draft in chat, request edits, or accept it to download the PDF.",
      ru: "Аккаунт-менеджер подготовит бриф по описанию бизнеса, заметкам и прайсу. В чате можно прочитать черновик, запросить правки и скачать PDF после приёмки.",
    },
    price: {
      en: "SPS wallet tokens per model token · Input 0.012307692304 · Output 0.06153846152",
      ru: "Токены кошелька SPS за 1 токен модели · Вход 0,012307692304 · Выход 0,06153846152",
    },
  },
  {
    slug: "framework-offer-analysis",
    title: {
      en: "Offer analysis",
      ru: "Описание предложения",
    },
    summary: {
      en: "An offer specification with purchasing terms and unit economics",
      ru: "Карточка предложения с условиями покупки и расчётом экономики",
    },
    description: {
      en: "Business analyst.\n\nPrepare offer contents, prices and known costs. You can request changes before accepting the version.",
      ru: "Бизнес-аналитик.\n\nПодготовьте материалы: состав предложения, цены и известные затраты. До принятия версии можно запросить правки.",
    },
    price: "1 900 ₽",
  },
  {
    slug: "framework-competitor-study",
    title: {
      en: "Competitor study",
      ru: "Исследование конкурентов",
    },
    summary: {
      en: "An attributed comparison of competing offers",
      ru: "Сравнение предложений с источниками и выводами",
    },
    description: {
      en: "Market researcher.\n\nPrepare audience, region and links to comparable offers. You can request changes before accepting the version.",
      ru: "Исследователь рынка.\n\nПодготовьте материалы: аудитория, регион и ссылки на сопоставимые предложения. До принятия версии можно запросить правки.",
    },
    price: "2 900 ₽",
  },
  {
    slug: "framework-search-demand",
    title: {
      en: "Search demand",
      ru: "Поисковый спрос",
    },
    summary: {
      en: "Keyword clusters with target pages and priorities",
      ru: "Группы запросов с целевыми страницами и приоритетом",
    },
    description: {
      en: "Search analyst.\n\nPrepare offer, region and a keyword report. You can request changes before accepting the version.",
      ru: "Исследователь спроса.\n\nПодготовьте материалы: предложение, регион и выгрузка запросов. До принятия версии можно запросить правки.",
    },
    price: "2 900 ₽",
  },
  {
    slug: "framework-promotion-strategy",
    title: {
      en: "Promotion strategy",
      ru: "Стратегия продвижения",
    },
    summary: {
      en: "A one-month promotion plan with a priority channel and success measures",
      ru: "План продвижения на месяц с приоритетным каналом и критериями результата",
    },
    description: {
      en: "Marketing strategist.\n\nPrepare business brief, audience, budget and constraints. You can request changes before accepting the version.",
      ru: "Маркетинговый стратег.\n\nПодготовьте материалы: бриф бизнеса, аудитория, бюджет и ограничения. До принятия версии можно запросить правки.",
    },
    price: "4 900 ₽",
  },
  {
    slug: "framework-brand-voice",
    title: {
      en: "Brand and messaging",
      ru: "Бренд и коммуникация",
    },
    summary: {
      en: "Messaging hierarchy, brand voice and examples",
      ru: "Иерархия сообщений, голос бренда и примеры",
    },
    description: {
      en: "Communications strategist.\n\nPrepare strategy and substantiated customer promises. You can request changes before accepting the version.",
      ru: "Стратег по коммуникации.\n\nПодготовьте материалы: стратегия и подтверждённые обещания покупателям. До принятия версии можно запросить правки.",
    },
    price: "3 900 ₽",
  },
  {
    slug: "framework-visual-identity",
    title: {
      en: "Visual direction",
      ru: "Визуальное направление",
    },
    summary: {
      en: "A visual direction board with a concrete application",
      ru: "Лист визуального направления с примером применения",
    },
    description: {
      en: "Brand designer.\n\nPrepare brief, brand guidelines and cleared references. You can request changes before accepting the version.",
      ru: "Бренд-дизайнер.\n\nПодготовьте материалы: бриф, бренд и разрешённые референсы. До принятия версии можно запросить правки.",
    },
    price: "3 900 ₽",
  },
  {
    slug: "framework-campaign-creative",
    title: {
      en: "Campaign creative",
      ru: "Рекламный креатив",
    },
    summary: {
      en: "A finished image for the selected advertising channel",
      ru: "Готовое изображение для выбранного рекламного канала",
    },
    description: {
      en: "Campaign designer.\n\nPrepare offer, audience, format and channel requirements. You can request changes before accepting the version.",
      ru: "Дизайнер рекламы.\n\nПодготовьте материалы: предложение, аудитория, формат и требования канала. До принятия версии можно запросить правки.",
    },
    price: "2 900 ₽",
  },
];
