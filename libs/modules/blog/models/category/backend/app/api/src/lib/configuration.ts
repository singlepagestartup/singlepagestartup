import {
  IConfiguration,
  Configuration as ParentConfiguration,
} from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/blog/models/category/backend/repository/database";
import { injectable } from "inversify";

@injectable()
export class Configuration
  extends ParentConfiguration
  implements IConfiguration
{
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
          module: "blog",
          name: "category",
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
