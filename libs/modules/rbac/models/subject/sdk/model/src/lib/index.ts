export {
  articleCreateSchema,
  type IArticleCreateInput,
  type IArticleCreateResult,
} from "./blog-article-create";
export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/rbac/models/subject/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/rbac/subjects";
export const variants = [
  "hidden",
  "me-account",
  "me-blog-module-article-create-default",

  "me-social-module-profile-id-sidebar-ai-chat",
  "me-authentication-email-and-password-reset-password-form-ai-chat",
  "me-authentication-email-and-password-forgot-password-form-ai-chat",
  "me-authentication-email-and-password-registration-form-ai-chat",
  "me-authentication-email-and-password-authentication-form-ai-chat",
  "me-social-module-profile-select-ai-chat",
  "me-social-module-profile-id-update-ai-chat",
  "me-social-module-profile-id-avatar-update-ai-chat",
  "me-identity-id-settings-ai-chat",
  "me-social-module-profile-list-settings-ai-chat",
  "me-identity-list-settings-ai-chat",

  "me-social-module-profile-id-chat-id-thread-id-message-list-ai-chat",
  "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat",
  "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-id-update-ai-chat",
  "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat",
  "me-social-module-profile-id-chat-id-thread-id-download-ai-chat",
  "me-social-module-profile-id-navigation-ai-chat",
  "me-social-module-profile-list-ai-chat",

  "me-crm-module-form-support-ai-chat",
  "me-ecommerce-module-order-list-ai-chat",
  "me-account-ai-chat",
  "me-profile-settings-ai-chat",
  "me-social-module-profile-id-chat-id-thread-create-ai-chat",
  "me-social-module-profile-id-settings-ai-chat",
  "me-social-module-profile-id-chat-id-thread-id-ai-chat",
  "me-social-module-profile-create-ai-chat",
  "default",
  "agent",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
export * from "./ai-reaction-request";
export * from "./ai-execution-action";
export * from "./ai-thread-preferences";
export * from "./ai-thread-context";
export * from "./ai-chat-document-proposal";
export * from "./telegram-personal-ai-agent";

export {
  getAIChatDocument,
  projectHref,
  projectBaseHref,
  type IAIChatDocument,
  type IAIChatProject,
} from "./ai-chat-project";
