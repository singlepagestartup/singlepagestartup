import { sql, eq } from "drizzle-orm";
import "reflect-metadata";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  withConsistencyDatabase,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-roles/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  withSubjectGrantTransaction<T>(
    subjectId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    return this.db.transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${subjectId}`}))`,
        );
        await trackRepositoryRead(Table, tx, {
          and: [{ column: "subjectId", method: "eq", value: subjectId }],
        });
        await tx
          .select({ id: Table.id })
          .from(Table)
          .where(eq(Table.subjectId, subjectId))
          .for("update");
        return operation();
      }),
    );
  }
}
