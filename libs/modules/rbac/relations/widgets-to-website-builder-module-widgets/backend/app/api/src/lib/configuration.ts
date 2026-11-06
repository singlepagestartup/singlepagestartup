import {
  IConfiguration,
  Configuration as ParentConfiguration,
} from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/backend/repository/database";
import { injectable } from "inversify";

@injectable()
export class Configuration
  extends ParentConfiguration
  implements IConfiguration
{
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
          module: "rbac",
          name: "widgets-to-website-builder-module-widgets",
          type: "relation",
          filters: [
            {
              column: "widgetId",
              method: "eq",
              value: ({ seeds, entity }) =>
                seeds
                  .find(
                    (seed) =>
                      seed.module === "rbac" &&
                      seed.type === "model" &&
                      seed.name === "widget",
                  )
                  ?.seeds.find((seed) => seed.dump.id === entity.dump.widgetId)
                  ?.new?.id ?? entity.dump.widgetId,
            },
            {
              column: "websiteBuilderModuleWidgetId",
              method: "eq",
              value: ({ seeds, entity }) =>
                seeds
                  .find(
                    (seed) =>
                      seed.module === "website-builder" &&
                      seed.type === "model" &&
                      seed.name === "widget",
                  )
                  ?.seeds.find(
                    (seed) =>
                      seed.dump.id === entity.dump.websiteBuilderModuleWidgetId,
                  )?.new?.id ?? entity.dump.websiteBuilderModuleWidgetId,
            },
          ],
          transformers: [
            {
              field: "widgetId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "widget" &&
                      seed.type === "model" &&
                      seed.module === "rbac",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.widgetId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "websiteBuilderModuleWidgetId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "widget" &&
                      seed.type === "model" &&
                      seed.module === "website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id ===
                      data.entity.dump.websiteBuilderModuleWidgetId,
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
