import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/website-builder/relations/slides-to-file-storage-module-files/backend/repository/database";
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
          module: "website-builder",
          name: "slides-to-file-storage-module-files",
          type: "relation",
          filters: [
            {
              column: "slideId",
              method: "eq",
              value: (data) => {
                const slideSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "slide" &&
                    seed.type === "model" &&
                    seed.module === "website-builder",
                );

                const slideEntity = slideSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.slideId,
                );

                return slideEntity?.new?.id || data.entity.dump.slideId;
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
              field: "slideId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "slide" &&
                      seed.type === "model" &&
                      seed.module === "website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.slideId,
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
