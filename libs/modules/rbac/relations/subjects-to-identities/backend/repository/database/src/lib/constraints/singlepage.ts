import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  variant: pgCore.PgColumn;
  subjectId: pgCore.PgColumn;
  storeId: pgCore.PgColumn;
  capability: pgCore.PgColumn;
  ownerId: pgCore.PgColumn;
  label: pgCore.PgColumn;
  externalAccount: pgCore.PgColumn;
  version: pgCore.PgColumn;
  active: pgCore.PgColumn;
  model: pgCore.PgColumn;
  terms: pgCore.PgColumn;
  identityId: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sps_rc_identity_principal")
      .on(table.identityId)
      .where(
        sql`${table.variant} NOT IN ('provider-assignment', 'provider-default')`,
      ),
    pgCore
      .uniqueIndex("sps_rc_provider_assistant_capability")
      .on(table.storeId, table.subjectId, table.capability)
      .where(sql`${table.variant} = 'provider-assignment'`),
    pgCore
      .uniqueIndex("sps_rc_provider_default_capability")
      .on(table.storeId, table.capability)
      .where(sql`${table.variant} = 'provider-default'`),
    pgCore.check(
      "sps_rc_identity_connection_fields",
      sql`${table.variant} <> 'provider-connection' OR
      (${table.storeId} IS NOT NULL AND ${table.ownerId} IS NOT NULL AND ${table.label} IS NOT NULL AND ${table.externalAccount} IS NOT NULL AND ${table.version} IS NOT NULL AND ${table.active} IS NOT NULL)`,
    ),
    pgCore.check(
      "sps_rc_identity_assignment_fields",
      sql`${table.variant} NOT IN ('provider-assignment','provider-default') OR
      (${table.storeId} IS NOT NULL AND ${table.capability} IS NOT NULL AND ${table.model} IS NOT NULL AND ${table.terms} IS NOT NULL)`,
    ),
  ];
}
