import { IContentSdkOptions } from "./types";
export { getMcpAuthHeaders } from "../auth";

export function getMcpSdkOptions(
  headers: Record<string, string>,
): IContentSdkOptions {
  return {
    headers,
  };
}
