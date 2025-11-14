import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
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
          name: "orders-to-billing-module-payment-intents",
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
              column: "billingModulePaymentIntentId",
              method: "eq",
              value: (data) => {
                const billingModulePaymentIntentSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "billing-module-payment-intent" &&
                    seed.type === "model" &&
                    seed.module === "billing",
                );

                const billingModulePaymentIntentEntity =
                  billingModulePaymentIntentSeed?.seeds.find(
                    (seed) =>
                      seed.dump.id ===
                      data.entity.dump.billingModulePaymentIntentId,
                  );

                return (
                  billingModulePaymentIntentEntity?.new?.id ||
                  data.entity.dump.billingModulePaymentIntentId
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
              field: "billingModulePaymentIntentId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "payment-intent" &&
                      seed.type === "model" &&
                      seed.module === "billing",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id ===
                      data.entity.dump.billingModulePaymentIntentId,
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
