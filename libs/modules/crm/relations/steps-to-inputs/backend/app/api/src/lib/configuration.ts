import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/crm/relations/steps-to-inputs/backend/repository/database";
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
          name: "steps-to-inputs",
          type: "relation",
          filters: [
            {
              column: "stepId",
              method: "eq",
              value: (data) => {
                const stepSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "step" &&
                    seed.type === "model" &&
                    seed.module === "crm",
                );

                const stepEntity = stepSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.stepId,
                );

                return stepEntity?.new?.id || data.entity.dump.stepId;
              },
            },
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
          ],
          transformers: [
            {
              field: "stepId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "step" &&
                      seed.type === "model" &&
                      seed.module === "crm",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.stepId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
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
          ],
        },
      },
    });
  }
}
