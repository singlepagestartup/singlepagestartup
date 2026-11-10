import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/host/models/page/backend/repository/database";
import { RBAC_EMAIL_PASSWORD_PATHS } from "@sps/shared-utils";
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
          prepareSnapshot: ({ snapshot: page, existing, snapshots }) => {
            if (page.url !== "/ai-chat/sign-in") {
              return page;
            }
            const canonical = existing.find(
              (row) => row.url === RBAC_EMAIL_PASSWORD_PATHS.authentication,
            );
            const hasCanonicalSnapshot = snapshots.some(
              (row) => row.url === RBAC_EMAIL_PASSWORD_PATHS.authentication,
            );
            if (hasCanonicalSnapshot) {
              return page;
            }
            // Seeded rows receive local IDs. The imported admin title identifies
            // the same Studio page after its URL has been migrated.
            if (canonical && canonical.id !== page.id) {
              const sameStudioPage =
                page.adminTitle && canonical.adminTitle === page.adminTitle;
              if (
                !sameStudioPage ||
                existing.some((row) => row.url === page.url)
              ) {
                return page;
              }
            }
            return { ...page, url: RBAC_EMAIL_PASSWORD_PATHS.authentication };
          },
          filters: [
            {
              column: "url",
              method: "eq",
              value: (data) => {
                return data.entity.dump.url;
              },
            },
          ],
        },
      },
    });
  }
}
