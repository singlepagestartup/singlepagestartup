import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/crm/relations/options-to-file-storage-module-files/backend/repository/database";
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
          name: "options-to-file-storage-module-files",
          type: "relation",
          filters: [
            {
              column: "optionId",
              method: "eq",
              value: (data) => {
                const optionSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "option" &&
                    seed.type === "model" &&
                    seed.module === "crm",
                );

                const optionEntity = optionSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.optionId,
                );

                return optionEntity?.new?.id || data.entity.dump.optionId;
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
              field: "optionId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "option" &&
                      seed.type === "model" &&
                      seed.module === "crm",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.optionId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "fileStorageId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "file-storage" &&
                      seed.type === "model" &&
                      seed.module === "file",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.fileStorageId,
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
