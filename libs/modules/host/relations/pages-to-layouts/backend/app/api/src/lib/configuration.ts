import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/host/relations/pages-to-layouts/backend/repository/database";
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
          name: "pages-to-layouts",
          type: "relation",
          prepareSnapshot: ({ snapshot: link, seeds, existing }) => {
            const pageSeeds = seeds.find(
              (seed) => seed.module === "host" && seed.name === "page",
            );
            const page = pageSeeds?.seeds.find(
              (row) => row.dump.id === link.pageId,
            );
            if (
              page?.new.variant !== "noindex" ||
              link.variant !== "default" ||
              !Object.values(RBAC_EMAIL_PASSWORD_PATHS).includes(page.dump.url)
            ) {
              return link;
            }
            const targets = seeds.find(
              (seed) => seed.module === "host" && seed.name === "layout",
            )?.seeds;
            const original = targets?.find(
              (row) => row.dump.id === link.layoutId,
            );
            const replacement = targets?.find(
              (row) => row.dump.slug === "ai-chat-layout",
            );
            if (!replacement || original?.dump.slug !== "asdffd") {
              return link;
            }
            const currentLinks = existing.filter(
              (row) => row.pageId === page.new.id,
            );
            if (
              currentLinks.length &&
              !currentLinks.some((row) => row.layoutId === replacement.new.id)
            ) {
              return link;
            }
            return { ...link, layoutId: replacement.dump.id };
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
              column: "layoutId",
              method: "eq",
              value: (data) => {
                const layoutSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "layout" &&
                    seed.type === "model" &&
                    seed.module === "host",
                );

                const layoutEntity = layoutSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.layoutId,
                );

                return layoutEntity?.new?.id || data.entity.dump.layoutId;
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
              field: "layoutId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "layout" &&
                      seed.type === "model" &&
                      seed.module === "host",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.layoutId,
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
