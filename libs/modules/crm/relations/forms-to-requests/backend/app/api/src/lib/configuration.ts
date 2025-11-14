import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/crm/relations/forms-to-requests/backend/repository/database";
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
          active: false,
          type: "json",
          directory: dataDirectory,
        },
        seed: {
          active: false,
          module: "crm",
          name: "forms-to-requests",
          type: "relation",
          filters: [
            {
              column: "requestId",
              method: "eq",
              value: (data) => {
                const requestSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "request" &&
                    seed.type === "model" &&
                    seed.module === "crm",
                );

                const requestEntity = requestSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.requestId,
                );

                return requestEntity?.new?.id || data.entity.dump.requestId;
              },
            },
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
          ],
          transformers: [
            {
              field: "requestId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "request" &&
                      seed.type === "model" &&
                      seed.module === "crm",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.requestId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
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
          ],
        },
      },
    });
  }
}
