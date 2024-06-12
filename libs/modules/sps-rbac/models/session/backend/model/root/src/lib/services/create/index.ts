import { db } from "@sps/sps-rbac-backend-db";
import {
  insertSchema,
  Table,
} from "@sps/sps-rbac-models-session-backend-schema";

export async function service(props: { data: typeof Table.$inferInsert }) {
  const { data } = props;

  const plainData = insertSchema.parse(data);

  const [entity] = await db.insert(Table).values(plainData).returning();

  return entity;
}
