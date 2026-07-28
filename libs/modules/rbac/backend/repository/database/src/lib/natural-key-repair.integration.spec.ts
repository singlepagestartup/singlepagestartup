/**
 * BDD Suite: RBAC natural-key data repair.
 *
 * Given: production-shaped permission and grant tables contain concurrent duplicates.
 * When: the module repair checks or applies its transaction.
 * Then: canonical grants are preserved, conflicts fail closed, and reruns are idempotent.
 */

import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import {
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import {
  repairRbacNaturalKeys,
  type INaturalKeyRepairTableNames,
} from "./natural-key-repair";

interface ITestContext {
  sql: postgres.Sql;
  tables: INaturalKeyRepairTableNames;
}

function createTableNames(): INaturalKeyRepairTableNames {
  const suffix = randomUUID().replaceAll("-", "");

  return {
    permission: `test_rbac_permission_${suffix}`,
    rolesToPermissions: `test_rbac_role_permission_${suffix}`,
    subjectsToRoles: `test_rbac_subject_role_${suffix}`,
  };
}

function quoteIdentifier(identifier: string) {
  return `"${identifier}"`;
}

async function createTestContext(): Promise<ITestContext> {
  const sql = getPostgresClient();
  const tables = createTableNames();

  await sql.unsafe(`
    CREATE TABLE ${quoteIdentifier(tables.permission)} (
      id uuid PRIMARY KEY,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL,
      type text NOT NULL,
      method text NOT NULL,
      path text NOT NULL
    )
  `);
  await sql.unsafe(`
    CREATE TABLE ${quoteIdentifier(tables.rolesToPermissions)} (
      id uuid PRIMARY KEY,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL,
      re_id uuid NOT NULL,
      pn_id uuid NOT NULL,
      condition text
    )
  `);
  await sql.unsafe(`
    CREATE TABLE ${quoteIdentifier(tables.subjectsToRoles)} (
      id uuid PRIMARY KEY,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL,
      st_id uuid NOT NULL,
      re_id uuid NOT NULL
    )
  `);

  return { sql, tables };
}

async function destroyTestContext(context: ITestContext) {
  await context.sql.unsafe(
    `DROP TABLE IF EXISTS ${quoteIdentifier(context.tables.subjectsToRoles)}`,
  );
  await context.sql.unsafe(
    `DROP TABLE IF EXISTS ${quoteIdentifier(context.tables.rolesToPermissions)}`,
  );
  await context.sql.unsafe(
    `DROP TABLE IF EXISTS ${quoteIdentifier(context.tables.permission)}`,
  );
}

async function insertDuplicateGrant(
  context: ITestContext,
  props?: { conflictingCondition?: boolean },
) {
  const permission = quoteIdentifier(context.tables.permission);
  const rolesToPermissions = quoteIdentifier(context.tables.rolesToPermissions);
  const subjectsToRoles = quoteIdentifier(context.tables.subjectsToRoles);

  await context.sql.unsafe(`
    INSERT INTO ${permission}
      (id, created_at, updated_at, type, method, path)
    VALUES
      ('00000000-0000-0000-0000-000000000001', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', 'HTTP', 'GET', '/knowledge'),
      ('00000000-0000-0000-0000-000000000002', '2026-01-01T00:00:01Z', '2026-01-01T00:00:01Z', 'HTTP', 'GET', '/knowledge')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${rolesToPermissions}
      (id, created_at, updated_at, re_id, pn_id, condition)
    VALUES
      (
        '00000000-0000-0000-0000-000000000011',
        '2026-01-01T00:00:00Z',
        '2026-01-01T00:00:00Z',
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000002',
        NULL
      ),
      (
        '00000000-0000-0000-0000-000000000012',
        '2026-01-01T00:00:01Z',
        '2026-01-01T00:00:01Z',
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000001',
        ${props?.conflictingCondition ? "'owner = true'" : "NULL"}
      )
  `);
  await context.sql.unsafe(`
    INSERT INTO ${subjectsToRoles}
      (id, created_at, updated_at, st_id, re_id)
    VALUES
      (
        '00000000-0000-0000-0000-000000000031',
        '2026-01-01T00:00:00Z',
        '2026-01-01T00:00:00Z',
        '00000000-0000-0000-0000-000000000041',
        '00000000-0000-0000-0000-000000000021'
      ),
      (
        '00000000-0000-0000-0000-000000000032',
        '2026-01-01T00:00:01Z',
        '2026-01-01T00:00:01Z',
        '00000000-0000-0000-0000-000000000041',
        '00000000-0000-0000-0000-000000000021'
      )
  `);
}

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

describe("Given: duplicate RBAC natural keys with equivalent grant semantics", () => {
  /**
   * BDD Scenario: checked, applied, and repeated repair.
   *
   * Given: two permissions and relations describe one logical grant.
   * When: repair is checked, applied, and applied again.
   * Then: check is read-only, the earliest rows become canonical, and rerun changes nothing.
   */
  it("When: repair runs Then: converges transactionally and idempotently", async () => {
    const context = await createTestContext();

    try {
      await insertDuplicateGrant(context);

      const checked = await repairRbacNaturalKeys({
        mode: "check",
        sql: context.sql,
        tables: context.tables,
      });

      expect(checked.before).toEqual({
        permissionGroups: 1,
        permissionExtraRows: 1,
        rolePermissionGroups: 1,
        rolePermissionExtraRows: 1,
        subjectRoleGroups: 1,
        subjectRoleExtraRows: 1,
        rolePermissionConditionConflicts: 0,
      });
      expect(checked.changes).toEqual({
        rolePermissionRowsDeleted: 0,
        rolePermissionRowsRepointed: 0,
        permissionRowsDeleted: 0,
        subjectRoleRowsDeleted: 0,
      });

      const applied = await repairRbacNaturalKeys({
        mode: "apply",
        sql: context.sql,
        tables: context.tables,
      });

      expect(applied.after).toEqual({
        permissionGroups: 0,
        permissionExtraRows: 0,
        rolePermissionGroups: 0,
        rolePermissionExtraRows: 0,
        subjectRoleGroups: 0,
        subjectRoleExtraRows: 0,
        rolePermissionConditionConflicts: 0,
      });
      expect(applied.changes).toEqual({
        rolePermissionRowsDeleted: 1,
        rolePermissionRowsRepointed: 1,
        permissionRowsDeleted: 1,
        subjectRoleRowsDeleted: 1,
      });

      const [permission] = await context.sql.unsafe<{ id: string }[]>(
        `SELECT id FROM ${quoteIdentifier(context.tables.permission)}`,
      );
      const [rolePermission] = await context.sql.unsafe<
        { id: string; pn_id: string }[]
      >(
        `SELECT id, pn_id FROM ${quoteIdentifier(context.tables.rolesToPermissions)}`,
      );

      expect(permission.id).toBe("00000000-0000-0000-0000-000000000001");
      expect(rolePermission).toEqual({
        id: "00000000-0000-0000-0000-000000000011",
        pn_id: "00000000-0000-0000-0000-000000000001",
      });

      const repeated = await repairRbacNaturalKeys({
        mode: "apply",
        sql: context.sql,
        tables: context.tables,
      });

      expect(repeated.changes).toEqual({
        rolePermissionRowsDeleted: 0,
        rolePermissionRowsRepointed: 0,
        permissionRowsDeleted: 0,
        subjectRoleRowsDeleted: 0,
      });
    } finally {
      await destroyTestContext(context);
    }
  });
});

describe("Given: duplicate role-permission links with conflicting conditions", () => {
  /**
   * BDD Scenario: semantic conflict rollback.
   *
   * Given: duplicate links would grant different authorization conditions.
   * When: repair attempts to choose one canonical link.
   * Then: it rejects the group and preserves every row.
   */
  it("When: repair detects conflicting conditions Then: rolls back without data loss", async () => {
    const context = await createTestContext();

    try {
      await insertDuplicateGrant(context, { conflictingCondition: true });

      await expect(
        repairRbacNaturalKeys({
          mode: "apply",
          sql: context.sql,
          tables: context.tables,
        }),
      ).rejects.toThrow("conflicting authorization conditions");

      const [counts] = await context.sql.unsafe<
        {
          permissions: number;
          role_permissions: number;
          subject_roles: number;
        }[]
      >(`
        SELECT
          (SELECT COUNT(*) FROM ${quoteIdentifier(context.tables.permission)})::int AS permissions,
          (SELECT COUNT(*) FROM ${quoteIdentifier(context.tables.rolesToPermissions)})::int AS role_permissions,
          (SELECT COUNT(*) FROM ${quoteIdentifier(context.tables.subjectsToRoles)})::int AS subject_roles
      `);

      expect(counts).toEqual({
        permissions: 2,
        role_permissions: 2,
        subject_roles: 2,
      });
    } finally {
      await destroyTestContext(context);
    }
  });
});
