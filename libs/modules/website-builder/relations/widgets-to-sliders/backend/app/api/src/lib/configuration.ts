import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/website-builder/relations/widgets-to-sliders/backend/repository/database";
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
          module: "website-builder",
          name: "widgets-to-sliders",
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
                    seed.module === "website-builder",
                );

                const widgetEntity = widgetSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.widgetId,
                );

                return widgetEntity?.new?.id || data.entity.dump.widgetId;
              },
            },
            {
              column: "sliderId",
              method: "eq",
              value: (data) => {
                const sliderSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "slider" &&
                    seed.type === "model" &&
                    seed.module === "website-builder",
                );

                const sliderEntity = sliderSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.sliderId,
                );

                return sliderEntity?.new?.id || data.entity.dump.sliderId;
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
                      seed.module === "website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.widgetId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "sliderId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "slider" &&
                      seed.type === "model" &&
                      seed.module === "website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.sliderId,
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
