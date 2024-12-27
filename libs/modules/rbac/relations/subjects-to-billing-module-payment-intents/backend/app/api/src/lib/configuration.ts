import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/backend/repository/database";
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
          name: "subjects-to-billing-module-payment-intents",
          type: "relation",
        },
      },
    });
  }
}
