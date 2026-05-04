import { IContentSdkOptions } from "./types";

export function getRbacHeaders(): Record<string, string> {
  const secretKey = process.env.RBAC_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
  }

  return {
    "X-RBAC-SECRET-KEY": secretKey,
  };
}

export function getRbacSdkOptions(): IContentSdkOptions {
  return {
    headers: getRbacHeaders(),
  };
}
