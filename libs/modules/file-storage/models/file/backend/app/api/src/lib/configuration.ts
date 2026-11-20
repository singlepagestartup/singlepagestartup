import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/file-storage/models/file/backend/repository/database";
import { injectable } from "inversify";
import { isLegacyOrderReceipt } from "@sps/file-storage/models/file/sdk/model";

const include = (entity: Record<string, unknown>) =>
  !isLegacyOrderReceipt({
    adminTitle:
      typeof entity.adminTitle === "string" ? entity.adminTitle : undefined,
  });

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
          include,
        },
        seed: {
          active: true,
          module: "file-storage",
          name: "file",
          type: "model",
          include,
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
