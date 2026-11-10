import type { Repository } from "../../repository";
import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import type { ISelectSchema } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";

@injectable()
export class Service extends CRUDService<ISelectSchema> {
  declare repository: Repository;
  findWithMessage(id: string) {
    return this.repository.findWithMessage(id);
  }
}
