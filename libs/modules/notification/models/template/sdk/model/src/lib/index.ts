export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/notification/models/template/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/notification/templates";
export const variants = [
  "default",
  "generate-email-ecommerce-order-status-changed-default",
  "generate-telegram-ecommerce-order-status-changed-default",
  "generate-telegram-ecommerce-order-status-changed-admin",
  "reset-password",
  "agent-result",
  "generate-email-crm-form-request-created-admin",
  "generate-telegram-crm-form-request-created-admin",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
