export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/ecommerce/models/order-work/backend/repository/database";

export const route = "/api/ecommerce/order-works";

export * from "./work";
