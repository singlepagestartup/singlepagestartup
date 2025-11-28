import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/website-builder/relations/buttons-arrays-to-buttons/backend/repository/database";
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
          name: "buttons-arrays-to-buttons",
          type: "relation",
          filters: [
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
            {
              column: "buttonId",
              method: "eq",
              value: (data) => {
                const buttonSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "button" &&
                    seed.type === "model" &&
                    seed.module === "website-builder",
                );

                const buttonEntity = buttonSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.buttonId,
                );

                return buttonEntity?.new?.id || data.entity.dump.buttonId;
              },
            },
          ],
          transformers: [
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
            {
              field: "buttonId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "button" &&
                      seed.type === "model" &&
                      seed.module === "website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.buttonId,
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
