import "reflect-metadata";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/models/chunk/backend/repository/database";
import { sql } from "drizzle-orm";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  async search(props: {
    ids?: string[];
    embedding: number[];
    topK: number;
    minSimilarity?: number;
    materialized?: boolean;
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
    const scope = props.ids
      ? sql`${Table.id} = ANY(${sql.param(props.ids)}::uuid[])`
      : sql`TRUE`;
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
