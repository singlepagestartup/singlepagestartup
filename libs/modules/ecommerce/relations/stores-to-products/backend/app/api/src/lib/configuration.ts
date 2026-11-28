import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
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
          name: "stores-to-products",
          type: "relation",
          filters: [
            {
              column: "sku",
              method: "eq",
              value: (data) => data.entity.dump.sku,
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
            {
              field: "settings",
              transform: (data) => {
                const { settings } = data.entity
                  .dump as typeof Table.$inferSelect;
                const pricing = settings?.workTokenPricing;
                if (!pricing) {
                  return undefined;
                }
                const currency = data.seeds
                  .find(
                    (seed) =>
                      seed.module === "billing" &&
                      seed.type === "model" &&
                      seed.name === "currency",
                  )
                  ?.seeds.find(({ dump }) => dump.id === pricing.currencyId);
                if (currency) {
                  return {
                    ...settings,
                    workTokenPricing: {
                      ...pricing,
                      currencyId: currency.new.id,
                    },
                  };
                }
                return undefined;
              },
            },
          ],
        },
      },
    });
  }
}
