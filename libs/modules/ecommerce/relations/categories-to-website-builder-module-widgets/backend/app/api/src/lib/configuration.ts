import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/backend/repository/database";
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
          module: "ecommerce",
          name: "categories-to-website-builder-module-widgets",
          type: "relation",
          filters: [
            {
              column: "categoryId",
              method: "eq",
              value: (data) => {
                const categorySeed = data.seeds.find(
                  (seed) =>
                    seed.name === "category" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const categoryEntity = categorySeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.categoryId,
                );

                return categoryEntity?.new?.id || data.entity.dump.categoryId;
              },
            },
            {
              column: "websiteBuilderModuleWidgetId",
              method: "eq",
              value: (data) => {
                const widgetSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "widget" &&
                    seed.type === "model" &&
                    seed.module === "website-builder",
                );

                const widgetEntity = widgetSeed?.seeds.find(
                  (seed) =>
                    seed.dump.id ===
                    data.entity.dump.websiteBuilderModuleWidgetId,
                );

                return (
                  widgetEntity?.new?.id ||
                  data.entity.dump.websiteBuilderModuleWidgetId
                );
              },
            },
          ],
          transformers: [
            {
              field: "categoryId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "category" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.categoryId,
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
                      seed.module === "website-builder",
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
