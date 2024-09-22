import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/notification/relations/notifications-to-templates/backend/repository/database";
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
          module: "notification",
          name: "notifications-to-templates",
          type: "relation",
          transformers: [
            {
              field: "notificationId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "notification" &&
                      seed.type === "model" &&
                      seed.module === "notification",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.notificationId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "templateId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "template" &&
                      seed.type === "model" &&
                      seed.module === "notification",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.templateId,
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
