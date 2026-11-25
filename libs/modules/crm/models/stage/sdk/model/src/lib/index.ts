export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/crm/models/stage/backend/repository/database";

export const route = "/api/crm/stages";

export * from "./workflow";
