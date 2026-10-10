import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/models/source/backend/repository/database";
import { KnowledgeRepository } from "@sps/knowledge/backend/app/api/src/lib/repository";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { hashContent } from "@sps/knowledge/backend/app/api/src/lib/service/utils";

type Source = typeof Table.$inferSelect;

@injectable()
export class Service extends CRUDService<Source> {
  async create(props: { data: any }): Promise<Source> {
    const data = {
      ...props.data,
      contentHash: hashContent(props.data.content || ""),
      indexedContentHash: null,
      lastIndexedAt: null,
    };
    const source = await super.create({ data });
    await this.indexChanged(source);
    return (await this.findById({ id: source.id }))!;
  }

  async findOrCreate(props: { data: any }) {
    const existing = await this.find({
      params: {
        filters: {
          and: [{ column: "slug", method: "eq", value: props.data.slug }],
        },
      },
    });
    if (existing.length)
      return { entity: existing[0], statusCode: 200 as const };
    return { entity: await this.create(props), statusCode: 201 as const };
  }

  async update(props: { id: string; data: any }): Promise<Source | null> {
    const source = await new KnowledgeRepository().updateSource({
      sourceId: props.id,
      data: props.data,
    });
    if (source) await this.indexChanged(source);
    return this.findById({ id: props.id });
  }

  async delete(props: { id: string }): Promise<Source> {
    const source = await new KnowledgeService().deleteSource(props.id);
    if (!source) throw new Error(`Knowledge Source ${props.id} was not found.`);
    return source;
  }

  private async indexChanged(source: Source) {
    if (source.indexedContentHash === source.contentHash) return;
    try {
      await new KnowledgeService().index({ sourceId: source.id });
    } catch (error) {
      console.error(
        "Knowledge Source saved; indexing failed",
        source.id,
        error,
      );
    }
  }
}
