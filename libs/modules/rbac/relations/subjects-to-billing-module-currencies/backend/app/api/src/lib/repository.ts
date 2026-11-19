import "reflect-metadata";
import { and, asc, eq, sql } from "drizzle-orm";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async total(subjectId: string, currencyId: string) {
    const [row] = await this.db
      .select({
        amount: sql<string>`coalesce(sum(${Table.amount}::numeric), 0)::text`,
      })
      .from(Table)
      .where(
        and(
          eq(Table.subjectId, subjectId),
          eq(Table.billingModuleCurrencyId, currencyId),
        ),
      );
    return row.amount;
  }

  // Caller holds the logical subject/currency lock, including on first use.
  async applyDelta(subjectId: string, currencyId: string, delta: string) {
    const [row] = await this.db
      .select({ id: Table.id })
      .from(Table)
      .where(
        and(
          eq(Table.subjectId, subjectId),
          eq(Table.billingModuleCurrencyId, currencyId),
        ),
      )
      .orderBy(asc(Table.id))
      .limit(1)
      .for("update");
    if (!row) {
      await this.db
        .insert(Table)
        .values({
          subjectId,
          billingModuleCurrencyId: currencyId,
          amount: delta,
        });
      return;
    }
    await this.db
      .update(Table)
      .set({
        amount: sql`(${Table.amount}::numeric + ${delta}::numeric)::text`,
        updatedAt: new Date(),
      })
      .where(eq(Table.id, row.id));
  }
}
