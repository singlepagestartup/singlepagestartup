import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/models/chunk/backend/repository/database";
import { sql } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async hasEmbeddingIndex(ids: string[], embeddingIndex?: string) {
    if (!ids.length) {
      return false;
    }
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "inArray", value: ids }],
    });
    const matchesIndex = embeddingIndex
      ? sql`${Table.metadata}->>'embeddingIndex' = ${embeddingIndex}`
      : sql`${Table.metadata}->>'embeddingIndex' IS NULL`;
    const [row] = await this.db
      .select({ id: Table.id })
      .from(Table)
      .where(
        sql`${Table.id} = ANY(${sql.param(ids)}::uuid[]) AND ${matchesIndex}`,
      )
      .limit(1);
    return Boolean(row);
  }

  async search(props: {
    ids?: string[];
    excludeIds?: string[];
    embedding: number[];
    topK: number;
    minSimilarity?: number;
    materialized?: boolean;
    embeddingIndex?: string;
  }) {
    if (props.ids && !props.ids.length) return [];
    await trackRepositoryRead(
      Table,
      this.db,
      props.ids
        ? { and: [{ column: "id", method: "inArray", value: props.ids }] }
        : undefined,
    );
    const vector = `[${props.embedding.join(",")}]`;
    const distance = sql<number>`${Table.embedding} <=> ${vector}::vector`;
    const byId = props.ids
      ? sql`${Table.id} = ANY(${sql.param(props.ids)}::uuid[])`
      : sql`TRUE`;
    const indexScope = props.embeddingIndex
      ? sql`${byId} AND ${Table.metadata}->>'embeddingIndex' = ${props.embeddingIndex}`
      : sql`${byId} AND ${Table.metadata}->>'embeddingIndex' IS NULL`;
    const scope = props.excludeIds?.length
      ? sql`${indexScope} AND NOT (${Table.id} = ANY(${sql.param(props.excludeIds)}::uuid[]))`
      : indexScope;
    if (props.materialized) {
      const rows = await this.db.execute(sql`WITH candidates AS MATERIALIZED (
        SELECT id, text, chunk_index AS "chunkIndex", metadata, embedding FROM ${Table}
        WHERE ${scope}
      ) SELECT id, text, "chunkIndex", metadata, (embedding <=> ${vector}::vector) AS distance,
        (1 - (embedding <=> ${vector}::vector)) AS similarity FROM candidates
        WHERE (1 - (embedding <=> ${vector}::vector)) >= ${props.minSimilarity ?? -1}
        ORDER BY embedding <=> ${vector}::vector LIMIT ${props.topK}`);
      return rows.map((row) => ({
        ...row,
        distance: Number(row.distance),
        similarity: Number(row.similarity),
      })) as {
        id: string;
        text: string;
        chunkIndex: number;
        metadata: Record<string, unknown>;
        distance: number;
        similarity: number;
      }[];
    }
    const rows = await this.db
      .select({
        id: Table.id,
        text: Table.text,
        chunkIndex: Table.chunkIndex,
        metadata: Table.metadata,
        distance,
        similarity: sql<number>`1 - (${distance})`,
      })
      .from(Table)
      .where(
        sql`${scope} AND (1 - (${distance})) >= ${props.minSimilarity ?? -1}`,
      )
      .orderBy(distance)
      .limit(props.topK);
    return rows.map((row) => ({
      ...row,
      distance: Number(row.distance),
      similarity: Number(row.similarity),
    }));
  }
}
