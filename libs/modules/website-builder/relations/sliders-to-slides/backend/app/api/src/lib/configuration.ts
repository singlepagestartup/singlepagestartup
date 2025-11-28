import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/website-builder/relations/sliders-to-slides/backend/repository/database";
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
          name: "sliders-to-slides",
          type: "relation",
          filters: [
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
            {
              column: "slideId",
              method: "eq",
              value: (data) => {
                const slideSeed = data.seeds.find(
                  (seed) =>
                    seed.name === "slide" &&
                    seed.type === "model" &&
                    seed.module === "website-builder",
                );

                const slideEntity = slideSeed?.seeds.find(
                  (seed) => seed.dump.id === data.entity.dump.slideId,
                );

                return slideEntity?.new?.id || data.entity.dump.slideId;
              },
            },
          ],
          transformers: [
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
            {
              field: "slideId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "slide" &&
                      seed.type === "model" &&
                      seed.module === "website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.slideId,
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
