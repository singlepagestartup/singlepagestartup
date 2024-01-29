import { faker } from "@faker-js/faker";
// import { entity as file } from "@sps/sps-file-storage-frontend/lib/redux/entities/file/mock/sps-lite";
import type { IComponent } from "../interfaces/sps-lite";

export const entity: IComponent = {
  id: 9,
  variant: "simple-centered",
  __component: "page-blocks.header-section-block",
  title: faker.lorem.sentence(),
  className: faker.lorem.slug(),
  subtitle: faker.lorem.sentence(),
  anchor: "header-section-anchor",
  description: faker.lorem.paragraph(),
  media: null,
  additionalMedia: null,
};
