import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/host/relations/widgets-to-external-widgets/backend/repository/database";
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
          module: "host",
          name: "widgets-to-external-widgets",
          type: "relation",
          transformers: [
            {
              field: "widgetId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "widget" &&
                      seed.type === "model" &&
                      seed.module === "host",
                  )
                  ?.seeds?.filter((seed) => {
                    return seed.dump.id === data.entity.dump.widgetId;
                  });

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "externalWidgetId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "widget" &&
                      seed.type === "model" &&
                      seed.module === data.entity.dump.externalModule,
                  )
                  ?.seeds?.filter((seed) => {
                    return seed.dump.id === data.entity.dump.externalWidgetId;
                  });

                return relationEntites?.[0].new.id;
              },
            },
          ],
        },
      },
    });
  }
}
