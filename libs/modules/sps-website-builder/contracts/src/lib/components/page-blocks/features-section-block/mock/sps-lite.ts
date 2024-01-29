import { faker } from "@faker-js/faker";
import { entity as spsLiteBackendFeature } from "../../../elements/feature/mock/sps-lite";
// import { entity as file } from "@sps/sps-file-storage-frontend/lib/redux/entities/file/mock/sps-lite";
import type { IComponent } from "../interfaces/sps-lite";

export const entity: IComponent = {
  id: 32,
  title: faker.lorem.sentence(),
  variant: "with-icon",
  className: null,
  subtitle: faker.lorem.sentence(),
  anchor: faker.lorem.slug(),
  description: faker.lorem.paragraph(),
  __component: "page-blocks.features-section-block",
  features: Array(4).fill({ ...spsLiteBackendFeature }),
  media: null,
  additionalMedia: null,
};