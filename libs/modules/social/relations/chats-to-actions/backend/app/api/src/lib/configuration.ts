import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/relations/chats-to-actions/backend/repository/database";
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
          name: "chats-to-actions",
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
              column: "messageId",
              method: "eq",
              value: (data) => {
                const messageSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "message" &&
                    seed.type === "model" &&
                    seed.module === "social",
                );

                const messageEntity = messageSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.messageId,
                );

                return messageEntity?.new?.id || data.entity.dump.messageId;
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
              field: "messageId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "message" &&
                      seed.type === "model" &&
                      seed.module === "social",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.messageId,
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
