import { downloadOrderFixture } from "../../../../../../../../file-storage/file/singlepage/order-delivery/fixture";
import type { IOrder } from "./interface";
export const orders: IOrder[] = [
  {
    id: "43db82a7",
    date: "26 ноября 2026 г.",
    status: "Ожидает оплаты",
    checkout: {
      email: "buyer@example.com",
      paymentMethod: "Тестовая оплата",
      total: "7 900 ₽",
    },
    lines: [
      {
        id: "strategy",
        productId: "strategy",
        slug: "marketing-strategy",
        coverUrl:
          "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
        title: "Маркетинговая стратегия",
        quantity: 1,
        priceLabel: "4 900 ₽",
      },
      {
        id: "review",
        productId: "review",
        slug: "campaign-review",
        title: "Разбор кампании",
        quantity: 2,
        priceLabel: "3 000 ₽",
      },
    ],
  },
  {
    id: "a6df304c",
    date: "19 ноября 2026 г.",
    status: "Оплачен",
    checkout: {
      email: "buyer@example.com",
      paymentMethod: "Банковская карта",
      paidAt: "19 ноября 2026 г.",
      comment: "Позвоните за час до доставки.",
      delivery: "Курьером, Москва, ул. Лесная, д. 10",
      total: "890 ₽",
      downloadReceipt: () =>
        downloadOrderFixture({
          id: "a6df304c",
          kind: "receipt",
          filename: "receipt-a6df304c.pdf",
        }),
    },
    lines: [
      {
        id: "planner",
        productId: "planner",
        title: "Ежедневник для планирования",
        quantity: 1,
      },
    ],
  },
];
