import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/crm/relations/widgets-to-website-builder-module-widgets/backend/repository/database";
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
          module: "crm",
          name: "widgets-to-website-builder-module-widgets",
          type: "relation",
          filters: [
            {
              column: "widgetId",
              method: "eq",
              value: (data) => {
                const widgetSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "widget" &&
                    seed.type === "model" &&
                    seed.module === "crm",
                );

                const widgetEntity = widgetSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.widgetId,
                );

                return widgetEntity?.new?.id || data.entity.dump.widgetId;
              },
            },
            {
              column: "websiteBuilderModuleWidgetId",
              method: "eq",
              value: (data) => {
                const formSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "widget" &&
                    seed.type === "model" &&
                    seed.module === "website-builder",
                );

                const formEntity = formSeed?.seeds.find(
                  (seed) =>
                    seed.dump.id ===
                    data.entity.dump.websiteBuilderModuleWidgetId,
                );

                return (
                  formEntity?.new?.id ||
                  data.entity.dump.websiteBuilderModuleWidgetId
                );
              },
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
                      seed.module === "crm",
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
