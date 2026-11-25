export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/crm/relations/tasks-to-stages/backend/repository/database";

export const route = "/api/crm/tasks-to-stages";

export * from "./workflow";
