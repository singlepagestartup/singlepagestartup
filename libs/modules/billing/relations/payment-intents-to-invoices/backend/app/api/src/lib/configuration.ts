import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/billing/relations/payment-intents-to-invoices/backend/repository/database";
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
          name: "payment-intents-to-invoices",
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
              column: "invoiceId",
              method: "eq",
              value: (data) => {
                const invoiceSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "invoiceId" &&
                    seed.type === "model" &&
                    seed.module === "billing",
                );

                const invoiceEntity = invoiceSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.invoiceId,
                );

                return invoiceEntity?.new?.id || data.entity.dump.invoiceId;
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
              field: "invoiceId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "invoiceId" &&
                      seed.type === "model" &&
                      seed.module === "billing",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.invoiceId,
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
