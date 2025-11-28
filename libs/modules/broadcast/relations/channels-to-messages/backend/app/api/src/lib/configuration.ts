import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";
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
          module: "broadcast",
          name: "channels-to-messages",
          type: "relation",
          filters: [
            {
              column: "channelId",
              method: "eq",
              value: (data) => {
                const channelSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "channel" &&
                    seed.type === "model" &&
                    seed.module === "broadcast",
                );

                const channelEntity = channelSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.channelId,
                );

                return channelEntity?.new?.id || data.entity.dump.channelId;
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
                    seed.module === "broadcast",
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
              field: "channelId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "channel" &&
                      seed.type === "model" &&
                      seed.module === "broadcast",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.channelId,
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
                      seed.module === "broadcast",
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
