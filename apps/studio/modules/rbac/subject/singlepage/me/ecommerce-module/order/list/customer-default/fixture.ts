import type { IOrder } from "./interface";
export const orders: IOrder[] = [
  {
    id: "43db82a7",
    date: "26 ноября 2026 г.",
    status: "Ожидает оплаты",
    lines: [
      { id: "strategy", title: "Маркетинговая стратегия", quantity: 1 },
      { id: "review", title: "Разбор кампании", quantity: 2 },
    ],
  },
  {
    id: "a6df304c",
    date: "19 ноября 2026 г.",
    status: "Оплачен",
    lines: [{ id: "audit", title: "Аудит сайта", quantity: 1 }],
  },
];
