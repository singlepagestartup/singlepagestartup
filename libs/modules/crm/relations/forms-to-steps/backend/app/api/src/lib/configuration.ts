import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/crm/relations/forms-to-steps/backend/repository/database";
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
          name: "forms-to-steps",
          type: "relation",
          filters: [
            {
              column: "formId",
              method: "eq",
              value: (data) => {
                const formSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "form" &&
                    seed.type === "model" &&
                    seed.module === "crm",
                );

                const formEntity = formSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.formId,
                );

                return formEntity?.new?.id || data.entity.dump.formId;
              },
            },
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
          ],
          transformers: [
            {
              field: "formId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "form" &&
                      seed.type === "model" &&
                      seed.module === "crm",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.formId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
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
          ],
        },
      },
    });
  }
}
