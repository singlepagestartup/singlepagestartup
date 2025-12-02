import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/relations/profiles-to-actions/backend/repository/database";
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
          name: "profiles-to-actions",
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
              column: "actionId",
              method: "eq",
              value: (data) => {
                const actionSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "action" &&
                    seed.type === "model" &&
                    seed.module === "social",
                );

                const actionEntity = actionSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.actionId,
                );

                return actionEntity?.new?.id || data.entity.dump.actionId;
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
              field: "actionId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "action" &&
                      seed.type === "model" &&
                      seed.module === "social",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.actionId,
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
