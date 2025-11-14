import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/backend/repository/database";
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
          module: "rbac",
          name: "subjects-to-billing-module-payment-intents",
          type: "relation",
          filters: [
            {
              column: "subjectId",
              method: "eq",
              value: (data) => {
                const subjectSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "subject" &&
                    seed.type === "model" &&
                    seed.module === "rbac",
                );

                const subjectEntity = subjectSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.subjectId,
                );

                return subjectEntity?.new?.id || data.entity.dump.subjectId;
              },
            },
            {
              column: "billingModulePaymentIntentId",
              method: "eq",
              value: (data) => {
                const paymentIntentSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "payment-intent" &&
                    seed.type === "model" &&
                    seed.module === "billing",
                );

                const paymentIntentEntity = paymentIntentSeed?.seeds.find(
                  (seed) =>
                    seed.dump.id ===
                    data.entity.dump.billingModulePaymentIntentId,
                );

                return (
                  paymentIntentEntity?.new?.id ||
                  data.entity.dump.billingModulePaymentIntentId
                );
              },
            },
          ],
          transformers: [
            {
              field: "subjectId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "subject" &&
                      seed.type === "model" &&
                      seed.module === "rbac",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.subjectId,
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
