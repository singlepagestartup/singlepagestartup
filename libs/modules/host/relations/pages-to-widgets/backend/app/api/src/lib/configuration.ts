import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/host/relations/pages-to-widgets/backend/repository/database";
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
          name: "pages-to-widgets",
          type: "relation",
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
                const widgets = data.seeds.find(
                  (seed) =>
                    seed.name === "widget" &&
                    seed.type === "model" &&
                    seed.module === "host",
                )?.seeds;
                const widget = widgets?.find(
                  (seed) => seed.dump.id === data.entity.dump.widgetId,
                );
                const widgetId = widget?.new?.id || data.entity.dump.widgetId;

                // Upgrade the task page's original board link in place.
                if (widget?.dump.slug === "crm-workspace-task-host") {
                  const pages = data.seeds.find(
                    (seed) =>
                      seed.name === "page" &&
                      seed.type === "model" &&
                      seed.module === "host",
                  )?.seeds;
                  const page = pages?.find(
                    (seed) => seed.dump.id === data.entity.dump.pageId,
                  );
                  const boardId = widgets?.find(
                    (seed) => seed.dump.slug === "crm-workspace-host",
                  )?.new?.id;
                  const existing = data.entity.db?.filter(
                    (link) => link.pageId === page?.new?.id,
                  );

                  if (
                    page?.dump.slug === "crm-workspace-task" &&
                    boardId &&
                    existing?.length === 1 &&
                    existing[0].widgetId === boardId
                  ) {
                    return boardId;
                  }
                }

                return widgetId;
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
