import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/repository/database";
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
          active: false,
          module: "ecommerce",
          name: "stores-to-products-to-attributes",
          type: "relation",
          transformers: [
            {
              field: "storesToProductsId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "stores-to-products" &&
                      seed.type === "relation" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id === data.entity.dump.storesToProductsId,
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
