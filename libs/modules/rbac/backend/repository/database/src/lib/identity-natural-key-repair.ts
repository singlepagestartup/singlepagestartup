import type postgres from "postgres";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import type { NaturalKeyRepairMode } from "./natural-key-repair";

export interface IIdentityNaturalKeyCounts {
  identityGroups: number;
  identityExtraRows: number;
  identityLinkGroups: number;
  identityLinkExtraRows: number;
}

export interface IIdentityNaturalKeyChanges {
  identityRowsDeleted: number;
  identityLinksDeleted: number;
  identityLinksRepointed: number;
}

export interface IIdentityNaturalKeyGroupDiagnostic {
  provider: string;
  canonicalIdentityId: string;
  retainedLinkId: string | null;
  retainedSubjectId: string | null;
  duplicateIdentityIds: string[];
  deletedLinkIds: string[];
  detachedSubjectIds: string[];
}

export interface IIdentityOwnershipDiagnostic {
  identityId: string;
  retainedLinkId: string;
  retainedSubjectId: string;
  deletedLinkIds: string[];
  detachedSubjectIds: string[];
}

export interface IIdentityNaturalKeyDiagnostics {
  identityGroups: IIdentityNaturalKeyGroupDiagnostic[];
  identityOwnership: IIdentityOwnershipDiagnostic[];
}

export interface IIdentityNaturalKeyRepairResult {
  mode: NaturalKeyRepairMode;
  skipped: boolean;
  before: IIdentityNaturalKeyCounts;
  after: IIdentityNaturalKeyCounts;
  changes: IIdentityNaturalKeyChanges;
  diagnostics: IIdentityNaturalKeyDiagnostics;
}

interface IInspectionRow {
  identity_groups: number | string;
  identity_extra_rows: number | string;
  identity_link_groups: number | string;
  identity_link_extra_rows: number | string;
}

interface IDuplicateIdentityRow {
  canonical_id: string;
  id: string;
  natural_key: string;
  provider: string;
}

interface IDuplicateIdentityLinkRow extends IDuplicateIdentityRow {
  link_id: string;
  row_number: number | string;
  subject_id: string;
}

interface IDuplicateOwnershipRow {
  identity_id: string;
  link_id: string;
  row_number: number | string;
  subject_id: string;
}

const zeroCounts: IIdentityNaturalKeyCounts = {
  identityGroups: 0,
  identityExtraRows: 0,
  identityLinkGroups: 0,
  identityLinkExtraRows: 0,
};

const zeroChanges: IIdentityNaturalKeyChanges = {
  identityRowsDeleted: 0,
  identityLinksDeleted: 0,
  identityLinksRepointed: 0,
};

const zeroDiagnostics: IIdentityNaturalKeyDiagnostics = {
  identityGroups: [],
  identityOwnership: [],
};

export interface IIdentityNaturalKeyRepairTables {
  identity: string;
  subjectsToIdentities: string;
}

const defaultTables: IIdentityNaturalKeyRepairTables = {
  identity: "sps_rc_identity",
  subjectsToIdentities: "sps_rc_ss_to_is_h58",
};

async function tablesExist(
  sql: postgres.Sql,
  tables: IIdentityNaturalKeyRepairTables,
) {
  const [row] = await sql<
    { identity: string | null; subject_identity: string | null }[]
  >`
    SELECT
      to_regclass(${tables.identity})::text AS identity,
      to_regclass(${tables.subjectsToIdentities})::text AS subject_identity
  `;

  const availability = [Boolean(row?.identity), Boolean(row?.subject_identity)];

  if (availability.some(Boolean) && !availability.every(Boolean)) {
    throw new Error(
      "Data integrity error. Identity natural-key repair requires both identity tables when either one exists.",
    );
  }

  return availability.every(Boolean);
}

