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
