export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/rbac/models/widget/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/rbac/widgets";
export const variants = [
  "subject-me-crm-module-form-support-ai-chat",
  "subject-me-authentication-reset-password-ai-chat",
  "subject-me-authentication-forgot-password-ai-chat",
  "subject-me-authentication-registration-ai-chat",
  "subject-me-authentication-select-method-ai-chat",
  "subject-me-profile-settings",
  "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat",
  "subject-me-social-module-profile-id-settings-ai-chat",
  "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  "subject-me-social-module-profile-create-ai-chat",
  "default",
  "subject-authentication-email-and-password-forgot-password-form-default",
  "subject-authentication-select-method-default",
  "subject-authentication-email-and-password-registration-form-default",
  "subject-authentication-email-and-password-reset-password-form-default",
  "subject-overview-default",
  "subject-list-default",
  "subject-list-social-module-profile-default",
  "subject-identity-settings-default",
  "subject-authentication-logout-action-default",
  "subject-overview-ecommerce-module-product-list-default",
  "subject-overview-social-module-profile-overview-default",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