function inspectionQuery(tables: IIdentityNaturalKeyRepairTables) {
  return `
    WITH natural_identities AS (
      SELECT
        id,
        provider,
        CASE
          WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
            THEN account
          WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
            THEN lower(account)
          WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
            THEN lower(email)
          ELSE NULL
        END AS natural_key
      FROM "${tables.identity}"
    ),
    identity_duplicate_groups AS (
      SELECT COUNT(*)::bigint AS row_count
      FROM natural_identities
      WHERE natural_key IS NOT NULL
      GROUP BY provider, natural_key
      HAVING COUNT(*) > 1
    ),
    identity_link_duplicate_groups AS (
      SELECT COUNT(*)::bigint AS row_count
      FROM "${tables.subjectsToIdentities}"
      GROUP BY iy_id
      HAVING COUNT(*) > 1
    )
    SELECT
      (SELECT COUNT(*) FROM identity_duplicate_groups)::bigint
        AS identity_groups,
      COALESCE(
        (SELECT SUM(row_count - 1) FROM identity_duplicate_groups),
        0
      )::bigint AS identity_extra_rows,
      (SELECT COUNT(*) FROM identity_link_duplicate_groups)::bigint
        AS identity_link_groups,
      COALESCE(
        (SELECT SUM(row_count - 1) FROM identity_link_duplicate_groups),
        0
      )::bigint AS identity_link_extra_rows
  `;
}

async function inspect(
  sql: postgres.Sql,
  tables: IIdentityNaturalKeyRepairTables,
): Promise<IIdentityNaturalKeyCounts> {
  const [row] = await sql.unsafe<IInspectionRow[]>(inspectionQuery(tables));

  return {
    identityGroups: Number(row?.identity_groups ?? 0),
    identityExtraRows: Number(row?.identity_extra_rows ?? 0),
    identityLinkGroups: Number(row?.identity_link_groups ?? 0),
    identityLinkExtraRows: Number(row?.identity_link_extra_rows ?? 0),
  };
}

async function inspectDiagnostics(
  sql: postgres.Sql,
  tables: IIdentityNaturalKeyRepairTables,
): Promise<IIdentityNaturalKeyDiagnostics> {
  const identities = await sql.unsafe<IDuplicateIdentityRow[]>(`
    WITH natural_identities AS (
      SELECT
        id,
        provider,
        CASE
          WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
            THEN account
          WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
            THEN lower(account)
          WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
            THEN lower(email)
          ELSE NULL
        END AS natural_key,
        FIRST_VALUE(id) OVER (
          PARTITION BY provider,
            CASE
              WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
                THEN account
              WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
                THEN lower(account)
              WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
                THEN lower(email)
              ELSE NULL
            END
          ORDER BY created_at DESC, id DESC
        ) AS canonical_id,
        COUNT(*) OVER (
          PARTITION BY provider,
            CASE
              WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
                THEN account
              WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
                THEN lower(account)
              WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
                THEN lower(email)
              ELSE NULL
            END
        ) AS group_count
      FROM "${tables.identity}"
    )
    SELECT id, provider, natural_key, canonical_id
    FROM natural_identities
    WHERE natural_key IS NOT NULL AND group_count > 1
    ORDER BY provider, natural_key, id
  `);

  const groupLinks = await sql.unsafe<IDuplicateIdentityLinkRow[]>(`
    WITH natural_identities AS (
      SELECT
        id,
        provider,
        CASE
          WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
            THEN account
          WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
            THEN lower(account)
          WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
            THEN lower(email)
          ELSE NULL
        END AS natural_key,
        FIRST_VALUE(id) OVER (
          PARTITION BY provider,
            CASE
              WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
                THEN account
              WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
                THEN lower(account)
              WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
                THEN lower(email)
              ELSE NULL
            END
          ORDER BY created_at DESC, id DESC
        ) AS canonical_id,
        COUNT(*) OVER (
          PARTITION BY provider,
            CASE
              WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
                THEN account
              WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
                THEN lower(account)
              WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
                THEN lower(email)
              ELSE NULL
            END
        ) AS group_count
      FROM "${tables.identity}"
    ),
    ranked_links AS (
      SELECT
        identity.id,
        identity.provider,
        identity.natural_key,
        identity.canonical_id,
        relation.id AS link_id,
        relation.st_id AS subject_id,
        ROW_NUMBER() OVER (
          PARTITION BY identity.provider, identity.natural_key
          ORDER BY
            (relation.iy_id = identity.canonical_id) DESC,
            relation.created_at DESC,
            relation.id DESC
        ) AS row_number
      FROM "${tables.subjectsToIdentities}" relation
      INNER JOIN natural_identities identity ON identity.id = relation.iy_id
      WHERE identity.natural_key IS NOT NULL AND identity.group_count > 1
    )
    SELECT
      id,
      provider,
      natural_key,
      canonical_id,
      link_id,
      subject_id,
      row_number
    FROM ranked_links
    ORDER BY provider, natural_key, row_number
  `);

  const ownershipRows = await sql.unsafe<IDuplicateOwnershipRow[]>(`
    WITH ranked AS (
      SELECT
        iy_id AS identity_id,
        id AS link_id,
        st_id AS subject_id,
        COUNT(*) OVER (PARTITION BY iy_id) AS link_count,
        ROW_NUMBER() OVER (
          PARTITION BY iy_id
          ORDER BY created_at DESC, id DESC
        ) AS row_number
      FROM "${tables.subjectsToIdentities}"
    )
    SELECT identity_id, link_id, subject_id, row_number
    FROM ranked
    WHERE link_count > 1
    ORDER BY identity_id, row_number
  `);

  const groupMap = new Map<string, IIdentityNaturalKeyGroupDiagnostic>();

  for (const identity of identities) {
    const key = `${identity.provider}\u0000${identity.natural_key}`;
    const diagnostic = groupMap.get(key) ?? {
      provider: identity.provider,
      canonicalIdentityId: identity.canonical_id,
      retainedLinkId: null,
      retainedSubjectId: null,
      duplicateIdentityIds: [],
      deletedLinkIds: [],
      detachedSubjectIds: [],
    };

    if (identity.id !== identity.canonical_id) {
      diagnostic.duplicateIdentityIds.push(identity.id);
    }

    groupMap.set(key, diagnostic);
  }

  for (const link of groupLinks) {
    const diagnostic = groupMap.get(
      `${link.provider}\u0000${link.natural_key}`,
    );

    if (!diagnostic) {
      continue;
    }

    if (Number(link.row_number) === 1) {
      diagnostic.retainedLinkId = link.link_id;
      diagnostic.retainedSubjectId = link.subject_id;
    } else {
      diagnostic.deletedLinkIds.push(link.link_id);
      diagnostic.detachedSubjectIds.push(link.subject_id);
    }
  }

  const ownershipMap = new Map<string, IIdentityOwnershipDiagnostic>();

  for (const row of ownershipRows) {
    const diagnostic = ownershipMap.get(row.identity_id) ?? {
      identityId: row.identity_id,
      retainedLinkId: row.link_id,
      retainedSubjectId: row.subject_id,
      deletedLinkIds: [],
      detachedSubjectIds: [],
    };

    if (Number(row.row_number) === 1) {
      diagnostic.retainedLinkId = row.link_id;
      diagnostic.retainedSubjectId = row.subject_id;
    } else {
      diagnostic.deletedLinkIds.push(row.link_id);
      diagnostic.detachedSubjectIds.push(row.subject_id);
    }

    ownershipMap.set(row.identity_id, diagnostic);
  }

  return {
    identityGroups: [...groupMap.values()],
    identityOwnership: [...ownershipMap.values()],
  };
}

