import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/knowledge/relations/sources-to-chunks/backend/repository/database";
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
          module: "knowledge",
          name: "sources-to-chunks",
          type: "relation",
          transformers: [
            {
              field: "sourceId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "source" &&
                      seed.type === "model" &&
                      seed.module === "knowledge",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.sourceId,
                  );

                return relationEntites?.[0].new.id;
              },
            },
            {
              field: "chunkId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "chunk" &&
                      seed.type === "model" &&
                      seed.module === "knowledge",
                  )
                  ?.seeds?.filter(
                    (seed) => seed.dump.id === data.entity.dump.chunkId,
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
