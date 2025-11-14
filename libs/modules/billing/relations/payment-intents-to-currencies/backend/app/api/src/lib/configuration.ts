import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/billing/relations/payment-intents-to-currencies/backend/repository/database";
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
          module: "billing",
          name: "payment-intents-to-currencies",
          type: "relation",
          filters: [
            {
              column: "paymentIntentId",
              method: "eq",
              value: (data) => {
                const paymentIntentSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "payment-intent" &&
                    seed.type === "model" &&
                    seed.module === "billing",
                );

                const paymentIntentEntity = paymentIntentSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.paymentIntentId,
                );

                return (
                  paymentIntentEntity?.new?.id ||
                  data.entity.dump.paymentIntentId
                );
              },
            },
            {
              column: "currencyId",
              method: "eq",
              value: (data) => {
                const currencySeed = data.seeds.find(
                  (seed) =>
                    seed.name === "currency" &&
                    seed.type === "model" &&
                    seed.module === "billing",
                );

                const currencyEntity = currencySeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.currencyId,
                );

                return currencyEntity?.new?.id || data.entity.dump.currencyId;
              },
            },
          ],
          transformers: [
            {
              field: "paymentIntentId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "payment-intent" &&
                      seed.type === "model" &&
                      seed.module === "billing",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.paymentIntentId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "currencyId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "currency" &&
                      seed.type === "model" &&
                      seed.module === "billing",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.currencyId,
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
