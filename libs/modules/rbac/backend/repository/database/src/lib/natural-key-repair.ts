import type postgres from "postgres";
import { getPostgresClient } from "@sps/shared-backend-database-config";

export type NaturalKeyRepairMode = "check" | "apply";

export interface INaturalKeyRepairTableNames {
  permission: string;
  rolesToPermissions: string;
  subjectsToRoles: string;
}

export interface INaturalKeyDuplicateCounts {
  permissionGroups: number;
  permissionExtraRows: number;
  rolePermissionGroups: number;
  rolePermissionExtraRows: number;
  subjectRoleGroups: number;
  subjectRoleExtraRows: number;
  rolePermissionConditionConflicts: number;
}

export interface INaturalKeyRepairChanges {
  rolePermissionRowsDeleted: number;
  rolePermissionRowsRepointed: number;
  permissionRowsDeleted: number;
  subjectRoleRowsDeleted: number;
}

export interface INaturalKeyRepairResult {
  mode: NaturalKeyRepairMode;
  skipped: boolean;
  before: INaturalKeyDuplicateCounts;
  after: INaturalKeyDuplicateCounts;
  changes: INaturalKeyRepairChanges;
}

export interface INaturalKeyRepairProps {
  mode: NaturalKeyRepairMode;
  sql?: postgres.Sql;
  tables?: INaturalKeyRepairTableNames;
}

interface ITableAvailability {
  permission: boolean;
  rolesToPermissions: boolean;
  subjectsToRoles: boolean;
}

interface IInspectionRow {
  permission_groups: number | string;
  permission_extra_rows: number | string;
  role_permission_groups: number | string;
  role_permission_extra_rows: number | string;
  subject_role_groups: number | string;
  subject_role_extra_rows: number | string;
  role_permission_condition_conflicts: number | string;
}

interface IAppliedRepair {
  before: INaturalKeyDuplicateCounts;
  changes: INaturalKeyRepairChanges;
}

const defaultTables: INaturalKeyRepairTableNames = {
  permission: "sps_rc_permission",
  rolesToPermissions: "sps_rc_rs_to_ps_mz2",
  subjectsToRoles: "sps_rc_ss_to_rs_3nw",
};

const zeroCounts: INaturalKeyDuplicateCounts = {
  permissionGroups: 0,
  permissionExtraRows: 0,
  rolePermissionGroups: 0,
  rolePermissionExtraRows: 0,
  subjectRoleGroups: 0,
  subjectRoleExtraRows: 0,
  rolePermissionConditionConflicts: 0,
};

const zeroChanges: INaturalKeyRepairChanges = {
  rolePermissionRowsDeleted: 0,
  rolePermissionRowsRepointed: 0,
  permissionRowsDeleted: 0,
  subjectRoleRowsDeleted: 0,
};

function quoteIdentifier(identifier: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(
      `Validation error. Unsafe RBAC repair table identifier: ${identifier}`,
    );
  }

  return `"${identifier}"`;
}

function getQuotedTables(tables: INaturalKeyRepairTableNames) {
  return {
    permission: quoteIdentifier(tables.permission),
    rolesToPermissions: quoteIdentifier(tables.rolesToPermissions),
    subjectsToRoles: quoteIdentifier(tables.subjectsToRoles),
  };
}

async function getTableAvailability(
  sql: postgres.Sql,
  tables: INaturalKeyRepairTableNames,
): Promise<ITableAvailability> {
  const [row] = await sql<
    {
      permission: string | null;
      roles_to_permissions: string | null;
      subjects_to_roles: string | null;
    }[]
  >`
    SELECT
      to_regclass(${tables.permission})::text AS permission,
      to_regclass(${tables.rolesToPermissions})::text AS roles_to_permissions,
      to_regclass(${tables.subjectsToRoles})::text AS subjects_to_roles
  `;

  return {
    permission: Boolean(row?.permission),
    rolesToPermissions: Boolean(row?.roles_to_permissions),
    subjectsToRoles: Boolean(row?.subjects_to_roles),
  };
}

function assertConsistentTableAvailability(availability: ITableAvailability) {
  const states = Object.values(availability);
  const existingCount = states.filter(Boolean).length;

  if (existingCount > 0 && existingCount < states.length) {
    throw new Error(
      "Data integrity error. RBAC natural-key repair requires all three grant tables when any one of them already exists.",
    );
  }
}

