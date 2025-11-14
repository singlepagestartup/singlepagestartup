import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/blog/relations/categories-to-articles/backend/repository/database";
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
          name: "categories-to-articles",
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
                    seed.module === "blog",
                );

                const categoryEntity = categorySeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.categoryId,
                );

                return categoryEntity?.new?.id || data.entity.dump.categoryId;
              },
            },
            {
              column: "articleId",
              method: "eq",
              value: (data) => {
                const articleSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "article" &&
                    seed.type === "model" &&
                    seed.module === "blog",
                );

                const articleEntity = articleSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.articleId,
                );

                return articleEntity?.new?.id || data.entity.dump.articleId;
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
                      seed.module === "blog",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.categoryId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
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
          ],
        },
      },
    });
  }
}
