export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/crm/models/task/backend/repository/database";

export const route = "/api/crm/tasks";

export * from "./workflow";
