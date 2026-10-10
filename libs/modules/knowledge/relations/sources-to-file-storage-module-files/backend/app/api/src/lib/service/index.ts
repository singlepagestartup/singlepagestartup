import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/repository/database";
import { KnowledgeRepository } from "@sps/knowledge/backend/app/api/src/lib/repository";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";

type Relation = typeof Table.$inferSelect;

@injectable()
export class Service extends CRUDService<Relation> {
  async create(props: { data: any }): Promise<Relation> {
    return (await this.mutate({ action: "create", data: props.data }))!;
  }

  async findOrCreate(props: { data: any }) {
    const existing = await this.find({
      params: {
        filters: {
          and: [
            { column: "sourceId", method: "eq", value: props.data.sourceId },
            {
              column: "fileStorageModuleFileId",
              method: "eq",
              value: props.data.fileStorageModuleFileId,
            },
          ],
        },
      },
    });
    if (existing.length)
      return { entity: existing[0], statusCode: 200 as const };
    return { entity: await this.create(props), statusCode: 201 as const };
  }

  async update(props: { id: string; data: any }): Promise<Relation | null> {
    return this.mutate({ action: "update", ...props });
  }

  async delete(props: { id: string }): Promise<Relation> {
    return (await this.mutate({ action: "delete", ...props }))!;
  }

  private async mutate(
    props: Parameters<KnowledgeRepository["mutateFileRelation"]>[0],
  ) {
    const result = await new KnowledgeRepository().mutateFileRelation(props);
    for (const sourceId of result.sourceIds) {
      try {
        await new KnowledgeService().rebuildFiles(sourceId);
      } catch (error) {
        console.error(
          "Knowledge file relation saved; analysis failed",
          sourceId,
          error,
        );
      }
    }
    return result.relation;
  }
}
