import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/file-storage/models/file/backend/repository/database";
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
          module: "file-storage",
          name: "file",
          type: "model",
          filters: [
            {
              column: "file",
              method: "eq",
              value: (data) => {
                return data.entity.dump.file;
              },
            },
          ],
        },
      },
    });
  }
}
