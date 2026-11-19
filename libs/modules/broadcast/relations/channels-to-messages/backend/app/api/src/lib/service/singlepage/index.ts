import { createModule } from "../module";
import { createModules } from "@sps/broadcast/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService, withConsistencySnapshot } from "@sps/shared-backend-api";
import type { ISelectSchema } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<ISelectSchema> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  findWithMessage(id: string) {
    return withConsistencySnapshot(async () => {
      const relation = await this.findById({ id });
      if (!relation) {
        return null;
      }

      const message = await this.module.message.findPayloadById({
        id: relation.messageId,
      });
      if (!message) {
        return null;
      }

      return { relation, message };
    });
  }
}