function inspectionQuery(tables: INaturalKeyRepairTableNames) {
  const quoted = getQuotedTables(tables);

  return `
    WITH permission_canonical AS (
      SELECT
        id,
        FIRST_VALUE(id) OVER (
          PARTITION BY type, method, path
          ORDER BY created_at ASC, id ASC
        ) AS canonical_id
      FROM ${quoted.permission}
    ),
    permission_duplicate_groups AS (
      SELECT COUNT(*)::bigint AS row_count
      FROM ${quoted.permission}
      GROUP BY type, method, path
      HAVING COUNT(*) > 1
    ),
    normalized_role_permissions AS (
      SELECT
        relation.id,
        relation.re_id,
        permission_canonical.canonical_id AS pn_id,
        relation.condition
      FROM ${quoted.rolesToPermissions} relation
      INNER JOIN permission_canonical
        ON permission_canonical.id = relation.pn_id
    ),
    role_permission_duplicate_groups AS (
      SELECT COUNT(*)::bigint AS row_count
      FROM normalized_role_permissions
      GROUP BY re_id, pn_id
      HAVING COUNT(*) > 1
    ),
    role_permission_condition_conflicts AS (
      SELECT 1
      FROM normalized_role_permissions
      GROUP BY re_id, pn_id
      HAVING COUNT(DISTINCT ROW(condition IS NULL, condition)) > 1
    ),
    subject_role_duplicate_groups AS (
      SELECT COUNT(*)::bigint AS row_count
      FROM ${quoted.subjectsToRoles}
      GROUP BY st_id, re_id
      HAVING COUNT(*) > 1
    )
    SELECT
      (SELECT COUNT(*) FROM permission_duplicate_groups)::bigint
        AS permission_groups,
      COALESCE(
        (SELECT SUM(row_count - 1) FROM permission_duplicate_groups),
        0
      )::bigint AS permission_extra_rows,
      (SELECT COUNT(*) FROM role_permission_duplicate_groups)::bigint
        AS role_permission_groups,
      COALESCE(
        (SELECT SUM(row_count - 1) FROM role_permission_duplicate_groups),
        0
      )::bigint AS role_permission_extra_rows,
      (SELECT COUNT(*) FROM subject_role_duplicate_groups)::bigint
        AS subject_role_groups,
      COALESCE(
        (SELECT SUM(row_count - 1) FROM subject_role_duplicate_groups),
        0
      )::bigint AS subject_role_extra_rows,
      (SELECT COUNT(*) FROM role_permission_condition_conflicts)::bigint
        AS role_permission_condition_conflicts
  `;
}

async function inspectNaturalKeys(
  sql: postgres.Sql,
  tables: INaturalKeyRepairTableNames,
): Promise<INaturalKeyDuplicateCounts> {
  const [row] = await sql.unsafe<IInspectionRow[]>(inspectionQuery(tables));

  return {
    permissionGroups: Number(row?.permission_groups ?? 0),
    permissionExtraRows: Number(row?.permission_extra_rows ?? 0),
    rolePermissionGroups: Number(row?.role_permission_groups ?? 0),
    rolePermissionExtraRows: Number(row?.role_permission_extra_rows ?? 0),
    subjectRoleGroups: Number(row?.subject_role_groups ?? 0),
    subjectRoleExtraRows: Number(row?.subject_role_extra_rows ?? 0),
    rolePermissionConditionConflicts: Number(
      row?.role_permission_condition_conflicts ?? 0,
    ),
  };
}

function hasDuplicates(counts: INaturalKeyDuplicateCounts) {
  return (
    counts.permissionGroups > 0 ||
    counts.rolePermissionGroups > 0 ||
    counts.subjectRoleGroups > 0
  );
}

