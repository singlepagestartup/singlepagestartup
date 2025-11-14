import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/repository/database";
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
          active: false,
          module: "ecommerce",
          name: "stores-to-products-to-attributes",
          type: "relation",
          filters: [
            {
              column: "storesToProductsId",
              method: "eq",
              value: (data) => {
                const storesToProductsSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "stores-to-products" &&
                    seed.type === "relation" &&
                    seed.module === "ecommerce",
                );

                const storesToProductsEntity = storesToProductsSeed?.seeds.find(
                  (seed) =>
                    seed.dump.id === data.entity.dump.storesToProductsId,
                );

                return (
                  storesToProductsEntity?.new?.id ||
                  data.entity.dump.storesToProductsId
                );
              },
            },
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
              field: "storesToProductsId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "stores-to-products" &&
                      seed.type === "relation" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id === data.entity.dump.storesToProductsId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
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
          ],
        },
      },
    });
  }
}
