import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { Table as Action } from "@sps/social/models/action/backend/repository/database";
import { Table as ProfileAction } from "@sps/social/relations/profiles-to-actions/backend/repository/database";
import {
  DatabaseRepository,
  trackRepositoryRead,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/threads-to-actions/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  withTypingAction<T>(
    threadId: string,
    profileId: string,
    operation: (action: typeof Action.$inferSelect | null) => Promise<T>,
  ) {
    return withConsistencyTransaction(this.db, async () => {
      await this.db.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${"social.typing:" + threadId}), hashtext(${profileId}))`,
      );
      await trackRepositoryRead(Table, this.db, {
        and: [{ column: "threadId", method: "eq", value: threadId }],
      });
      await trackRepositoryRead(ProfileAction, this.db, {
        and: [{ column: "profileId", method: "eq", value: profileId }],
      });
      await trackRepositoryRead(Action, this.db, {
        and: [{ column: "variant", method: "eq", value: "typing" }],
      });
      const [action] = await this.db
        .select(getTableColumns(Action))
        .from(Action)
        .innerJoin(Table, eq(Table.actionId, Action.id))
        .innerJoin(ProfileAction, eq(ProfileAction.actionId, Action.id))
        .where(
          and(
            eq(Action.variant, "typing"),
            eq(Table.threadId, threadId),
            eq(ProfileAction.profileId, profileId),
          ),
        )
        .limit(1);
      return operation(action ?? null);
    });
  }
}
