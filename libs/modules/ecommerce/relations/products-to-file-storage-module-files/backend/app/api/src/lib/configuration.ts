import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/repository/database";
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
          name: "products-to-file-storage-module-files",
          type: "relation",
          filters: [
            {
              column: "productId",
              method: "eq",
              value: (data) => {
                const productSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "product" &&
                    seed.type === "model" &&
                    seed.module === "ecommerce",
                );

                const productEntity = productSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.productId,
                );

                return productEntity?.new?.id || data.entity.dump.productId;
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
              field: "productId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "product" &&
                      seed.type === "model" &&
                      seed.module === "ecommerce",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.productId,
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
