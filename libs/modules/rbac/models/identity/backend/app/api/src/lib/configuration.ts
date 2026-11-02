import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  outputSchema,
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
         * Strips the credential columns from responses to callers without the
         * operator secret (issue #270). It runs at the REST boundary, so the
         * in-process and operator-key reads that authentication depends on
         * still see the full row.
         */
        outputSchema,
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
