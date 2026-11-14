import type postgres from "postgres";
import type { ICaptureResource } from "./catalog";

export {
  readCaptureCatalog,
  readCaptureResource,
  assertCaptureTable,
  type ICaptureResource,
} from "./catalog";

interface ICaptureStatus {
  resource: string;
  registered: boolean;
  rowArgs: Buffer | null;
  hasTruncate: boolean;
  uuidColumns: string[];
}

function hasCurrentTriggers(row: ICaptureStatus) {
  if (!row.registered || !row.rowArgs || !row.hasTruncate) {
    return false;
  }
  // pg_trigger stores the capture function's JSON argument as a null-terminated string.
  // PostgreSQL can return UUID columns in a different order after ALTER TABLE.
  try {
    const argument = row.rowArgs.subarray(0, -1).toString("utf8");
    const columns: unknown = JSON.parse(argument);
    if (!Array.isArray(columns) || columns.length !== row.uuidColumns.length) {
      return false;
    }
    const captured = new Set(columns);
    return row.uuidColumns.every((column) => captured.has(column));
  } catch {
    return false;
  }
}

export async function findMissingCapture(
  sql: postgres.Sql | postgres.TransactionSql,
  catalog: ICaptureResource[],
  options: { includeRegistered?: boolean } = {},
) {
  const statuses = await sql<ICaptureStatus[]>`
    WITH declared AS (
      SELECT * FROM jsonb_to_recordset(${JSON.stringify(catalog)}::text::jsonb)
        AS d(resource text, topic text, columns jsonb)
    ), required AS (
      SELECT * FROM declared
      UNION ALL
      SELECT r.resource, r.topic, r.columns FROM sps_consistency.resource r
      WHERE ${options.includeRegistered === true} AND to_regclass(r.resource) IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM declared WHERE resource = r.resource)
    )
    SELECT d.resource, (
        r.topic = d.topic AND r.columns = d.columns AND NOT EXISTS (
          SELECT 1 FROM jsonb_each_text(d.columns) c
          WHERE NOT EXISTS (
            SELECT 1 FROM pg_attribute a WHERE a.attrelid = to_regclass(d.resource)
              AND a.attname = c.value AND a.attnum > 0 AND NOT a.attisdropped
          )
        )
      ) IS TRUE AS registered,
      rows.tgargs AS "rowArgs", trunc.oid IS NOT NULL AS "hasTruncate",
      ARRAY(
        SELECT attname::text FROM pg_attribute WHERE attrelid = to_regclass(d.resource)
          AND atttypid = 'uuid'::regtype AND attnum > 0 AND NOT attisdropped
      ) AS "uuidColumns"
    FROM required d
    LEFT JOIN sps_consistency.resource r USING (resource)
    -- pg_trigger.tgtype 29 is AFTER INSERT/UPDATE/DELETE FOR EACH ROW.
    LEFT JOIN pg_trigger rows ON rows.tgrelid = to_regclass(d.resource)
      AND rows.tgname = 'sps_consistency_rows' AND rows.tgtype = 29 AND rows.tgnargs = 1
      AND rows.tgenabled IN ('O','A') AND rows.tgfoid = to_regprocedure('sps_consistency.capture()')
    -- Type 32 is AFTER TRUNCATE FOR EACH STATEMENT.
    LEFT JOIN pg_trigger trunc ON trunc.tgrelid = to_regclass(d.resource)
      AND trunc.tgname = 'sps_consistency_truncate' AND trunc.tgtype = 32
      AND trunc.tgenabled IN ('O','A') AND trunc.tgfoid = to_regprocedure('sps_consistency.capture()')
    ORDER BY d.resource
  `;
  return statuses.filter((row) => !hasCurrentTriggers(row));
}

export async function reconcileCapture(
  sql: postgres.Sql,
  entry: ICaptureResource,
  revision: string,
) {
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${entry.resource}, 0))`;
    const missing = await findMissingCapture(tx, [entry]);
    if (missing.length) {
      await tx`SELECT sps_consistency.install_capture(${entry.resource},${entry.topic},${JSON.stringify(entry.columns)}::text::jsonb)`;
    }
    // A retry after Drizzle committed DDL must still invalidate reads of the old schema.
    const revisionChanged = await tx`
      INSERT INTO sps_consistency.state(id,value) VALUES(${"migration:" + entry.resource},${revision})
      ON CONFLICT (id) DO UPDATE SET value = excluded.value
      WHERE sps_consistency.state.value IS DISTINCT FROM excluded.value
      RETURNING id
    `;
    if (missing.length || revisionChanged.length) {
      await tx`SELECT sps_consistency.bump(ARRAY[${entry.resource + "|reset"}]::text[])`;
    }
  });
}
