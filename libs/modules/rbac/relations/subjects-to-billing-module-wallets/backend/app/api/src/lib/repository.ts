import "reflect-metadata";
import { and, eq, sql } from "drizzle-orm";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-billing-module-wallets/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async defaultWallet(subjectId: string) {
    await this.trackRead({
      and: [{ column: "subjectId", method: "eq", value: subjectId }],
    });
    const [owner] = await this.db
      .select()
      .from(Table)
      .where(and(eq(Table.subjectId, subjectId), eq(Table.variant, "default")));
    return owner?.billingModuleWalletId;
  }

  async ensureDefaultWallet(subjectId: string) {
    const [row] = await this.db.execute<{ walletId: string }>(
      sql`select sps_rc_default_billing_wallet(${subjectId}::uuid) AS "walletId"`,
    );
    return row.walletId;
  }
}
