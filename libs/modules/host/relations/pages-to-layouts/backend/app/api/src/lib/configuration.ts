import {
  Configuration as ParentConfiguration,
  type ISeedResult,
} from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/host/relations/pages-to-layouts/backend/repository/database";
import { injectable } from "inversify";

function resolveModelId(
  seeds: ISeedResult[],
  name: "page" | "layout",
  snapshotId: string,
): string {
  const modelSeed = seeds.find(
    (seed) =>
      seed.name === name && seed.type === "model" && seed.module === "host",
  );
  return (
    modelSeed?.seeds.find(({ dump }) => dump.id === snapshotId)?.new?.id ??
    snapshotId
  );
}

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
          filters: [
            {
              column: "id",
              method: "inArray",
              value: ({ seeds, entity }) => {
                const existing: (typeof Table)["$inferSelect"][] =
                  entity.db ?? [];
                const { id, pageId, layoutId, createdAt, variant, orderIndex } =
                  entity.dump;
                const targetPageId = resolveModelId(seeds, "page", pageId);
                const pageLinks = existing.filter(
                  (link) => link.pageId === targetPageId,
                );
                if (pageLinks.some((link) => link.id === id)) {
                  return [id];
                }

                const targetLayoutId = resolveModelId(
                  seeds,
                  "layout",
                  layoutId,
                );
                const matches = pageLinks
                  .filter((link) => link.layoutId === targetLayoutId)
                  .map((link) => link.id);
                if (matches.length) {
                  return matches;
                }

                // Seeded links retain their creation time and slot when their IDs are remapped.
                const timestamp = new Date(createdAt).getTime();
                const priorLinks = pageLinks.filter(
                  (link) =>
                    link.createdAt.getTime() === timestamp &&
                    link.variant === variant &&
                    link.orderIndex === orderIndex,
                );
                if (priorLinks.length === 1) {
                  return [priorLinks[0].id];
                }

                return [id];
              },
            },
          ],
          transformers: [
            {
              field: "pageId",
              transform: ({ seeds, entity }) =>
                resolveModelId(seeds, "page", entity.dump.pageId),
            },
            {
              field: "layoutId",
              transform: ({ seeds, entity }) =>
                resolveModelId(seeds, "layout", entity.dump.layoutId),
            },
          ],
        },
      },
    });
  }
}
