import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/roles-to-permissions/backend/repository/database";
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
          module: "rbac",
          name: "roles-to-permissions",
          type: "relation",
          filters: [
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
            {
              column: "permissionId",
              method: "eq",
              value: (data) => {
                const permissionSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "permission" &&
                    seed.type === "model" &&
                    seed.module === "rbac",
                );

                const permissionEntity = permissionSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.permissionId,
                );

                return (
                  permissionEntity?.new?.id || data.entity.dump.permissionId
                );
              },
            },
          ],
          transformers: [
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
            {
              field: "permissionId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "permission" &&
                      seed.type === "model" &&
                      seed.module === "rbac",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.permissionId,
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