async function apply(
  sql: postgres.TransactionSql,
  tables: IIdentityNaturalKeyRepairTables,
) {
  await sql.unsafe(
    `LOCK TABLE "${tables.identity}", "${tables.subjectsToIdentities}" IN SHARE ROW EXCLUSIVE MODE`,
  );

  const deletedGroupLinks = await sql.unsafe(`
    WITH natural_identities AS (
      SELECT
        id,
        provider,
        CASE
          WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
            THEN account
          WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
            THEN lower(account)
          WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
            THEN lower(email)
          ELSE NULL
        END AS natural_key,
        FIRST_VALUE(id) OVER (
          PARTITION BY provider,
            CASE
              WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
                THEN account
              WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
                THEN lower(account)
              WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
                THEN lower(email)
              ELSE NULL
            END
          ORDER BY created_at DESC, id DESC
        ) AS canonical_id
      FROM "${tables.identity}"
    ),
    ranked_links AS (
      SELECT
        relation.id,
        ROW_NUMBER() OVER (
          PARTITION BY identity.provider, identity.natural_key
          ORDER BY
            (relation.iy_id = identity.canonical_id) DESC,
            relation.created_at DESC,
            relation.id DESC
        ) AS row_number
      FROM "${tables.subjectsToIdentities}" relation
      INNER JOIN natural_identities identity ON identity.id = relation.iy_id
      WHERE identity.natural_key IS NOT NULL
    )
    DELETE FROM "${tables.subjectsToIdentities}" relation
    USING ranked_links
    WHERE relation.id = ranked_links.id
      AND ranked_links.row_number > 1
    RETURNING relation.id
  `);

  const repointedLinks = await sql.unsafe(`
    WITH natural_identities AS (
      SELECT
        id,
        provider,
        CASE
          WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
            THEN account
          WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
            THEN lower(account)
          WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
            THEN lower(email)
          ELSE NULL
        END AS natural_key,
        FIRST_VALUE(id) OVER (
          PARTITION BY provider,
            CASE
              WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
                THEN account
              WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
                THEN lower(account)
              WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
                THEN lower(email)
              ELSE NULL
            END
          ORDER BY created_at DESC, id DESC
        ) AS canonical_id
      FROM "${tables.identity}"
    )
    UPDATE "${tables.subjectsToIdentities}" relation
    SET iy_id = identity.canonical_id, updated_at = NOW()
    FROM natural_identities identity
    WHERE relation.iy_id = identity.id
      AND identity.natural_key IS NOT NULL
      AND identity.id <> identity.canonical_id
    RETURNING relation.id
  `);

  const deletedIdentities = await sql.unsafe(`
    WITH ranked AS (
      SELECT
        id,
        CASE
          WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
            THEN account
          WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
            THEN lower(account)
          WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
            THEN lower(email)
          ELSE NULL
        END AS natural_key,
        ROW_NUMBER() OVER (
          PARTITION BY provider,
            CASE
              WHEN provider IN ('telegram', 'oauth_google') AND account IS NOT NULL
                THEN account
              WHEN provider = 'ethereum_virtual_machine' AND account IS NOT NULL
                THEN lower(account)
              WHEN provider IN ('email', 'email_and_password') AND email IS NOT NULL
                THEN lower(email)
              ELSE NULL
            END
          ORDER BY created_at DESC, id DESC
        ) AS row_number
      FROM "${tables.identity}"
    )
    DELETE FROM "${tables.identity}" identity
    USING ranked
    WHERE identity.id = ranked.id
      AND ranked.natural_key IS NOT NULL
      AND ranked.row_number > 1
    RETURNING identity.id
  `);

  const deletedRemainingLinks = await sql.unsafe(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY iy_id
          ORDER BY created_at DESC, id DESC
        ) AS row_number
      FROM "${tables.subjectsToIdentities}"
    )
    DELETE FROM "${tables.subjectsToIdentities}" relation
    USING ranked
    WHERE relation.id = ranked.id
      AND ranked.row_number > 1
    RETURNING relation.id
  `);

  return {
    identityRowsDeleted: deletedIdentities.count,
    identityLinksDeleted: deletedGroupLinks.count + deletedRemainingLinks.count,
    identityLinksRepointed: repointedLinks.count,
  };
}

export async function repairIdentityNaturalKeys(props: {
  mode: NaturalKeyRepairMode;
  sql?: postgres.Sql;
  tables?: IIdentityNaturalKeyRepairTables;
}): Promise<IIdentityNaturalKeyRepairResult> {
  const sql = props.sql ?? getPostgresClient();
  const tables = props.tables ?? defaultTables;

  if (!(await tablesExist(sql, tables))) {
    return {
      mode: props.mode,
      skipped: true,
      before: { ...zeroCounts },
      after: { ...zeroCounts },
      changes: { ...zeroChanges },
      diagnostics: { ...zeroDiagnostics },
    };
  }

  if (props.mode === "check") {
    const checked = await sql.begin(
      "isolation level repeatable read read only",
      async (transaction) => ({
        before: await inspect(transaction, tables),
        diagnostics: await inspectDiagnostics(transaction, tables),
      }),
    );

    return {
      mode: props.mode,
      skipped: false,
      before: checked.before,
      after: checked.before,
      changes: { ...zeroChanges },
      diagnostics: checked.diagnostics,
    };
  }

  return sql.begin(async (transaction) => {
    const before = await inspect(transaction, tables);
    const diagnostics = await inspectDiagnostics(transaction, tables);
    const changes = await apply(transaction, tables);
    const after = await inspect(transaction, tables);

    if (
      after.identityGroups ||
      after.identityExtraRows ||
      after.identityLinkGroups ||
      after.identityLinkExtraRows
    ) {
      throw new Error(
        "Data integrity error. Identity natural-key repair did not converge.",
      );
    }

    return {
      mode: props.mode,
      skipped: false,
      before,
      after,
      changes,
      diagnostics,
    };
  });
}
