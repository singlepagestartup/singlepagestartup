import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/subjects-to-identities/backend/repository/database";
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
          name: "subjects-to-identities",
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
              column: "identityId",
              method: "eq",
              value: (data) => {
                const identitySeed = data.seeds.find(
                  (seed) =>
                    seed.name === "identity" &&
                    seed.type === "model" &&
                    seed.module === "rbac",
                );

                const identityEntity = identitySeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.identityId,
                );

                return identityEntity?.new?.id || data.entity.dump.identityId;
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
              field: "identityId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "identity" &&
                      seed.type === "model" &&
                      seed.module === "rbac",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.identityId,
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
