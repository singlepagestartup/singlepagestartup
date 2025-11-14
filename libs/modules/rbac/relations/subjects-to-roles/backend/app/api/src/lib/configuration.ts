import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/subjects-to-roles/backend/repository/database";
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
          name: "subjects-to-roles",
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
              column: "roleId",
              method: "eq",
              value: (data) => {
                const roleSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "role" &&
                    seed.type === "model" &&
                    seed.module === "rbac",
                );

                const roleEntity = roleSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.roleId,
                );

                return roleEntity?.new?.id || data.entity.dump.roleId;
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
              field: "roleId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "role" &&
                      seed.type === "model" &&
                      seed.module === "rbac",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.roleId,
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
