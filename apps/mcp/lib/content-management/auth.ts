import { IContentSdkOptions } from "./types";
export {
  getMcpAuthHeaders,
  MCP_CONTENT_DELETE_SCOPE,
  MCP_CONTENT_SCOPE,
} from "../auth";

export function getMcpSdkOptions(
  headers: Record<string, string>,
): IContentSdkOptions {
  return {
    headers,
  };
}
