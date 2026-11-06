import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/models/chunk/backend/repository/database";
import type { Repository } from "../repository";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  search(props: Parameters<Repository["search"]>[0]) {
    return (this.repository as Repository).search(props);
  }
  async removeIds(ids: string[]) {
    for (const id of [...new Set(ids)]) await this.delete({ id });
  }
}
