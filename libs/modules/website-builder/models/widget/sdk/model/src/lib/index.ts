export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/website-builder/models/widget/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/website-builder/widgets";
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
export const variants = [
  "content-ai-chat-authentication",
  "content-ai-chat-help",
  "content-ai-chat-materials-processing",
  "content-ai-chat-profile-create",
  "landing-ai-chat",
  "footer-ai-chat",
  "navbar-ai-chat",
  "default",
  "content-default",
  "footer-default",
  "navbar-default",
] as const;