async function applyRepair(
  sql: postgres.TransactionSql,
  tables: INaturalKeyRepairTableNames,
): Promise<IAppliedRepair> {
  const quoted = getQuotedTables(tables);

  await sql.unsafe(
    `LOCK TABLE ${quoted.permission}, ${quoted.rolesToPermissions}, ${quoted.subjectsToRoles} IN SHARE ROW EXCLUSIVE MODE`,
  );

  const before = await inspectNaturalKeys(sql, tables);

  if (before.rolePermissionConditionConflicts > 0) {
    throw new Error(
      `Data integrity error. RBAC natural-key repair found ${before.rolePermissionConditionConflicts} role-permission groups with conflicting authorization conditions.`,
    );
  }

  const deletedRolePermissions = await sql.unsafe(`
    WITH permission_canonical AS (
      SELECT
        id,
        FIRST_VALUE(id) OVER (
          PARTITION BY type, method, path
          ORDER BY created_at ASC, id ASC
        ) AS canonical_id
      FROM ${quoted.permission}
    ),
    ranked AS (
      SELECT
        relation.id,
        ROW_NUMBER() OVER (
          PARTITION BY relation.re_id, permission_canonical.canonical_id
          ORDER BY relation.created_at ASC, relation.id ASC
        ) AS row_number
      FROM ${quoted.rolesToPermissions} relation
      INNER JOIN permission_canonical
        ON permission_canonical.id = relation.pn_id
    )
    DELETE FROM ${quoted.rolesToPermissions} relation
    USING ranked
    WHERE relation.id = ranked.id
      AND ranked.row_number > 1
    RETURNING relation.id
  `);

  const repointedRolePermissions = await sql.unsafe(`
    WITH permission_canonical AS (
      SELECT
        id,
        FIRST_VALUE(id) OVER (
          PARTITION BY type, method, path
          ORDER BY created_at ASC, id ASC
        ) AS canonical_id
      FROM ${quoted.permission}
    )
    UPDATE ${quoted.rolesToPermissions} relation
    SET
      pn_id = permission_canonical.canonical_id,
      updated_at = NOW()
    FROM permission_canonical
    WHERE relation.pn_id = permission_canonical.id
      AND permission_canonical.id <> permission_canonical.canonical_id
    RETURNING relation.id
  `);

  const deletedPermissions = await sql.unsafe(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY type, method, path
          ORDER BY created_at ASC, id ASC
        ) AS row_number
      FROM ${quoted.permission}
    )
    DELETE FROM ${quoted.permission} permission
    USING ranked
    WHERE permission.id = ranked.id
      AND ranked.row_number > 1
    RETURNING permission.id
  `);

  const deletedSubjectRoles = await sql.unsafe(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY st_id, re_id
          ORDER BY created_at ASC, id ASC
        ) AS row_number
      FROM ${quoted.subjectsToRoles}
    )
    DELETE FROM ${quoted.subjectsToRoles} relation
    USING ranked
    WHERE relation.id = ranked.id
      AND ranked.row_number > 1
    RETURNING relation.id
  `);

  return {
    before,
    changes: {
      rolePermissionRowsDeleted: deletedRolePermissions.count,
      rolePermissionRowsRepointed: repointedRolePermissions.count,
      permissionRowsDeleted: deletedPermissions.count,
      subjectRoleRowsDeleted: deletedSubjectRoles.count,
    },
  };
}

export async function repairRbacNaturalKeys(
  props: INaturalKeyRepairProps,
): Promise<INaturalKeyRepairResult> {
  const sql = props.sql ?? getPostgresClient();
  const tables = props.tables ?? defaultTables;
  const availability = await getTableAvailability(sql, tables);

  assertConsistentTableAvailability(availability);

  if (!availability.permission) {
    return {
      mode: props.mode,
      skipped: true,
      before: { ...zeroCounts },
      after: { ...zeroCounts },
      changes: { ...zeroChanges },
    };
  }

  if (props.mode === "check") {
    const before = await sql.begin(
      "isolation level repeatable read read only",
      async (transaction) => inspectNaturalKeys(transaction, tables),
    );

    return {
      mode: props.mode,
      skipped: false,
      before,
      after: before,
      changes: { ...zeroChanges },
    };
  }

  return sql.begin(async (transaction) => {
    const { before, changes } = await applyRepair(transaction, tables);
    const after = await inspectNaturalKeys(transaction, tables);

    if (hasDuplicates(after) || after.rolePermissionConditionConflicts > 0) {
      throw new Error(
        "Data integrity error. RBAC natural-key repair did not converge to unique grants.",
      );
    }

    return {
      mode: props.mode,
      skipped: false,
      before,
      after,
      changes,
    };
  });
}
