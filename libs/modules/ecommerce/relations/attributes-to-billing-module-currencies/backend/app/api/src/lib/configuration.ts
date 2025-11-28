import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/repository/database";
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
          module: "ecommerce",
          name: "attributes-to-billing-module-currencies",
          type: "relation",
          filters: [
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
            {
              column: "billingModuleCurrencyId",
              method: "eq",
              value: (data) => {
                const currencySeed = data.seeds.find(
                  (seed) =>
                    seed.name === "currency" &&
                    seed.type === "model" &&
                    seed.module === "billing",
                );

                const currencyEntity = currencySeed?.seeds.find(
                  (seed) =>
                    seed.dump.id === data.entity.dump.billingModuleCurrencyId,
                );

                return (
                  currencyEntity?.new?.id ||
                  data.entity.dump.billingModuleCurrencyId
                );
              },
            },
          ],
          transformers: [
            {
              field: "attributeId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "attribute" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.attributeId,
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
