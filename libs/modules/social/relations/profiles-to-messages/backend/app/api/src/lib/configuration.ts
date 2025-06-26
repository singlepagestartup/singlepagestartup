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
          active: true,
          type: "json",
          directory: dataDirectory,
        },
        seed: {
          active: true,
          module: "social",
          name: "profiles-to-messages",
          type: "relation",
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
