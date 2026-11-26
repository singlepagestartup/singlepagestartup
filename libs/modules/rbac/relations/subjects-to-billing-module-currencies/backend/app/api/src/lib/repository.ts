import "reflect-metadata";
import { and, eq, sql } from "drizzle-orm";
import { injectFromBase, injectable } from "inversify";
import { Table as Balance } from "@sps/billing/relations/wallets-to-currencies/backend/repository/database";
import { Table as Owner } from "@sps/rbac/relations/subjects-to-billing-module-wallets/backend/repository/database";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  protected override async trackRead(
    filters?: Parameters<typeof trackRepositoryRead>[2],
  ) {
    const id = filters?.and?.find((filter) => filter.column === "id");
    const subject = filters?.and?.find(
      (filter) => filter.column === "subjectId",
    );
    await trackRepositoryRead(
      Owner,
      this.db,
      subject ? { and: [subject] } : undefined,
    );
    await trackRepositoryRead(Balance, this.db, id ? { and: [id] } : undefined);
  }

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
}
