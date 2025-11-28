import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/repository/database";
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
          name: "attribute-keys-to-attributes",
          type: "relation",
          filters: [
            {
              column: "attributeKeyId",
              method: "eq",
              value: (data) => {
                const attributeKeySeed = data.seeds.find(
                  (seed) =>
                    seed.name === "attribute-key" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const attributeKeyEntity = attributeKeySeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.attributeKeyId,
                );

                return (
                  attributeKeyEntity?.new?.id || data.entity.dump.attributeKeyId
                );
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
              field: "attributeKeyId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "attribute-key" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.attributeKeyId,
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
