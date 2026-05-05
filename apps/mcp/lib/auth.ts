import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const McpAuthFieldsSchema = z
  .object({
    jwt: z.string().min(1).optional(),
    authorization: z.string().min(1).optional(),
    rbacSecretKey: z.string().min(1).optional(),
  })
  .optional();

export const McpAuthInputSchema = z
  .object({
    auth: McpAuthFieldsSchema,
  })
  .optional();

export type IMcpAuthInput = z.infer<typeof McpAuthInputSchema>;
export type IMcpRequestExtra = RequestHandlerExtra<
  ServerRequest,
  ServerNotification
>;

function firstHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeHeaderValue(value: string | string[] | undefined) {
  const firstValue = firstHeaderValue(value);

  return typeof firstValue === "string" && firstValue.trim()
    ? firstValue.trim()
    : undefined;
}

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  key: string,
) {
  const normalizedKey = key.toLowerCase();
  const foundKey = Object.keys(headers).find((headerKey) => {
    return headerKey.toLowerCase() === normalizedKey;
  });

  return foundKey ? normalizeHeaderValue(headers[foundKey]) : undefined;
}

function parseCookieHeader(cookieHeader?: string) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, item) => {
    const [rawKey, ...rawValue] = item.trim().split("=");
    const key = rawKey?.trim();

    if (!key) {
      return acc;
    }

    acc[key] = decodeURIComponent(rawValue.join("="));

    return acc;
  }, {});
}

function normalizeAuthorization(value?: string) {
  if (!value) {
    return;
  }

  return value.toLowerCase().startsWith("bearer ") ? value : `Bearer ${value}`;
}

function getMetaString(extra: IMcpRequestExtra | undefined, key: string) {
  const meta = extra?._meta as Record<string, unknown> | undefined;
  const value = meta?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getAuthInfoExtraString(
  extra: IMcpRequestExtra | undefined,
  key: string,
) {
  const value = extra?.authInfo?.extra?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getMcpAuthHeaders(
  extra?: IMcpRequestExtra,
  input?: IMcpAuthInput,
): Record<string, string> {
  const requestHeaders = extra?.requestInfo?.headers ?? {};
  const cookies = parseCookieHeader(getHeader(requestHeaders, "cookie"));
  const inputAuth = input?.auth;

  const rbacSecretKey =
    inputAuth?.rbacSecretKey ??
    getHeader(requestHeaders, "x-rbac-secret-key") ??
    cookies["rbac.secret-key"] ??
    getAuthInfoExtraString(extra, "x-rbac-secret-key") ??
    getAuthInfoExtraString(extra, "rbacSecretKey") ??
    getMetaString(extra, "x-rbac-secret-key") ??
    getMetaString(extra, "rbacSecretKey");

  const authorization =
    normalizeAuthorization(inputAuth?.authorization) ??
    normalizeAuthorization(inputAuth?.jwt) ??
    normalizeAuthorization(getHeader(requestHeaders, "authorization")) ??
    normalizeAuthorization(cookies["rbac.subject.jwt"]) ??
    normalizeAuthorization(extra?.authInfo?.token) ??
    normalizeAuthorization(getAuthInfoExtraString(extra, "jwt")) ??
    normalizeAuthorization(getAuthInfoExtraString(extra, "authorization")) ??
    normalizeAuthorization(getMetaString(extra, "jwt")) ??
    normalizeAuthorization(getMetaString(extra, "authorization"));

  if (rbacSecretKey) {
    return {
      "X-RBAC-SECRET-KEY": rbacSecretKey,
    };
  }

  if (authorization) {
    return {
      Authorization: authorization,
    };
  }

  throw new Error(
    "Authentication error. Provide Authorization: Bearer <jwt> or X-RBAC-SECRET-KEY via MCP request headers, cookies, auth info, _meta, or tool auth input",
  );
}
