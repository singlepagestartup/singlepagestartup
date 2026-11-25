import "../../env";
import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  getDrizzle,
  getPostgresClient,
} from "@sps/shared-backend-database-config";
import { Table as Invoice } from "@sps/billing/models/invoice/backend/repository/database";
import { Table as Intent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as OrderFile } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/repository/database";

const money = z.string().regex(/^-?\d+(\.\d+)?$/);
const payment = z.object({ id: z.uuid(), status: z.string(), amount: money });
const snapshot = z.object({
  version: z.literal(1),
  database: z.string(),
  wallets: z.array(
    z.object({ subjectId: z.uuid(), currencyId: z.uuid(), amount: money }),
  ),
  invoices: z.array(payment),
  paymentIntents: z.array(payment),
  stores: z.array(z.object({ id: z.uuid() })),
  receiptLinks: z.array(z.object({ orderId: z.uuid(), fileId: z.uuid() })),
});

async function readSnapshot() {
  return getDrizzle({}).transaction(
    async (tx) => {
      const [database] = await tx.execute<{ name: string }>(
        sql`select current_database() as name`,
      );
      // Read only columns already present on installations that predate work attempts.
      const [view] = await tx.execute(
        sql`SELECT to_regclass('public.sps_rc_subject_wallet_balance') IS NOT NULL AS installed`,
      );
      const table = view.installed
        ? "sps_rc_subject_wallet_balance"
        : "sps_rc_ss_to_bg_me_cs_vvd";
      const wallets = [
        ...(await tx.execute(sql`SELECT st_id AS "subjectId", bg_me_cy_id AS "currencyId",
        trim_scale(sum(amount::numeric))::text AS amount FROM ${sql.identifier(table)}
        GROUP BY st_id, bg_me_cy_id ORDER BY st_id, bg_me_cy_id`)),
      ];
      const invoices = await tx
        .select({
          id: Invoice.id,
          status: Invoice.status,
          amount: sql<string>`trim_scale(${Invoice.amount})::text`,
        })
        .from(Invoice)
        .orderBy(Invoice.id);
      const paymentIntents = await tx
        .select({
          id: Intent.id,
          status: Intent.status,
          amount: sql<string>`trim_scale(${Intent.amount})::text`,
        })
        .from(Intent)
        .orderBy(Intent.id);
      const stores = await tx
        .select({ id: Store.id })
        .from(Store)
        .orderBy(Store.id);
      const receiptLinks = await tx
        .select({
          orderId: OrderFile.orderId,
          fileId: OrderFile.fileStorageModuleFileId,
        })
        .from(OrderFile)
        .where(eq(OrderFile.variant, "receipt-default"))
        .orderBy(OrderFile.orderId, OrderFile.fileStorageModuleFileId);
      return snapshot.parse({
        version: 1,
        database: database.name,
        wallets,
        invoices,
        paymentIntents,
        stores,
        receiptLinks,
      });
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

async function main() {
  const [mode, file, ...extra] = process.argv.slice(2);
  if (
    (mode !== "prepare" && mode !== "verify") ||
    !file ||
    !isAbsolute(file) ||
    extra.length
  ) {
    throw new Error(
      "Usage: bun src/db/wallet-cutover.ts prepare|verify /absolute/private-manifest.json",
    );
  }
  const current = await readSnapshot();
  if (mode === "prepare") {
    await writeFile(file, JSON.stringify(current), { mode: 0o600, flag: "wx" });
    console.log(
      `Captured ${current.wallets.length} wallets, ${current.invoices.length} invoices, ${current.paymentIntents.length} payment intents, ${current.stores.length} stores and ${current.receiptLinks.length} linked receipts.`,
    );
    return;
  }
  const before = snapshot.parse(JSON.parse(await readFile(file, "utf8")));
  if (before.database !== current.database) {
    throw new Error("This snapshot belongs to a different database.");
  }
  let differences = 0;
  for (const group of [
    "wallets",
    "invoices",
    "paymentIntents",
    "stores",
    "receiptLinks",
  ] as const) {
    if (JSON.stringify(before[group]) !== JSON.stringify(current[group])) {
      differences++;
      console.error(
        `Review ${group} before reopening traffic. Saved rows: ${before[group].length}, current rows: ${current[group].length}.`,
      );
    }
  }
  if (differences) {
    process.exitCode = 1;
  } else {
    console.log(
      "Opening balances, payments, stores and linked receipts match the saved snapshot.",
    );
  }
}

try {
  await main();
} finally {
  await getPostgresClient().end();
}
