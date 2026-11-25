import { createModule } from "../module";
import { createModules } from "@sps/social/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/threads-to-actions/backend/repository/database";

import type { IModel as Action } from "@sps/social/models/action/sdk/model";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  withTypingAction<T>(
    threadId: string,
    profileId: string,
    operation: (action: Action | null) => Promise<T>,
  ) {
    return (this.repository as Repository).withTypingAction(
      threadId,
      profileId,
      operation,
    );
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }
}
