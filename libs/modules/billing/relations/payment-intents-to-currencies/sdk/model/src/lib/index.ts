export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/billing/relations/payment-intents-to-currencies/backend/repository/database";
import { BACKEND_URL, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/billing/payment-intents-to-currencies";
export const variants = ["default"] as const;
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
};
