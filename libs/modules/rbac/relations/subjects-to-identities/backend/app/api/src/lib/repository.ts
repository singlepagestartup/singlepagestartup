import "reflect-metadata";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-identities/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  protected override get readScope() {
    return notInArray(Table.variant, [
      "provider-connection",
      "provider-default",
      "provider-assignment",
    ]);
  }

  async providerConnections(
    storeId: string,
    filters: {
      id?: string;
      ownerId?: string;
      subjectId?: string;
      identityId?: string;
      active?: boolean;
    } = {},
  ) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    const rows = await this.db
      .select()
      .from(Table)
      .where(
        and(
          eq(Table.variant, "provider-connection"),
          eq(Table.storeId, storeId),
          filters.id ? eq(Table.id, filters.id) : undefined,
          filters.ownerId ? eq(Table.ownerId, filters.ownerId) : undefined,
          filters.subjectId
            ? eq(Table.subjectId, filters.subjectId)
            : undefined,
          filters.identityId
            ? eq(Table.identityId, filters.identityId)
            : undefined,
          filters.active !== undefined
            ? eq(Table.active, filters.active)
            : undefined,
        ),
      );
    return rows.map((row) => ({
      id: row.id,
      identityId: row.identityId,
      subjectId: row.subjectId,
      storeId,
      ownerId: row.ownerId!,
      label: row.label!,
      externalAccount: row.externalAccount!,
      version: row.version!,
      active: row.active!,
    }));
  }

  async createProviderConnection(data: {
    identityId: string;
    subjectId: string;
    storeId: string;
    ownerId: string;
    label: string;
    externalAccount: string;
    version: string;
  }) {
    const [row] = await this.db
      .insert(Table)
      .values({ ...data, variant: "provider-connection", active: true })
      .returning({ id: Table.id });
    return { ...data, id: row.id, active: true };
  }

  async updateProviderConnection(
    storeId: string,
    id: string,
    data: { active: boolean; version?: string },
  ) {
    await this.db
      .update(Table)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(Table.id, id),
          eq(Table.storeId, storeId),
          eq(Table.variant, "provider-connection"),
        ),
      );
    const [row] = await this.providerConnections(storeId, { id });
    return row;
  }

  async providerAssignments(
    storeId: string,
    filters?: { subjectId: string | null; capability?: string },
  ) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    const connection = alias(Table, "connection");
    const rows = await this.db
      .select({ assignment: Table, executorId: connection.subjectId })
      .from(Table)
      .innerJoin(
        connection,
        and(
          eq(connection.variant, "provider-connection"),
          eq(connection.identityId, Table.identityId),
          eq(connection.storeId, Table.storeId),
        ),
      )
      .where(
        and(
          eq(Table.storeId, storeId),
          sql`${Table.variant} IN ('provider-default','provider-assignment')`,
          filters
            ? eq(
                Table.variant,
                filters.subjectId ? "provider-assignment" : "provider-default",
              )
            : undefined,
          filters?.subjectId
            ? eq(Table.subjectId, filters.subjectId)
            : undefined,
          filters?.capability
            ? eq(Table.capability, filters.capability)
            : undefined,
        ),
      );
    return rows.map(({ assignment, executorId }) => ({
      id: assignment.id,
      storeId,
      executorId,
      identityId: assignment.identityId,
      subjectId:
        assignment.variant === "provider-default" ? null : assignment.subjectId,
      capability: assignment.capability!,
      model: assignment.model!,
      terms: assignment.terms,
    }));
  }

  async setProviderAssignment(data: {
    storeId: string;
    subjectId: string | null;
    executorId: string;
    identityId: string;
    capability: string;
    model: string;
    terms: unknown;
  }) {
    const [existing] = await this.providerAssignments(data.storeId, data);
    const values = {
      storeId: data.storeId,
      subjectId: data.subjectId ?? data.executorId,
      identityId: data.identityId,
      variant: data.subjectId ? "provider-assignment" : "provider-default",
      capability: data.capability,
      model: data.model,
      terms: data.terms,
      updatedAt: new Date(),
    };
    if (existing) {
      await this.db
        .update(Table)
        .set(values)
        .where(
          and(
            eq(Table.id, existing.id),
            eq(Table.storeId, data.storeId),
            eq(Table.variant, values.variant),
          ),
        );
      return { ...data, id: existing.id };
    }
    const [row] = await this.db
      .insert(Table)
      .values(values)
      .returning({ id: Table.id });
    return { ...data, id: row.id };
  }
}
