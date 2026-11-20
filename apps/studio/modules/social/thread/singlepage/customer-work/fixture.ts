import type { IWorkResultVersion } from "./interface";

export const strategyVersions: readonly IWorkResultVersion[] = [
  {
    id: "strategy-v1",
    number: 1,
    title: "Продвижение мастерской",
    sections: [
      "Локальная аудитория",
      "Реклама в социальных сетях",
      "План публикаций на месяц",
    ],
    pages: 8,
  },
  {
    id: "strategy-v2",
    number: 2,
    title: "Продвижение мастерской и партнёрства",
    sections: [
      "Локальная аудитория",
      "Партнёрства с магазинами и студиями",
      "План на месяц и расходы по каналам",
    ],
    pages: 10,
  },
];
