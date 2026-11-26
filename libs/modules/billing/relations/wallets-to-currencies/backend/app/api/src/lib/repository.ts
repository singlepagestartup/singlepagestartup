import "reflect-metadata";
import { and, asc, eq, sql } from "drizzle-orm";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/relations/wallets-to-currencies/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async total(walletId: string, currencyId: string) {
    await this.trackRead({
      and: [{ column: "walletId", method: "eq", value: walletId }],
    });
    const [row] = await this.db
      .select({
        amount: sql<string>`trim_scale(coalesce(sum(${Table.amount}), 0))::text`,
      })
      .from(Table)
      .where(
        and(eq(Table.walletId, walletId), eq(Table.currencyId, currencyId)),
      );
    return row.amount;
  }

  // Caller holds the logical wallet/currency lock, including on first use.
  async applyDelta(walletId: string, currencyId: string, delta: string) {
    const [row] = await this.db
      .select({ id: Table.id })
      .from(Table)
      .where(
        and(eq(Table.walletId, walletId), eq(Table.currencyId, currencyId)),
      )
      .orderBy(asc(Table.id))
      .limit(1)
      .for("update");
    if (!row) {
      await this.db.insert(Table).values({
        walletId,
        currencyId,
        amount: delta,
      });
      return;
    }
    await this.db
      .update(Table)
      .set({
        amount: sql`${Table.amount} + ${delta}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(Table.id, row.id));
  }
}
