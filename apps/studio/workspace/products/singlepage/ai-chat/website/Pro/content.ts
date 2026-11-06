export type ProCurrency = "USD" | "RUB";

export interface IProPageSection {
  title: string;
  paragraphs: string[];
}

export interface IProPageContent {
  hero: IProPageSection;
  plan: IProPageSection & {
    prices: Record<ProCurrency, number>;
    monthlyTokens: number;
  };
  includes: IProPageSection;
  terms: IProPageSection;
  preview: IProPageSection;
  review: IProPageSection;
  labels: Record<string, string>;
}

export const pageContent = {
  hero: {
    title: "Тариф Pro на месяц",
    paragraphs: [
      "Продолжайте работу над бизнес-моделью, идеей продукта и документами проекта с ежемесячным пакетом токенов.",
    ],
  },
  plan: {
    title: "Pro",
    paragraphs: ["Ежемесячная оплата"],
    prices: {
      USD: 29,
      RUB: 1900,
    },
    monthlyTokens: 5000,
  },
  includes: {
    title: "Что входит в тариф",
    paragraphs: [
      "Каждый месяц — пакет внутренних токенов для работы в AI Chat.",
      "Используйте подготовленные документы в работе с ИИ-помощником по разработке на бесплатном Code Framework с лицензией MIT.",
      "Баланс можно пополнять отдельно от ежемесячного тарифа.",
    ],
  },
  terms: {
    title: "Расход токенов",
    paragraphs: [
      "AI Chat учитывает работу ИИ по стоимости провайдера. Внутренние токены служат единицей баланса аккаунта и отличаются от входных и выходных токенов модели. При ошибке или отмене запроса все списанные за него токены возвращаются.",
    ],
  },
  preview: {
    title: "Предварительный просмотр тарифа",
    paragraphs: [
      "Выбор валюты и просмотр тарифа не создают заказ, не списывают деньги и не подключают подписку.",
    ],
  },
  review: {
    title: "Выбранный тариф на месяц",
    paragraphs: [
      "Здесь показаны выбранный тариф, количество токенов и валюта. Можно изменить валюту или вернуться к тарифам и пополнению.",
    ],
  },
  labels: {
    back: "К тарифам и токенам",
    "back-href": "/ecommerce",
    currency: "Валюта оплаты",
    usd: "Доллары США",
    rub: "Российские рубли",
    "per-month": "в месяц",
    allowance: "Ежемесячный пакет",
    "tokens-per-month": "внутренних токенов в месяц",
    plan: "Тариф",
    price: "Стоимость за месяц",
    period: "Период оплаты",
    month: "Месяц",
    preview: "Посмотреть тариф",
    "review-state": "Тариф Pro выбран. Проверьте условия.",
    chat: "Вернуться в AI Chat",
    "chat-href": "/",
    topups: "Пополнение и условия использования токенов",
    "topups-href": "/ai-chat/rbac/subjects/tokens",
  },
};

export function proCurrencyFromHref(href?: string): ProCurrency {
  if (!href) return "USD";
  try {
    return new URL(href, "https://studio.invalid").searchParams.get(
      "currency",
    ) === "RUB"
      ? "RUB"
      : "USD";
  } catch {
    return "USD";
  }
}
