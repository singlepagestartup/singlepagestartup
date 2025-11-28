import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/categories-to-file-storage-module-files/backend/repository/database";
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
          name: "categories-to-file-storage-module-files",
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
              column: "fileStorageModuleFileId",
              method: "eq",
              value: (data) => {
                const fileStorageModuleFileSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "file-storage-module-file" &&
                    seed.type === "model" &&
                    seed.module === "file-storage",
                );

                const fileStorageModuleFileEntity =
                  fileStorageModuleFileSeed?.seeds.find(
                    (seed) =>
                      seed.dump.id === data.entity.dump.fileStorageModuleFileId,
                  );

                return (
                  fileStorageModuleFileEntity?.new?.id ||
                  data.entity.dump.fileStorageModuleFileId
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
