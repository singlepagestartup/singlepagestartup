import type { IWorkResultFile } from "./interface";

export const strategyFiles: readonly IWorkResultFile[] = [
  {
    id: "strategy-file",
    filename: "strategy.pdf",
    title: "Продвижение мастерской",
    sections: [
      "Локальная аудитория",
      "Реклама в социальных сетях",
      "План публикаций на месяц",
    ],
    pages: 8,
  },
  {
    id: "partnerships-file",
    filename: "strategy-partnerships.pdf",
    title: "Продвижение мастерской и партнёрства",
    sections: [
      "Локальная аудитория",
      "Партнёрства с магазинами и студиями",
      "План на месяц и расходы по каналам",
    ],
    pages: 10,
  },
];
