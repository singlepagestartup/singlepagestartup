import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/relations/chats-to-file-storage-module-files/backend/repository/database";
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
          active: false,
          type: "json",
          directory: dataDirectory,
        },
        seed: {
          active: false,
          module: "social",
          name: "chats-to-file-storage-module-files",
          type: "relation",
          filters: [
            {
              column: "chatId",
              method: "eq",
              value: (data) => {
                const chatSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "chat" &&
                    seed.type === "model" &&
                    seed.module === "social",
                );

                const chatEntity = chatSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.chatId,
                );

                return chatEntity?.new?.id || data.entity.dump.chatId;
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
              field: "chatId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "chat" &&
                      seed.type === "model" &&
                      seed.module === "social",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.chatId,
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
