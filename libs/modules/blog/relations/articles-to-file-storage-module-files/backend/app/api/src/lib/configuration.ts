import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/blog/relations/articles-to-file-storage-module-files/backend/repository/database";
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
          name: "articles-to-file-storage-module-files",
          type: "relation",
          filters: [
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
            {
              column: "fileStorageModuleFileId",
              method: "eq",
              value: (data) => {
                const fileSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "file" &&
                    seed.type === "model" &&
                    seed.module === "file-storage",
                );

                const fileEntity = fileSeed?.seeds.find(
                  (seed) =>
                    seed.dump.id === data.entity.dump.fileStorageModuleFileId,
                );

                return (
                  fileEntity?.new?.id ||
                  data.entity.dump.fileStorageModuleFileId
                );
              },
            },
          ],
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
              field: "fileStorageModuleFileId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "file" &&
                      seed.type === "model" &&
                      seed.module === "file-storage",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id === data.entity.dump.fileStorageModuleFileId,
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
