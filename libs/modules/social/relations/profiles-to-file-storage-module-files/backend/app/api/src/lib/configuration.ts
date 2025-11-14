import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/relations/profiles-to-file-storage-module-files/backend/repository/database";
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
          module: "social",
          name: "profiles-to-file-storage-module-files",
          type: "relation",
          filters: [
            {
              column: "profileId",
              method: "eq",
              value: (data) => {
                const profileSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "profile" &&
                    seed.type === "model" &&
                    seed.module === "social",
                );

                const profileEntity = profileSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.profileId,
                );

                return profileEntity?.new?.id || data.entity.dump.profileId;
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
              field: "profileId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "profile" &&
                      seed.type === "model" &&
                      seed.module === "social",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.profileId,
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
