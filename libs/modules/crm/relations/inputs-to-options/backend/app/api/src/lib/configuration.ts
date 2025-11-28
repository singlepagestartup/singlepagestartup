import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/crm/relations/inputs-to-options/backend/repository/database";
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
          module: "crm",
          name: "inputs-to-options",
          type: "relation",
          filters: [
            {
              column: "inputId",
              method: "eq",
              value: (data) => {
                const inputSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "input" &&
                    seed.type === "model" &&
                    seed.module === "crm",
                );

                const inputEntity = inputSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.inputId,
                );

                return inputEntity?.new?.id || data.entity.dump.inputId;
              },
            },
            {
              column: "optionId",
              method: "eq",
              value: (data) => {
                const optionSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "option" &&
                    seed.type === "model" &&
                    seed.module === "crm",
                );

                const optionEntity = optionSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.optionId,
                );

                return optionEntity?.new?.id || data.entity.dump.optionId;
              },
            },
          ],
          transformers: [
            {
              field: "inputId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "input" &&
                      seed.type === "model" &&
                      seed.module === "crm",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.inputId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "optionId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "option" &&
                      seed.type === "model" &&
                      seed.module === "crm",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.optionId,
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
