import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/website-builder/relations/features-to-buttons-arrays/backend/repository/database";
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
          module: "website-builder",
          name: "features-to-buttons-arrays",
          type: "relation",
          filters: [
            {
              column: "featureId",
              method: "eq",
              value: (data) => {
                const featureSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "feature" &&
                    seed.type === "model" &&
                    seed.module === "website-builder",
                );

                const featureEntity = featureSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.featureId,
                );

                return featureEntity?.new?.id || data.entity.dump.featureId;
              },
            },
            {
              column: "buttonsArrayId",
              method: "eq",
              value: (data) => {
                const buttonsArraySeed = data.seeds.find(
                  (seed) =>
                    seed.name === "buttons-array" &&
                    seed.type === "model" &&
                    seed.module === "website-builder",
                );

                const buttonsArrayEntity = buttonsArraySeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.buttonsArrayId,
                );

                return (
                  buttonsArrayEntity?.new?.id || data.entity.dump.buttonsArrayId
                );
              },
            },
          ],
          transformers: [
            {
              field: "featureId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "feature" &&
                      seed.type === "model" &&
                      seed.module === "website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.featureId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "buttonsArrayId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "buttons-array" &&
                      seed.type === "model" &&
                      seed.module === "website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.buttonsArrayId,
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
