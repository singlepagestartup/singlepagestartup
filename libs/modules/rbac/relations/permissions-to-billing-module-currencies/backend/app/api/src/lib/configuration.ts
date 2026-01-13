import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/repository/database";
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
          module: "rbac",
          name: "permissions-to-billing-module-currencies",
          type: "relation",
          filters: [
            {
              column: "premissionId",
              method: "eq",
              value: (data) => {
                const subjectSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "premission" &&
                    seed.type === "model" &&
                    seed.module === "rbac",
                );

                const entity = subjectSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.premissionId,
                );

                return entity?.new?.id || data.entity.dump.premissionId;
              },
            },
            {
              column: "billingModuleCurrencyId",
              method: "eq",
              value: (data) => {
                const orderSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "currency" &&
                    seed.type === "model" &&
                    seed.module === "billing",
                );

                const billingModuleCurrencyEntity = orderSeed?.seeds.find(
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
              field: "billingModuleCurrencyId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "currency" &&
                      seed.type === "model" &&
                      seed.module === "billing",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id === data.entity.dump.billingModuleCurrencyId,
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
