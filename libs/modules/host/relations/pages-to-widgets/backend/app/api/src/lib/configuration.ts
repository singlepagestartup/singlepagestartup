import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/host/relations/pages-to-widgets/backend/repository/database";
import { RBAC_EMAIL_PASSWORD_PATHS } from "@sps/shared-utils";
import { injectable } from "inversify";

const authenticationWidgets = [
  {
    url: RBAC_EMAIL_PASSWORD_PATHS.registration,
    original: "rbac-subject-login-and-password-registration",
    replacement: "ai-chat-host-create-account",
  },
  {
    url: RBAC_EMAIL_PASSWORD_PATHS["forgot-password"],
    original: "rbac-login-and-password-forgot-password",
    replacement: "ai-chat-host-forgot-password",
  },
  {
    url: RBAC_EMAIL_PASSWORD_PATHS["reset-password"],
    original: "rbac-login-and-password-reset-password",
    replacement: "ai-chat-host-reset-password",
  },
];

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
          name: "pages-to-widgets",
          type: "relation",
          prepareSnapshot: ({ snapshot: link, seeds, existing }) => {
            const pageSeeds = seeds.find(
              (seed) => seed.module === "host" && seed.name === "page",
            );
            const page = pageSeeds?.seeds.find(
              (row) => row.dump.id === link.pageId,
            );
            const binding = authenticationWidgets.find(
              (entry) => entry.url === page?.dump.url,
            );
            if (
              !binding ||
              page?.new.variant !== "noindex" ||
              link.variant !== "default"
            ) {
              return link;
            }
            const targets = seeds.find(
              (seed) => seed.module === "host" && seed.name === "widget",
            )?.seeds;
            const original = targets?.find(
              (row) => row.dump.id === link.widgetId,
            );
            const replacement = targets?.find(
              (row) => row.dump.slug === binding.replacement,
            );
            if (!replacement || original?.dump.slug !== binding.original) {
              return link;
            }
            const currentLinks = existing.filter(
              (row) => row.pageId === page.new.id,
            );
            if (
              currentLinks.length &&
              !currentLinks.some((row) => row.widgetId === replacement.new.id)
            ) {
              return link;
            }
            return { ...link, widgetId: replacement.dump.id };
          },
          filters: [
            {
              column: "pageId",
              method: "eq",
              value: (data) => {
                const pageSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "page" &&
                    seed.type === "model" &&
                    seed.module === "host",
                );

                const pageEntity = pageSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.pageId,
                );

                return pageEntity?.new?.id || data.entity.dump.pageId;
              },
            },
            {
              column: "widgetId",
              method: "eq",
              value: (data) => {
                const widgetSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "widget" &&
                    seed.type === "model" &&
                    seed.module === "host",
                );

                const widgetEntity = widgetSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.widgetId,
                );

                return widgetEntity?.new?.id || data.entity.dump.widgetId;
              },
            },
          ],
          transformers: [
            {
              field: "pageId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "page" &&
                      seed.type === "model" &&
                      seed.module === "host",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.pageId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "widgetId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "widget" &&
                      seed.type === "model" &&
                      seed.module === "host",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.widgetId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
          ],
        },
      },
    });
  }
}
