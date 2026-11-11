import { createHash } from "node:crypto";
import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/host/models/page/backend/repository/database";
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
          module: "host",
          name: "page",
          type: "model",
          filters: [
            {
              column: "slug",
              method: "eq",
              value: ({ entity: { dump, db = [] } }) => {
                if (dump.slug && db.some((page) => page.slug === dump.slug)) {
                  return dump.slug;
                }

                const page = db.find((row) => row.url === dump.url);
                if (!page || !dump.slug) {
                  return page?.slug ?? dump.slug;
                }

                // An installation may already use the new URL when the migration runs.
                const urlHash = createHash("sha256")
                  .update(page.url)
                  .digest("hex");
                if (page.slug === `page-${urlHash}`) {
                  return page.slug;
                }

                return dump.slug;
              },
            },
          ],
        },
      },
    });
  }
}
