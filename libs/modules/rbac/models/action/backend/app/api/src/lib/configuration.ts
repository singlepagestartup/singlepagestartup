import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/models/action/backend/repository/database";
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
          name: "action",
          type: "model",
          filters: [
            {
              column: "path",
              method: "eq",
              value: (data) => {
                return data.entity.dump.path;
              },
            },
            {
              column: "method",
              method: "eq",
              value: (data) => {
                return data.entity.dump.method;
              },
            },
          ],
        },
      },
    });
  }
}
