import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/stores-to-orders/backend/repository/database";
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
          name: "stores-to-orders",
          type: "relation",
          filters: [
            {
              column: "storeId",
              method: "eq",
              value: (data) => {
                const storeSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "store" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const storeEntity = storeSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.storeId,
                );

                return storeEntity?.new?.id || data.entity.dump.storeId;
              },
            },
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
          ],
          transformers: [
            {
              field: "storeId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "store" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.storeId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
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
          ],
        },
      },
    });
  }
}
