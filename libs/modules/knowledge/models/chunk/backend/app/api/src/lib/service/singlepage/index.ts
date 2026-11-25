import { createModules } from "@sps/knowledge/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/models/chunk/backend/repository/database";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  search(props: Parameters<Repository["search"]>[0]) {
    return (this.repository as Repository).search(props);
  }

  hasEmbeddingIndex(ids: string[], embeddingIndex?: string) {
    return (this.repository as Repository).hasEmbeddingIndex(
      ids,
      embeddingIndex,
    );
  }
  async removeIds(ids: string[]) {
    for (const id of [...new Set(ids)]) await this.delete({ id });
  }
}
