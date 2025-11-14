import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/relations/profiles-to-messages/backend/repository/database";
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
          name: "profiles-to-messages",
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
