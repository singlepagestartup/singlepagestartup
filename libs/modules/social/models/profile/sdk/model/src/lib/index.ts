export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/social/models/profile/backend/repository/database";
export * from "./mcp-servers";
export * from "./plain-text";
export * from "./author";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/social/profiles";
export const variants = [
  "hidden",
  "author-card-default",
  "author-byline-default",
  "author-overview-default",

  "agent-id-ai-chat",
  "id-settings-ai-chat",

  "thread-list-sidebar-ai-chat",
  "default",
  "artificial-intelligence",
  "agent",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
