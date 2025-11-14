import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/subjects-to-sessions/backend/repository/database";
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
          module: "rbac",
          name: "subjects-to-sessions",
          type: "relation",
          filters: [
            {
              column: "subjectId",
              method: "eq",
              value: (data) => {
                const subjectSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "subject" &&
                    seed.type === "model" &&
                    seed.module === "rbac",
                );

                const subjectEntity = subjectSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.subjectId,
                );

                return subjectEntity?.new?.id || data.entity.dump.subjectId;
              },
            },
            {
              column: "sessionId",
              method: "eq",
              value: (data) => {
                const sessionSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "session" &&
                    seed.type === "model" &&
                    seed.module === "rbac",
                );

                const sessionEntity = sessionSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.sessionId,
                );

                return sessionEntity?.new?.id || data.entity.dump.sessionId;
              },
            },
          ],
          transformers: [
            {
              field: "subjectId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "subject" &&
                      seed.type === "model" &&
                      seed.module === "rbac",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.subjectId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "sessionId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "session" &&
                      seed.type === "model" &&
                      seed.module === "rbac",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.sessionId,
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
