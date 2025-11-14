import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
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
          module: "ecommerce",
          name: "orders-to-products",
          type: "relation",
          filters: [
            {
              column: "orderId",
              method: "eq",
              value: (data) => {
                const orderSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "order" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const orderEntity = orderSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.orderId,
                );

                return orderEntity?.new?.id || data.entity.dump.orderId;
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
          ],
          transformers: [
            {
              field: "orderId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "order" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.orderId,
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
