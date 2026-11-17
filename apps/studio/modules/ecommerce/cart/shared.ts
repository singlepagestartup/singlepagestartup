export interface CartItem {
  id: string;
  slug: string;
  title: string;
  priceLabel: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
}

export const technicalConsultingCartItem: CartItem = {
  id: "srv-consulting",
  slug: "consulting",
  title: "Technical Consulting",
  priceLabel: "$250/hr",
  price: 250,
  image:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  quantity: 1,
};

export const websiteDevelopmentCartItem: CartItem = {
  id: "srv-web",
  slug: "website-development",
  title: "Website Development",
  priceLabel: "from $4,999",
  price: 4999,
  image:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
  quantity: 1,
};

export const defaultCartItems = [
  technicalConsultingCartItem,
] satisfies CartItem[];

export function formatCartMoney(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export function getCartTotals(items: CartItem[]): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discount = Math.round(subtotal * 0.1);

  return {
    itemCount,
    subtotal,
    discount,
    total: subtotal - discount,
  };
}

export type CartPurchaseScenario =
  | "wardrobe-city"
  | "wardrobe-region"
  | "two-one-assembly"
  | "two-both-assembly"
  | "split-orders"
  | "seller-comparison"
  | "service-unavailable"
  | "tariff-changed"
  | "sold-out"
  | "stock-shortage"
  | "currency-unavailable"
  | "mixed-currencies"
  | "distance-tariff"
  | "tokens-only"
  | "electronic-delivery"
  | "subscription"
  | "incomplete-selection"
  | "required-delivery"
  | "quote-error";

export interface CartPurchaseQuote {
  product: number;
  delivery: number;
  assembly: number;
  total: number;
}

export interface CartPurchaseLine {
  id: string;
  title: string;
  kind: "wardrobe" | "distance" | "chair" | "tokens" | "electronic" | "coffee";
  seller: "a" | "b";
  currency: "RUB" | "USD";
  quantity: 1 | 2;
  assemblyQuantity: 0 | 1 | 2;
  destination: "city" | "region" | "missing";
  fulfillment: "delivery" | "pickup" | "electronic" | "none";
  maxQuantity?: number;
  error?: "stock" | "currency" | "quote";
  requiredDelivery?: boolean;
  recurringDelivery?: boolean;
  quote: CartPurchaseQuote;
}

// These are published example responses for Studio, not a production calculator.
// Key: seller / quantity / destination / units requiring assembly.
export const wardrobePurchaseQuotes: Record<string, CartPurchaseQuote> = {
  "a/1/city/0": { product: 5000, delivery: 1000, assembly: 0, total: 6000 },
  "a/1/city/1": { product: 5000, delivery: 1000, assembly: 2000, total: 8000 },
  "a/1/region/0": { product: 5000, delivery: 2000, assembly: 0, total: 7000 },
  "a/1/region/1": {
    product: 5000,
    delivery: 2000,
    assembly: 2000,
    total: 9000,
  },
  "a/2/city/0": { product: 10000, delivery: 1000, assembly: 0, total: 11000 },
  "a/2/city/1": {
    product: 10000,
    delivery: 1000,
    assembly: 2000,
    total: 13000,
  },
  "a/2/city/2": {
    product: 10000,
    delivery: 1000,
    assembly: 4000,
    total: 15000,
  },
  "a/2/region/0": { product: 10000, delivery: 2000, assembly: 0, total: 12000 },
  "a/2/region/1": {
    product: 10000,
    delivery: 2000,
    assembly: 2000,
    total: 14000,
  },
  "a/2/region/2": {
    product: 10000,
    delivery: 2000,
    assembly: 4000,
    total: 16000,
  },
  "b/1/city/0": { product: 5400, delivery: 500, assembly: 0, total: 5900 },
  "b/1/city/1": { product: 5400, delivery: 500, assembly: 1500, total: 7400 },
  "b/1/region/0": { product: 5400, delivery: 1000, assembly: 0, total: 6400 },
  "b/1/region/1": {
    product: 5400,
    delivery: 1000,
    assembly: 1500,
    total: 7900,
  },
  "b/2/city/0": { product: 10800, delivery: 500, assembly: 0, total: 11300 },
  "b/2/city/1": { product: 10800, delivery: 500, assembly: 1500, total: 12800 },
  "b/2/city/2": { product: 10800, delivery: 500, assembly: 3000, total: 14300 },
  "b/2/region/0": { product: 10800, delivery: 1000, assembly: 0, total: 11800 },
  "b/2/region/1": {
    product: 10800,
    delivery: 1000,
    assembly: 1500,
    total: 13300,
  },
  "b/2/region/2": {
    product: 10800,
    delivery: 1000,
    assembly: 3000,
    total: 14800,
  },
};

export const wardrobePurchaseLine: CartPurchaseLine = {
  id: "order-a",
  title: "Шкаф «Линия», дуб, 120 см",
  kind: "wardrobe",
  seller: "a",
  currency: "RUB",
  quantity: 1,
  assemblyQuantity: 1,
  destination: "city",
  fulfillment: "delivery",
  quote: wardrobePurchaseQuotes["a/1/city/1"],
};

const secondWardrobePurchaseLine: CartPurchaseLine = {
  ...wardrobePurchaseLine,
  id: "order-b",
  destination: "region",
  assemblyQuantity: 0,
  quote: wardrobePurchaseQuotes["a/1/region/0"],
};

