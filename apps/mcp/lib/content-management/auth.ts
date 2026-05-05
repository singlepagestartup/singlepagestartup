import { IContentSdkOptions } from "./types";
export {
  getMcpAuthHeaders,
  McpAuthFieldsSchema,
  McpAuthInputSchema,
} from "../auth";

export function getMcpSdkOptions(
  headers: Record<string, string>,
): IContentSdkOptions {
  return {
    headers,
  };
}
