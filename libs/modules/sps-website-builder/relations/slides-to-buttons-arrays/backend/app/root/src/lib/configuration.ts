import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import { schema } from "@sps/sps-rbac/backend/db/root";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/sps-website-builder/relations/slides-to-buttons-arrays/backend/repository/database";
import { injectable } from "inversify";

@injectable()
export class Configuration extends ParentConfiguration {
  constructor() {
    super({
      repository: {
        type: "database",
        schema: schema,
        Table: Table,
        insertSchema,
        selectSchema,
        dump: {
          type: "json",
          directory: dataDirectory,
        },
        seed: {
          module: "sps-website-builder",
          name: "slides-to-buttons-arrays",
          type: "relation",
          transformers: [
            {
              field: "slideId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "slide" &&
                      seed.type === "model" &&
                      seed.module === "sps-website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.slideId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "buttonsArrayId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "buttons-array" &&
                      seed.type === "model" &&
                      seed.module === "sps-website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.buttonsArrayId,
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
