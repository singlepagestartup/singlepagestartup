import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/relations/profiles-to-chats/backend/repository/database";
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
          name: "profiles-to-chats",
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
          ],
        },
      },
    });
  }
}
