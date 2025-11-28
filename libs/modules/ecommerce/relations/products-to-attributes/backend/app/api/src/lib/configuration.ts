import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/products-to-attributes/backend/repository/database";
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
          active: true,
          type: "json",
          directory: dataDirectory,
        },
        seed: {
          active: true,
          module: "ecommerce",
          name: "products-to-attributes",
          type: "relation",
          filters: [
            {
              column: "productId",
              method: "eq",
              value: (data) => {
                const productSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "product" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const productEntity = productSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.productId,
                );

                return productEntity?.new?.id || data.entity.dump.productId;
              },
            },
            {
              column: "attributeId",
              method: "eq",
              value: (data) => {
                const attributeSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "attribute" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const attributeEntity = attributeSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.attributeId,
                );

                return attributeEntity?.new?.id || data.entity.dump.attributeId;
              },
            },
          ],
          transformers: [
            {
              field: "productId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "product" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.productId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "attributeId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "attribute" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.attributeId,
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
