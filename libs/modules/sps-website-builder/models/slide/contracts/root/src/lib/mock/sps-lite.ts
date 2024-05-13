import { faker } from "@faker-js/faker";
import type { IModel } from "../interfaces/sps-lite";

export const entity = {
  id: 1,
  __component: "elements.slide",
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  showBackdrop: true,
  subtitle: null,
};
