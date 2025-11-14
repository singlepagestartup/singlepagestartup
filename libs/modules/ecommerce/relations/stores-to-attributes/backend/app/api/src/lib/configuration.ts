import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/stores-to-attributes/backend/repository/database";
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
          name: "stores-to-attributes",
          type: "relation",
          filters: [
            {
              column: "storeId",
              method: "eq",
              value: (data) => {
                const storeSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "store" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const storeEntity = storeSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.storeId,
                );

                return storeEntity?.new?.id || data.entity.dump.storeId;
              },
            },
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
          ],
        },
      },
    });
  }
}
