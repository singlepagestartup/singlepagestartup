import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/blog/relations/articles-to-website-builder-module-widgets/backend/repository/database";
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
          module: "blog",
          name: "articles-to-website-builder-module-widgets",
          type: "relation",
          transformers: [
            {
              field: "articleId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "article" &&
                      seed.type === "model" &&
                      seed.module === "blog",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.articleId,
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
