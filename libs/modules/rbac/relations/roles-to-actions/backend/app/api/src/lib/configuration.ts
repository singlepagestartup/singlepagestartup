import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/roles-to-actions/backend/repository/database";
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
          name: "roles-to-actions",
          type: "relation",
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
              field: "actionId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "action" &&
                      seed.type === "model" &&
                      seed.module === "rbac",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.actionId,
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
