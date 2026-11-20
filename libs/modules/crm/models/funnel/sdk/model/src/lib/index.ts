export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/crm/models/funnel/backend/repository/database";

export const route = "/api/crm/funnels";

export * from "./workflow";
