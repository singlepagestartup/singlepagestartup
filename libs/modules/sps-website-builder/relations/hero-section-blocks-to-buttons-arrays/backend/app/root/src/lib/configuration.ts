import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import { schema } from "@sps/sps-rbac/backend/db/root";
import {
  Table,
  insertSchema,
  selectSchema,
} from "@sps/sps-website-builder/relations/hero-section-blocks-to-buttons-arrays/backend/schema/root";
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
          directory: `${__dirname}/data`,
        },
        seed: {
          module: "sps-website-builder",
          name: "hero-section-blocks-to-buttons-arrays",
          type: "relation",
          transformers: [
            {
              field: "heroSectionBlockId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "hero-section-block" &&
                      seed.type === "model" &&
                      seed.module === "sps-website-builder",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id === data.entity.dump.heroSectionBlockId,
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
