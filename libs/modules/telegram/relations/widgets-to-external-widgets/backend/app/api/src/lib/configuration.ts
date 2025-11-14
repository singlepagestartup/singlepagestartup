import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/telegram/relations/widgets-to-external-widgets/backend/repository/database";
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
          module: "telegram",
          name: "widgets-to-external-widgets",
          type: "relation",
          filters: [
            {
              column: "widgetId",
              method: "eq",
              value: (data) => {
                const widgetSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "widget" &&
                    seed.type === "model" &&
                    seed.module === "telegram",
                );

                const widgetEntity = widgetSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.widgetId,
                );

                return widgetEntity?.new?.id || data.entity.dump.widgetId;
              },
            },
            {
              column: "externalWidgetId",
              method: "eq",
              value: (data) => {
                const externalWidgetSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "widget" &&
                    seed.type === "model" &&
                    seed.module === data.entity.dump.externalModule,
                );

                const externalWidgetEntity = externalWidgetSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.externalWidgetId,
                );

                return (
                  externalWidgetEntity?.new?.id ||
                  data.entity.dump.externalWidgetId
                );
              },
            },
          ],
          transformers: [
            {
              field: "widgetId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "widget" &&
                      seed.type === "model" &&
                      seed.module === "telegram",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.widgetId,
                  );

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
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id === data.entity.dump.externalWidgetId,
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
