import {
  IConfiguration,
  Configuration as ParentConfiguration,
} from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/social/relations/profiles-to-knowledge-module-documents/backend/repository/database";
import { injectable } from "inversify";

@injectable()
export class Configuration
  extends ParentConfiguration
  implements IConfiguration
{
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
          name: "profiles-to-knowledge-module-documents",
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
              field: "knowledgeModuleDocumentId",
              transform: (data) => {
                const relationEntites = data.seeds
                  .find(
                    (seed) =>
                      seed.name === "document" &&
                      seed.type === "model" &&
                      seed.module === "knowledge",
                  )
                  ?.seeds?.filter(
                    (seed) =>
                      seed.dump.id ===
                      data.entity.dump.knowledgeModuleDocumentId,
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
