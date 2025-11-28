import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/relations/threads-to-ecommerce-module-products/backend/repository/database";
import { injectable } from "inversify";

@injectable()
export class Configuration extends ParentConfiguration {
  constructor() {
    super({
      repository: {
        type: "database",
        Table: Table,
        insertSchema,
        selectSchema,
        dump: {
          active: false,
          type: "json",
          directory: dataDirectory,
        },
        seed: {
          active: false,
          module: "social",
          name: "threads-to-ecommerce-module-products",
          type: "relation",
          filters: [
            {
              column: "profileId",
              method: "eq",
              value: (data) => {
                const profileSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "profile" &&
                    seed.type === "model" &&
                    seed.module === "social",
                );

                const profileEntity = profileSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.profileId,
                );

                return profileEntity?.new?.id || data.entity.dump.profileId;
              },
            },
            {
              column: "ecommerceModuleProductId",
              method: "eq",
              value: (data) => {
                const productSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "product" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const productEntity = productSeed?.seeds.find(
                  (seed) =>
                    seed.dump.id === data.entity.dump.ecommerceModuleProductId,
                );

                return (
                  productEntity?.new?.id ||
                  data.entity.dump.ecommerceModuleProductId
                );
              },
            },
          ],
          transformers: [
            {
              field: "profileId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "profile" &&
                      seed.type === "model" &&
                      seed.module === "social",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.profileId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "ecommerceModuleProductId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "product" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id ===
                      data.entity.dump.ecommerceModuleProductId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
          ],
        },
      },
    });
  }
}
