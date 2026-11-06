import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/relations/sources-to-chunks/backend/repository/database";
import type { Repository } from "../repository";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  forChunkIds(ids: string[]) {
    return (this.repository as Repository).forChunkIds(ids);
  }
  async forSources(sourceIds: string[]) {
    if (!sourceIds.length) return [];
    return this.find({
      params: {
        filters: {
          and: [{ column: "sourceId", method: "inArray", value: sourceIds }],
        },
      },
    });
  }
  async unlinkSources(sourceIds: string[]) {
    const links = await this.forSources(sourceIds);
    for (const link of links) await this.delete({ id: link.id });
    return links.map((link) => link.chunkId);
  }
}
