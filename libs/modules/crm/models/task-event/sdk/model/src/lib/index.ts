export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/crm/models/task-event/backend/repository/database";

export const route = "/api/crm/task-events";

export * from "./workflow";
