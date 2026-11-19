import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/messages-to-crm-module-task-events/backend/repository/database";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  updatePending(eventId: string, pending: boolean) {
    return (this.repository as Repository).updatePending(eventId, pending);
  }
}
