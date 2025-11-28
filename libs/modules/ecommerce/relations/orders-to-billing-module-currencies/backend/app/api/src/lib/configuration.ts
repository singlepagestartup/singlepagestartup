import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/repository/database";
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
          name: "orders-to-billing-module-currencies",
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
              column: "billingModuleCurrencyId",
              method: "eq",
              value: (data) => {
                const billingModuleCurrencySeed = data.seeds.find(
                  (seed) =>
                    seed.name === "billing-module-currency" &&
                    seed.type === "model" &&
                    seed.module === "billing",
                );

                const billingModuleCurrencyEntity =
                  billingModuleCurrencySeed?.seeds.find(
                    (seed) =>
                      seed.dump.id === data.entity.dump.billingModuleCurrencyId,
                  );

                return (
                  billingModuleCurrencyEntity?.new?.id ||
                  data.entity.dump.billingModuleCurrencyId
                );
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
