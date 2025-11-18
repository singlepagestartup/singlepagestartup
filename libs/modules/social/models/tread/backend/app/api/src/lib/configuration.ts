import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/models/tread/backend/repository/database";
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
          module: "social",
          name: "chat",
          type: "model",
          filters: [
            {
              column: "slug",
              method: "eq",
              value: (data) => {
                return data.entity.dump.slug;
              },
            },
          ],
        },
      },
    });
  }
}
