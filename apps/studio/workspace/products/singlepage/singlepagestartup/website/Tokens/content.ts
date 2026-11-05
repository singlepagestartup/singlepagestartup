export interface ITokenPageSection {
  title: string;
  paragraphs: string[];
}

export interface ITokenPackage {
  amount: number;
  rate: number;
}

export interface ITokenPageContent {
  hero: ITokenPageSection;
  allowance: ITokenPageSection;
  pro: ITokenPageSection & {
    prices: Record<"USD" | "RUB", number>;
    monthlyTokens: number;
  };
  topups: ITokenPageSection & { packages: ITokenPackage[] };
  handoff: ITokenPageSection;
  terms: ITokenPageSection;
  framework: ITokenPageSection;
  labels: Record<string, string>;
}

export const pageContent = {
  hero: {
    title: "Токены для работы над вашим проектом",
    paragraphs: [
      "Тарифы и токены AI Chat",
      "Обсуждайте бизнес-модель и идею продукта, готовьте документы в AI Chat. Используйте эти материалы при создании проекта на Code Framework.",
      "Code Framework доступен бесплатно по лицензии MIT. Тарифы и токены AI Chat оплачивают работу ИИ с материалами вашего проекта.",
    ],
  },
  allowance: {
    title: "Начните с 3 000 токенов",
    paragraphs: [
      "После регистрации аккаунт автоматически получает 3 000 внутренних токенов. Этот пакет выдаётся один раз.",
    ],
  },
  pro: {
    title: "Pro",
    paragraphs: [
      "Ежемесячный пакет для работы над бизнесом и документами проекта.",
      "Ежемесячная оплата",
      "Выберите валюту ежемесячной оплаты.",
    ],
    prices: {
      USD: 29,
      RUB: 1900,
    },
    monthlyTokens: 5000,
  },
  topups: {
    title: "Пополните баланс, когда понадобится",
    paragraphs: [
      "Выберите сумму разового пополнения. Во всех пакетах внутренний токен стоит 0,13 рубля. Скидки за размер пакета нет.",
      "Купленные токены не сгорают. Разовое пополнение учитывается отдельно от ежемесячного пакета Pro.",
    ],
    packages: [
      {
        amount: 100,
        rate: 0.13,
      },
      {
        amount: 300,
        rate: 0.13,
      },
      {
        amount: 500,
        rate: 0.13,
      },
      {
        amount: 1000,
        rate: 0.13,
      },
      {
        amount: 3000,
        rate: 0.13,
      },
    ],
  },
  handoff: {
    title: "Проверьте условия покупки в AI Chat",
    paragraphs: [
      "Кнопка тарифа Pro открывает его условия с выбранной валютой. Кнопка пополнения ведёт к выбору суммы в аккаунте AI Chat. Предварительный просмотр не создаёт заказ и не принимает оплату.",
    ],
  },
  terms: {
    title: "Как расходуется баланс",
    paragraphs: [
      "Работа ИИ учитывается по стоимости провайдера. Баланс измеряется внутренними токенами — они отличаются от входных и выходных токенов модели. При ошибке или отмене запроса все списанные за него токены возвращаются.",
      "Купленные токены не сгорают. Возврат денег рассматривается индивидуально. Перед оплатой прочитайте условия использования токенов и оплаты в AI Chat.",
    ],
  },
  framework: {
    title: "Используйте документы при создании проекта",
    paragraphs: [
      "Передайте описание бизнеса и требования к продукту ИИ-помощнику по разработке. Code Framework предоставляет модули приложения; правила работы вашего продукта можно доработать под свою задачу.",
    ],
  },
  labels: {
    register: "Создать аккаунт AI Chat",
    "register-href": "/ai-chat/rbac/subjects/authentication/registration",
    "pro-eyebrow": "Ежемесячный тариф",
    currency: "Валюта оплаты",
    "per-month": "в месяц",
    continue: "Продолжить в AI Chat",
    "pro-review": "Посмотреть тариф Pro",
    "pro-review-href": "/ai-chat/rbac/subjects/subscriptions/pro",
    "checkout-href": "/ai-chat/rbac/subjects/tokens",
    "package-label": "Выберите сумму пополнения",
    "amount-unit": "RUB",
    "token-unit": "внутренних токенов",
    estimate: "Примерное количество токенов",
    selected: "Выбранное пополнение",
    "one-off": "разовый платёж",
    "estimate-note":
      "Количество токенов округлено до ближайшего целого. Перед оплатой проверьте итоговое количество в AI Chat.",
    rate: "0,13 рубля за внутренний токен",
    terms: "Token and payment terms in AI Chat",
    "terms-href": "/ai-chat/rbac/subjects/tokens",
    framework: "Посмотреть Code Framework",
    "framework-href": "/framework",
    chat: "Открыть AI Chat",
    "chat-href": "/",
  },
};

export function tokenCredit({ amount, rate }: ITokenPackage): number {
  return Math.round(amount / rate);
}
