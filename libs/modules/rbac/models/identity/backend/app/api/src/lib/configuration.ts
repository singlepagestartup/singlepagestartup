import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/models/identity/backend/repository/database";
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
        /**
         * The password hash, its salt and the cleartext password-reset code
         * never belong in an HTTP response (issue #270). The stripping runs at
         * the REST boundary, so the in-process and operator-key reads that
         * authentication depends on still see the full row.
         */
        outputSchema: selectSchema.omit({
          password: true,
          salt: true,
          code: true,
        }),
        dump: {
          active: false,
          type: "json",
          directory: dataDirectory,
        },
        seed: {
          active: false,
          module: "rbac",
          name: "identity",
          type: "model",
        },
      },
    });
  }
}