const tokensPurchaseLine: CartPurchaseLine = {
  ...wardrobePurchaseLine,
  id: "order-c",
  title: "100 000 токенов",
  kind: "tokens",
  currency: "USD",
  assemblyQuantity: 0,
  fulfillment: "none",
  quote: { product: 20, delivery: 0, assembly: 0, total: 20 },
};

export const cartPurchaseScenarios: Record<
  CartPurchaseScenario,
  { description: string; lines: CartPurchaseLine[] }
> = {
  "wardrobe-city": {
    description: "Шкаф, доставка в Петербург и сборка одной единицы.",
    lines: [wardrobePurchaseLine],
  },
  "wardrobe-region": {
    description: "Доставка в область меняет стоимость только этого заказа.",
    lines: [
      {
        ...wardrobePurchaseLine,
        destination: "region",
        quote: wardrobePurchaseQuotes["a/1/region/1"],
      },
    ],
  },
  "two-one-assembly": {
    description: "Два шкафа, одна доставка и сборка одного шкафа.",
    lines: [
      {
        ...wardrobePurchaseLine,
        quantity: 2,
        quote: wardrobePurchaseQuotes["a/2/city/1"],
      },
    ],
  },
  "two-both-assembly": {
    description: "Два шкафа, одна доставка и сборка обоих шкафов.",
    lines: [
      {
        ...wardrobePurchaseLine,
        quantity: 2,
        assemblyQuantity: 2,
        quote: wardrobePurchaseQuotes["a/2/city/2"],
      },
    ],
  },
  "split-orders": {
    description: "У каждого шкафа свой адрес, услуги и итог.",
    lines: [wardrobePurchaseLine, secondWardrobePurchaseLine],
  },
  "seller-comparison": {
    description: "Смена магазина в первом заказе сохраняет выбор второго.",
    lines: [wardrobePurchaseLine, secondWardrobePurchaseLine],
  },
  "service-unavailable": {
    description:
      "У другого магазина нет сборки. Отказ от услуги требует подтверждения.",
    lines: [wardrobePurchaseLine, secondWardrobePurchaseLine],
  },
  "tariff-changed": {
    description:
      "Новый тариф между сравнением и сохранением требует повторного подтверждения.",
    lines: [wardrobePurchaseLine, secondWardrobePurchaseLine],
  },
  "sold-out": {
    description: "Шкаф распродан. Выбор сохранён, доступен другой магазин.",
    lines: [{ ...wardrobePurchaseLine, maxQuantity: 0, error: "stock" }],
  },
  "stock-shortage": {
    description:
      "Из двух выбранных шкафов доступен один. Количество можно исправить.",
    lines: [
      {
        ...wardrobePurchaseLine,
        quantity: 2,
        maxQuantity: 1,
        error: "stock",
        quote: wardrobePurchaseQuotes["a/2/city/1"],
      },
    ],
  },
  "currency-unavailable": {
    description:
      "Для шкафа с доставкой и сборкой доступен только рублёвый расчёт.",
    lines: [{ ...wardrobePurchaseLine, currency: "USD", error: "currency" }],
  },
  "mixed-currencies": {
    description:
      "Шкаф и стул образуют рублёвый счёт, токены — отдельный долларовый.",
    lines: [
      wardrobePurchaseLine,
      {
        ...secondWardrobePurchaseLine,
        title: "Стул «Линия», дуб",
        kind: "chair",
        fulfillment: "pickup",
        quote: { product: 3000, delivery: 0, assembly: 0, total: 3000 },
      },
      tokensPurchaseLine,
    ],
  },
  "distance-tariff": {
    description: "Маршрут 24 км, доставка 1 000 ₽ и сборка 10% от товара.",
    lines: [
      {
        ...wardrobePurchaseLine,
        kind: "distance",
        quote: { product: 5000, delivery: 1000, assembly: 500, total: 6500 },
      },
    ],
  },
  "tokens-only": {
    description: "Цифровой товар сразу поступает на баланс аккаунта.",
    lines: [tokensPurchaseLine],
  },
  "electronic-delivery": {
    description:
      "Платная электронная выдача цифрового товара без почтового адреса.",
    lines: [
      {
        ...tokensPurchaseLine,
        title: "Цифровой комплект с электронной выдачей",
        kind: "electronic",
        fulfillment: "electronic",
        quote: { product: 20, delivery: 2, assembly: 0, total: 22 },
      },
    ],
  },
  subscription: {
    description:
      "Кофе каждые четыре недели. Упаковка только в первой поставке.",
    lines: [
      {
        ...wardrobePurchaseLine,
        title: "Кофе, 1 кг · каждые 4 недели",
        kind: "coffee",
        assemblyQuantity: 0,
        recurringDelivery: true,
        quote: { product: 2000, delivery: 300, assembly: 100, total: 2400 },
      },
    ],
  },
  "incomplete-selection": {
    description: "Для расчёта доставки нужен адрес этого заказа.",
    lines: [{ ...wardrobePurchaseLine, destination: "missing" }],
  },
  "required-delivery": {
    description: "Для этого предложения обязательна доставка продавцом.",
    lines: [{ ...wardrobePurchaseLine, requiredDelivery: true }],
  },
  "quote-error": {
    description:
      "Ошибка расчёта относится к первому заказу. Выбор второго сохранён.",
    lines: [
      { ...wardrobePurchaseLine, error: "quote" },
      secondWardrobePurchaseLine,
    ],
  },
};

export function formatPurchaseMoney(value: number, currency: "RUB" | "USD") {
  return currency === "RUB"
    ? `${value.toLocaleString("ru-RU")} ₽`
    : `${value.toLocaleString("en-US")} USD`;
}
