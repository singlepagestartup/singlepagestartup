import "reflect-metadata";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/thread/backend/repository/database";
import type { IThreadMetadataNamespaceUpdate } from "@sps/social/models/thread/sdk/model";
import { and, eq, sql } from "drizzle-orm";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  async updateMetadataNamespace(
    props: IThreadMetadataNamespaceUpdate & { id: string },
  ) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/.test(props.namespace) ||
      ["constructor", "prototype", "__proto__"].includes(props.namespace)
    )
      throw new Error("Validation error. Invalid metadata namespace");
    const value = JSON.stringify(props.value);
    const expected = JSON.stringify(props.expectedValue ?? null);
    if (value === undefined)
      throw new Error("Validation error. Metadata value is required");
    const [row] = await this.db
      .update(this.Table)
      .set({
        metadata: sql`jsonb_set(coalesce(${this.Table.metadata}, '{}'::jsonb), ARRAY[${props.namespace}]::text[], ${value}::jsonb, true)`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(this.Table.id, props.id),
          sql`coalesce(${this.Table.metadata} -> ${props.namespace}, 'null'::jsonb) = ${expected}::jsonb`,
        ),
      )
      .returning();
    return row
      ? (this.selectSchema.parse(row) as (typeof Table)["$inferSelect"])
      : null;
  }
}
