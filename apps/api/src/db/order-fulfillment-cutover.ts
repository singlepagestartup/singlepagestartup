import { createHash } from "node:crypto";
import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import {
  getDrizzle,
  getPostgresClient,
} from "@sps/shared-backend-database-config";
import { PrivateDirectory } from "@sps/providers-file-storage";

const db = getPostgresClient();

async function copyOrderHistory() {
  await db.begin(async (tx) => {
    const [tables] =
      await tx`SELECT to_regclass('public.sps_ee_order_work') AS work,
      to_regclass('public.sps_ee_orders_to_order_works') AS links`;
    if (!tables.work) {
      return;
    }
    await tx`LOCK TABLE sps_ee_order_work, sps_ee_order IN SHARE ROW EXCLUSIVE MODE`;
    if (tables.links) {
      await tx`LOCK TABLE sps_ee_orders_to_order_works IN SHARE ROW EXCLUSIVE MODE`;
      const [mismatch] =
        await tx`SELECT l.id FROM sps_ee_orders_to_order_works l
        LEFT JOIN sps_ee_order_work w ON w.id=l.order_work_id
        WHERE l.order_id IS DISTINCT FROM w.order_id LIMIT 1`;
      if (mismatch) {
        throw new Error("Conflicting order work relation " + mismatch.id);
      }
    }
    // The old work table had no FK to Order. Orphaned histories remain in the archive.
    const [conflict] =
      await tx`SELECT o.id FROM sps_ee_order o JOIN sps_ee_order_work w ON w.order_id=o.id
      WHERE o.fulfillment_work IS NOT NULL LIMIT 1`;
    if (conflict) {
      throw new Error("Order already has fulfillment history " + conflict.id);
    }
    await tx`UPDATE sps_ee_order o SET fulfillment_work =
      jsonb_build_object('id', w.id, 'orderId', w.order_id, 'storeId', w.store_id,
        'createdAt', w.created_at AT TIME ZONE 'UTC', 'updatedAt', w.updated_at AT TIME ZONE 'UTC',
        'customerId', w.customer_id, 'taskId', w.task_id, 'kind', w.kind, 'state', w.state,
        'versions', w.versions, 'decisions', w.decisions, 'acceptedVersionId', w.accepted_version_id,
        'paid', w.paid, 'expertArchive', to_jsonb(w)->'expert_archive', 'deliveredAt', w.delivered_at AT TIME ZONE 'UTC',
        'receiptFileId', w.receipt_file_id, 'resultFileId', w.result_file_id,
        'paidDispatchedAt', w.paid_dispatched_at AT TIME ZONE 'UTC', 'fulfillment', w.fulfillment)
      FROM sps_ee_order_work w WHERE w.order_id=o.id`;
    if (tables.links) {
      await tx`ALTER TABLE sps_ee_orders_to_order_works RENAME TO archived_sps_ee_orders_to_order_works`;
    }
    await tx`ALTER TABLE sps_ee_order_work RENAME TO archived_sps_ee_order_work`;
  });
}

async function preparePrivateFiles() {
  // The receipt relation's original generated FK references this table on fresh installs.
  // Replay the original generated migrations, leaving their journal intact.
  await migrate(getDrizzle({}), {
    migrationsTable: "sps_fs_private_file",
    migrationsFolder: path.resolve(
      __dirname,
      "../../../../libs/modules/ecommerce/relations/orders-to-file-storage-module-files/backend/repository/database/src/lib/legacy-private-file",
    ),
  });
  const directory = new PrivateDirectory();
  await db.begin(async (tx) => {
    const [source] =
      await tx`SELECT to_regclass('public.sps_fs_private_file') AS present`;
    if (!source.present) {
      return;
    }
    await tx`LOCK TABLE sps_fs_private_file IN SHARE MODE`;
    // Read one bytea at a time to bound memory even with the largest permitted uploads.
    let lastId: string | null = null;
    do {
      const [row] =
        await tx`SELECT id, name, created_at, mime_type, size, digest, bytes, legacy_origin_id
        FROM sps_fs_private_file WHERE (${lastId}::uuid IS NULL OR id > ${lastId}::uuid) ORDER BY id LIMIT 1`;
      if (!row) {
        return;
      }
      lastId = row.id;
      const bytes = Buffer.from(row.bytes);
      const digest = createHash("sha256").update(bytes).digest("hex");
      if (row.digest !== digest || bytes.length !== row.size) {
        throw new Error(
          "Legacy private file failed checksum verification " + row.id,
        );
      }
      await directory.write(row.id, bytes, digest);
      await directory.read(row.id, digest, row.size);
      await tx`INSERT INTO sps_f_s_file (id, file, admin_title, created_at, updated_at, mime_type, size, private_digest, legacy_origin_id, slug)
        SELECT id, 'private:' || id, name, created_at, created_at, mime_type, size, digest, legacy_origin_id, 'private-' || id
        FROM sps_fs_private_file WHERE id=${row.id}
        ON CONFLICT (id) DO NOTHING`;
      const [verified] =
        await tx`SELECT id FROM sps_f_s_file WHERE id=${row.id} AND private_digest=${digest}
        AND size=${row.size} AND file=${"private:" + row.id} AND admin_title=${row.name}
        AND mime_type=${row.mime_type} AND legacy_origin_id IS NOT DISTINCT FROM ${row.legacy_origin_id}`;
      if (!verified) {
        throw new Error(
          "Existing File metadata conflicts with private file " + row.id,
        );
      }
    } while (lastId);
  });
}

async function retirePrivateFiles() {
  await db.begin(async (tx) => {
    const [source] =
      await tx`SELECT to_regclass('public.sps_fs_private_file') AS present`;
    if (!source.present) {
      return;
    }
    await tx`LOCK TABLE sps_fs_private_file IN ACCESS EXCLUSIVE MODE`;
    const [missing] =
      await tx`SELECT p.id FROM sps_fs_private_file p LEFT JOIN sps_f_s_file f ON f.id=p.id
      WHERE f.private_digest IS DISTINCT FROM p.digest OR f.size IS DISTINCT FROM p.size LIMIT 1`;
    if (missing) {
      throw new Error("Unmigrated private file " + missing.id);
    }
    await tx`ALTER TABLE sps_fs_private_file RENAME TO archived_sps_fs_private_file`;
  });
}

try {
  switch (process.argv[2]) {
    case "orders":
      await copyOrderHistory();
      break;
    case "files":
      await preparePrivateFiles();
      break;
    case "retire-files":
      await retirePrivateFiles();
      break;
    default:
      throw new Error("Expected orders, files, or retire-files");
  }
} finally {
  await db.end();
}
