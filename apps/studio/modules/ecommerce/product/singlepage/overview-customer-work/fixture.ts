import type { IStoreOffer } from "./interface";

export const strategyOffer: IStoreOffer = {
  id: "offer-sever-strategy",
  store: "Мастерская «Север»",
  title: "Стратегия продвижения",
  description:
    "План продвижения для одного бренда. Согласуйте задачу в чате и проверьте рекомендации перед оплатой.",
  deliverables: [
    "Аудитория и предложение",
    "Каналы и план запуска на месяц",
    "PDF после оплаты выбранной версии",
  ],
  price: 4900,
  kind: "service",
};

export const physicalOffer: IStoreOffer = {
  id: "offer-sever-notebook",
  store: "Мастерская «Север»",
  title: "Блокнот для планирования",
  description:
    "Недатированный блокнот со страницами для задач, недельного плана и заметок.",
  deliverables: [
    "Формат A5",
    "96 страниц",
    "Доставка с номером для отслеживания",
  ],
  price: 890,
  kind: "physical",
};
