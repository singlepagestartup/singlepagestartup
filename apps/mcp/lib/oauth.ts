import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import Redis from "ioredis";
import jwt, { type JwtPayload } from "jsonwebtoken";

const DEFAULT_AUTH_CODE_TTL_SECONDS = 5 * 60;
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_SCOPE = "mcp:content";
export const INTERNAL_RBAC_SUBJECT_CLIENT_ID = "internal-rbac-subject";
const INTERNAL_RBAC_SUBJECT_ACCESS_TOKEN_TTL_SECONDS = 5 * 60;
export const INTERNAL_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH =
  "/internal/rbac-subject-token-exchange";
const PROTECTED_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource";
const AUTHORIZATION_SERVER_METADATA_PATH =
  "/.well-known/oauth-authorization-server";

type IOAuthClient = {
  clientId: string;
  clientSecret?: string;
  clientName?: string;
  redirectUris: string[];
  createdAt: number;
};

type IOAuthCode = {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  resource?: string;
  scope: string;
  rbacSubjectId: string;
  rbacSubjectAuthenticationJwt: string;
  createdAt: number;
};

type IAccessTokenRecord = {
  jti: string;
  clientId: string;
  rbacSubjectId: string;
  scope: string;
  rbacSubjectAuthenticationJwt: string;
  expiresAt: number;
};

type IRefreshTokenRecord = {
  token: string;
  clientId: string;
  rbacSubjectId: string;
  scope: string;
  rbacSubjectAuthenticationJwt: string;
  createdAt: number;
};

export type IMcpVerifiedToken = {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt: number;
  rbacSubjectId: string;
  rbacSubjectAuthenticationJwt: string;
};

export type IInternalRbacSubjectTokenExchangeResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
};

type IAccessTokenIssueProps = {
  clientId: string;
  rbacSubjectId: string;
  scope: string;
  rbacSubjectAuthenticationJwt: string;
  ttlSeconds: number;
};

class InternalTokenExchangeError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

interface IOAuthStore {
  getClient(clientId: string): Promise<IOAuthClient | undefined>;
  saveClient(client: IOAuthClient): Promise<void>;
  getCode(code: string): Promise<IOAuthCode | undefined>;
  saveCode(code: IOAuthCode, ttlSeconds: number): Promise<void>;
  deleteCode(code: string): Promise<void>;
  getAccessToken(jti: string): Promise<IAccessTokenRecord | undefined>;
  saveAccessToken(
    record: IAccessTokenRecord,
    ttlSeconds: number,
  ): Promise<void>;
  deleteAccessToken(jti: string): Promise<void>;
  getRefreshToken(token: string): Promise<IRefreshTokenRecord | undefined>;
  saveRefreshToken(
    record: IRefreshTokenRecord,
    ttlSeconds: number,
  ): Promise<void>;
  deleteRefreshToken(token: string): Promise<void>;
}

class MemoryOAuthStore implements IOAuthStore {
  private clients = new Map<string, IOAuthClient>();
  private codes = new Map<string, { value: IOAuthCode; expiresAt: number }>();
  private accessTokens = new Map<
    string,
    { value: IAccessTokenRecord; expiresAt: number }
  >();
  private refreshTokens = new Map<
    string,
    { value: IRefreshTokenRecord; expiresAt: number }
  >();

  async getClient(clientId: string) {
    return this.clients.get(clientId);
  }

  async saveClient(client: IOAuthClient) {
    this.clients.set(client.clientId, client);
  }

  async getCode(code: string) {
    return getUnexpired(this.codes, code);
  }

  async saveCode(code: IOAuthCode, ttlSeconds: number) {
    this.codes.set(code.code, withTtl(code, ttlSeconds));
  }

  async deleteCode(code: string) {
    this.codes.delete(code);
  }

  async getAccessToken(jti: string) {
    return getUnexpired(this.accessTokens, jti);
  }

  async saveAccessToken(record: IAccessTokenRecord, ttlSeconds: number) {
    this.accessTokens.set(record.jti, withTtl(record, ttlSeconds));
  }

  async deleteAccessToken(jti: string) {
    this.accessTokens.delete(jti);
  }

  async getRefreshToken(token: string) {
    return getUnexpired(this.refreshTokens, token);
  }

  async saveRefreshToken(record: IRefreshTokenRecord, ttlSeconds: number) {
    this.refreshTokens.set(record.token, withTtl(record, ttlSeconds));
  }

  async deleteRefreshToken(token: string) {
    this.refreshTokens.delete(token);
  }
}

class RedisOAuthStore implements IOAuthStore {
  constructor(private readonly redis: Redis) {}

  async getClient(clientId: string) {
    return getJson<IOAuthClient>(this.redis, key("client", clientId));
  }

  async saveClient(client: IOAuthClient) {
    await this.redis.set(
      key("client", client.clientId),
      JSON.stringify(client),
    );
  }

  async getCode(code: string) {
    return getJson<IOAuthCode>(this.redis, key("code", code));
  }

  async saveCode(code: IOAuthCode, ttlSeconds: number) {
    await this.redis.set(
      key("code", code.code),
      JSON.stringify(code),
      "EX",
      ttlSeconds,
    );
  }

  async deleteCode(code: string) {
    await this.redis.del(key("code", code));
  }

  async getAccessToken(jti: string) {
    return getJson<IAccessTokenRecord>(this.redis, key("access", jti));
  }

  async saveAccessToken(record: IAccessTokenRecord, ttlSeconds: number) {
    await this.redis.set(
      key("access", record.jti),
      JSON.stringify(record),
      "EX",
      ttlSeconds,
    );
  }

  async deleteAccessToken(jti: string) {
    await this.redis.del(key("access", jti));
  }

  async getRefreshToken(token: string) {
    return getJson<IRefreshTokenRecord>(this.redis, key("refresh", token));
  }

  async saveRefreshToken(record: IRefreshTokenRecord, ttlSeconds: number) {
    await this.redis.set(
      key("refresh", record.token),
      JSON.stringify(record),
      "EX",
      ttlSeconds,
    );
  }

  async deleteRefreshToken(token: string) {
    await this.redis.del(key("refresh", token));
  }
}

let store: IOAuthStore | undefined;

export function getMcpPublicBaseUrl() {
  return (
    process.env["MCP_SERVICE_PUBLIC_BASE_URL"] ||
    process.env["MCP_SERVICE_PUBLIC_URL"]?.replace(/\/mcp\/?$/, "") ||
    "http://127.0.0.1:3001"
  ).replace(/\/$/, "");
}

export function getMcpPublicUrl() {
  return (
    process.env["MCP_SERVICE_PUBLIC_URL"] || `${getMcpPublicBaseUrl()}/mcp`
  ).replace(/\/$/, "");
}

export function getAuthorizationServerMetadata() {
  const issuer = getMcpPublicBaseUrl();

  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: [DEFAULT_SCOPE],
  };
}

export function getProtectedResourceMetadata() {
  const resource = getMcpPublicUrl();

  return {
    resource,
    authorization_servers: [getMcpPublicBaseUrl()],
    bearer_methods_supported: ["header"],
    scopes_supported: [DEFAULT_SCOPE],
    resource_name: "SinglePageStartup MCP",
  };
}

export async function handleOAuthRequest(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
) {
  try {
    if (isProtectedResourceMetadataRoute(url.pathname)) {
      return sendJson(res, 200, getProtectedResourceMetadata());
    }

    if (isAuthorizationServerMetadataRoute(url.pathname)) {
      return sendJson(res, 200, getAuthorizationServerMetadata());
    }

    if (url.pathname === "/oauth/register") {
      return handleRegister(req, res);
    }

    if (url.pathname === "/oauth/authorize") {
      return handleAuthorize(req, res, url);
    }

    if (url.pathname === "/oauth/token") {
      return handleToken(req, res);
    }

    if (url.pathname === "/oauth/revoke") {
      return handleRevoke(req, res);
    }

    sendJson(res, 404, { error: "not_found" });
  } catch (error) {
    sendJson(res, 500, {
      error: "server_error",
      error_description: getErrorMessage(error),
    });
  }
}

export function isInternalRbacSubjectTokenExchangeRoute(pathname: string) {
  return pathname === INTERNAL_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH;
}

export async function handleInternalRbacSubjectTokenExchange(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  try {
    const body = await readJsonBody(req);

    if (!isRecord(body)) {
      throw new InternalTokenExchangeError(
        400,
        "invalid_request",
        "Request body must be a JSON object",
      );
    }

    const response = await exchangeRbacSubjectAuthenticationJwtForMcpToken({
      providedSecret: getHeader(req, "x-mcp-internal-token-exchange-secret"),
      body,
    });

    return sendJson(res, 200, response);
  } catch (error) {
    if (error instanceof InternalTokenExchangeError) {
      return sendJson(res, error.status, {
        error: error.code,
        error_description: error.message,
      });
    }

    if (error instanceof SyntaxError) {
      return sendJson(res, 400, {
        error: "invalid_request",
        error_description: "Request body must be valid JSON",
      });
    }

    return sendJson(res, 500, { error: "server_error" });
  }
}

export async function exchangeRbacSubjectAuthenticationJwtForMcpToken(props: {
  providedSecret?: string;
  body: Record<string, unknown>;
}): Promise<IInternalRbacSubjectTokenExchangeResponse> {
  assertInternalTokenExchangeSecret(props.providedSecret);
  assertNoSubjectOverride(props.body);

  const rbacSubjectAuthenticationJwt = props.body["subject_token"];

  if (
    typeof rbacSubjectAuthenticationJwt !== "string" ||
    !rbacSubjectAuthenticationJwt
  ) {
    throw new InternalTokenExchangeError(
      400,
      "invalid_request",
      "subject_token is required",
    );
  }

  let rbacSubjectId: string;

  try {
    rbacSubjectId = getVerifiedRbacSubjectIdFromAuthenticationJwt(
      rbacSubjectAuthenticationJwt,
    );
  } catch {
    throw new InternalTokenExchangeError(
      401,
      "invalid_subject_token",
      "subject_token is invalid or expired",
    );
  }

  const issued = await issueAccessToken({
    clientId: INTERNAL_RBAC_SUBJECT_CLIENT_ID,
    rbacSubjectId,
    scope: DEFAULT_SCOPE,
    rbacSubjectAuthenticationJwt,
    ttlSeconds: INTERNAL_RBAC_SUBJECT_ACCESS_TOKEN_TTL_SECONDS,
  });

  return {
    access_token: issued.accessToken,
    token_type: "Bearer",
    expires_in: issued.expiresIn,
    scope: DEFAULT_SCOPE,
  };
}

export function isOAuthRoute(pathname: string) {
  return (
    isProtectedResourceMetadataRoute(pathname) ||
    isAuthorizationServerMetadataRoute(pathname) ||
    pathname.startsWith("/oauth/")
  );
}

export async function verifyMcpAccessToken(
  accessToken: string,
): Promise<IMcpVerifiedToken> {
  const payload = verifyJwt(accessToken);
  const publicUrl = getMcpPublicUrl();

  if (payload.aud !== publicUrl) {
    throw new Error("Invalid token audience");
  }

  if (typeof payload.jti !== "string" || !payload.jti) {
    throw new Error("Token does not include jti");
  }

  const record = await getOAuthStore().getAccessToken(payload.jti);

  if (!record) {
    throw new Error("Token is expired or revoked");
  }

  return {
    token: accessToken,
    clientId: record.clientId,
    scopes: record.scope.split(" ").filter(Boolean),
    expiresAt: record.expiresAt,
    rbacSubjectId: record.rbacSubjectId,
    rbacSubjectAuthenticationJwt: record.rbacSubjectAuthenticationJwt,
  };
}

export function getWwwAuthenticateHeader() {
  const metadataUrl = `${getMcpPublicBaseUrl()}${PROTECTED_RESOURCE_METADATA_PATH}${getMcpWellKnownPathSuffix()}`;

  return `Bearer resource_metadata="${metadataUrl}"`;
}

export function createPkceChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function isProtectedResourceMetadataRoute(pathname: string) {
  return isWellKnownMetadataRoute(pathname, PROTECTED_RESOURCE_METADATA_PATH);
}

function isAuthorizationServerMetadataRoute(pathname: string) {
  return isWellKnownMetadataRoute(pathname, AUTHORIZATION_SERVER_METADATA_PATH);
}

function isWellKnownMetadataRoute(pathname: string, basePath: string) {
  const resourcePath = `${basePath}${getMcpWellKnownPathSuffix()}`;

  return (
    pathname === basePath ||
    pathname === `${basePath}/` ||
    pathname === resourcePath ||
    pathname === `${resourcePath}/`
  );
}

function getMcpWellKnownPathSuffix() {
  const pathname = new URL(getMcpPublicUrl()).pathname.replace(/\/$/, "");

  if (!pathname || pathname === "/") {
    return "";
  }

  return pathname;
}

async function handleRegister(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const body = await readJsonBody(req);
  const redirectUris = Array.isArray(body["redirect_uris"])
    ? body["redirect_uris"].filter((uri) => typeof uri === "string")
    : [];

  if (!redirectUris.length) {
    return sendJson(res, 400, {
      error: "invalid_redirect_uri",
      error_description: "redirect_uris must include at least one URI",
    });
  }

  const tokenEndpointAuthMethod =
    body["token_endpoint_auth_method"] === "client_secret_post"
      ? "client_secret_post"
      : "none";
  const clientSecret =
    tokenEndpointAuthMethod === "client_secret_post"
      ? randomSecret()
      : undefined;
  const client: IOAuthClient = {
    clientId: `mcp_client_${randomUUID()}`,
    ...(clientSecret ? { clientSecret } : {}),
    clientName:
      typeof body["client_name"] === "string" ? body["client_name"] : undefined,
    redirectUris,
    createdAt: nowSeconds(),
  };

  await getOAuthStore().saveClient(client);

  return sendJson(res, 201, {
    client_id: client.clientId,
    ...(client.clientSecret ? { client_secret: client.clientSecret } : {}),
    client_id_issued_at: client.createdAt,
    redirect_uris: client.redirectUris,
    token_endpoint_auth_method: tokenEndpointAuthMethod,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: DEFAULT_SCOPE,
  });
}

async function handleAuthorize(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
) {
  if (req.method === "GET") {
    return renderAuthorizePage(res, Object.fromEntries(url.searchParams));
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const body = await readFormBody(req);
  const params = Object.fromEntries(body);

  try {
    const request = await validateAuthorizeParams(params);
    const credentials = await authenticateRbacSubject(
      String(params["email"] || ""),
      String(params["password"] || ""),
    );
    const rbacSubjectId = getRbacSubjectIdFromAuthenticationJwt(
      credentials.rbacSubjectAuthenticationJwt,
    );
    const code = randomSecret();

    await getOAuthStore().saveCode(
      {
        code,
        clientId: request.client.clientId,
        redirectUri: request.redirectUri,
        codeChallenge: request.codeChallenge,
        codeChallengeMethod: "S256",
        resource: request.resource,
        scope: request.scope,
        rbacSubjectId,
        rbacSubjectAuthenticationJwt: credentials.rbacSubjectAuthenticationJwt,
        createdAt: nowSeconds(),
      },
      getAuthCodeTtlSeconds(),
    );

    const redirectUrl = new URL(request.redirectUri);
    redirectUrl.searchParams.set("code", code);

    if (request.state) {
      redirectUrl.searchParams.set("state", request.state);
    }

    res.statusCode = 302;
    res.setHeader("Location", redirectUrl.toString());
    res.end();
  } catch (error) {
    return renderAuthorizePage(res, params, getErrorMessage(error));
  }
}

async function handleToken(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const body = await readFormBody(req);
  const grantType = String(body.get("grant_type") || "");

  if (grantType === "authorization_code") {
    return exchangeAuthorizationCode(body, res);
  }

  if (grantType === "refresh_token") {
    return exchangeRefreshToken(body, res);
  }

  return sendJson(res, 400, { error: "unsupported_grant_type" });
}

async function handleRevoke(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const body = await readFormBody(req);
  const token = String(body.get("token") || "");

  if (token) {
    const decoded = jwt.decode(token);

    if (isJwtPayload(decoded) && typeof decoded.jti === "string") {
      await getOAuthStore().deleteAccessToken(decoded.jti);
    }

    await getOAuthStore().deleteRefreshToken(token);
  }

  return sendEmpty(res, 200);
}

async function exchangeAuthorizationCode(
  body: URLSearchParams,
  res: ServerResponse,
) {
  const code = String(body.get("code") || "");
  const clientId = String(body.get("client_id") || "");
  const clientSecret = optionalString(body.get("client_secret"));
  const redirectUri = String(body.get("redirect_uri") || "");
  const codeVerifier = String(body.get("code_verifier") || "");
  const storedCode = await getOAuthStore().getCode(code);

  if (!storedCode) {
    return sendJson(res, 400, { error: "invalid_grant" });
  }

  await getOAuthStore().deleteCode(code);

  const client = await getOAuthStore().getClient(storedCode.clientId);

  if (
    !client ||
    client.clientId !== clientId ||
    client.redirectUris.includes(redirectUri) === false ||
    redirectUri !== storedCode.redirectUri ||
    !clientSecretIsValid(client, clientSecret)
  ) {
    return sendJson(res, 400, { error: "invalid_client" });
  }

  if (createPkceChallenge(codeVerifier) !== storedCode.codeChallenge) {
    return sendJson(res, 400, { error: "invalid_grant" });
  }

  return issueTokenResponse(res, {
    clientId,
    rbacSubjectId: storedCode.rbacSubjectId,
    scope: storedCode.scope,
    rbacSubjectAuthenticationJwt: storedCode.rbacSubjectAuthenticationJwt,
  });
}

async function exchangeRefreshToken(
  body: URLSearchParams,
  res: ServerResponse,
) {
  const refreshToken = String(body.get("refresh_token") || "");
  const clientId = String(body.get("client_id") || "");
  const clientSecret = optionalString(body.get("client_secret"));
  const record = await getOAuthStore().getRefreshToken(refreshToken);

  if (!record || record.clientId !== clientId) {
    return sendJson(res, 400, { error: "invalid_grant" });
  }

  const client = await getOAuthStore().getClient(record.clientId);

  if (!client || !clientSecretIsValid(client, clientSecret)) {
    return sendJson(res, 400, { error: "invalid_client" });
  }

  await getOAuthStore().deleteRefreshToken(refreshToken);

  return issueTokenResponse(res, {
    clientId: record.clientId,
    rbacSubjectId: record.rbacSubjectId,
    scope: record.scope,
    rbacSubjectAuthenticationJwt: record.rbacSubjectAuthenticationJwt,
  });
}

async function issueTokenResponse(
  res: ServerResponse,
  props: {
    clientId: string;
    rbacSubjectId: string;
    scope: string;
    rbacSubjectAuthenticationJwt: string;
  },
) {
  const accessTokenTtl = getAccessTokenTtlSeconds();
  const refreshTokenTtl = getRefreshTokenTtlSeconds();
  const issued = await issueAccessToken({
    ...props,
    ttlSeconds: accessTokenTtl,
  });
  const refreshToken = randomSecret();

  await getOAuthStore().saveRefreshToken(
    {
      token: refreshToken,
      clientId: props.clientId,
      rbacSubjectId: props.rbacSubjectId,
      scope: props.scope,
      rbacSubjectAuthenticationJwt: props.rbacSubjectAuthenticationJwt,
      createdAt: nowSeconds(),
    },
    refreshTokenTtl,
  );

  return sendJson(res, 200, {
    access_token: issued.accessToken,
    token_type: "Bearer",
    expires_in: issued.expiresIn,
    refresh_token: refreshToken,
    scope: props.scope,
  });
}

async function issueAccessToken(props: IAccessTokenIssueProps) {
  const expiresAt = nowSeconds() + props.ttlSeconds;
  const jti = randomUUID();
  const accessToken = jwt.sign(
    {
      sub: props.rbacSubjectId,
      aud: getMcpPublicUrl(),
      iss: getMcpPublicBaseUrl(),
      scope: props.scope,
      client_id: props.clientId,
      jti,
    },
    getMcpJwtSecret(),
    {
      expiresIn: props.ttlSeconds,
    },
  );

  await getOAuthStore().saveAccessToken(
    {
      jti,
      clientId: props.clientId,
      rbacSubjectId: props.rbacSubjectId,
      scope: props.scope,
      rbacSubjectAuthenticationJwt: props.rbacSubjectAuthenticationJwt,
      expiresAt,
    },
    props.ttlSeconds,
  );

  return {
    accessToken,
    expiresIn: props.ttlSeconds,
  };
}

async function validateAuthorizeParams(params: Record<string, string>) {
  const clientId = String(params["client_id"] || "");
  const redirectUri = String(params["redirect_uri"] || "");
  const responseType = String(params["response_type"] || "");
  const codeChallenge = String(params["code_challenge"] || "");
  const codeChallengeMethod = String(params["code_challenge_method"] || "");
  const resource = optionalString(params["resource"]);
  const scope = optionalString(params["scope"]) || DEFAULT_SCOPE;
  const state = optionalString(params["state"]);

  if (responseType !== "code") {
    throw new Error("response_type must be code");
  }

  if (!codeChallenge || codeChallengeMethod !== "S256") {
    throw new Error("PKCE S256 is required");
  }

  if (resource && resource.replace(/\/$/, "") !== getMcpPublicUrl()) {
    throw new Error("Invalid resource");
  }

  const client = await getOAuthStore().getClient(clientId);

  if (!client || !client.redirectUris.includes(redirectUri)) {
    throw new Error("Invalid client or redirect_uri");
  }

  return {
    client,
    redirectUri,
    codeChallenge,
    resource,
    scope,
    state,
  };
}

async function authenticateRbacSubject(email: string, password: string) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const formData = new FormData();
  formData.set(
    "data",
    JSON.stringify({
      login: email,
      password,
    }),
  );

  const apiUrl = (
    process.env["API_SERVICE_URL"] || "http://127.0.0.1:4000"
  ).replace(/\/$/, "");
  const response = await fetch(
    `${apiUrl}/api/rbac/subjects/authentication/email-and-password/authentication`,
    {
      method: "POST",
      body: formData,
    },
  ).catch((error) => {
    throw new Error(
      `Unable to reach SPS API at ${apiUrl}. Is npm run api:dev running? ${getErrorMessage(error)}`,
    );
  });
  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw new Error(
      getPayloadError(payload) ||
        `RBAC subject authentication failed with status ${response.status}`,
    );
  }

  const data = isRecord(payload["data"])
    ? payload["data"]
    : (payload as Record<string, unknown>);
  const rbacSubjectAuthenticationJwt =
    typeof data["jwt"] === "string" ? data["jwt"] : undefined;

  if (!rbacSubjectAuthenticationJwt) {
    throw new Error(
      "RBAC subject authentication response does not include jwt",
    );
  }

  return {
    rbacSubjectAuthenticationJwt,
  };
}

function renderAuthorizePage(
  res: ServerResponse,
  params: Record<string, string>,
  error?: string,
) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SinglePageStartup MCP login</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      main { max-width: 420px; margin: 12vh auto; padding: 32px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }
      label { display: block; font-size: 14px; font-weight: 600; margin: 16px 0 6px; }
      input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit; }
      button { margin-top: 20px; width: 100%; padding: 10px 12px; border: 0; border-radius: 6px; background: #0f172a; color: white; font: inherit; font-weight: 600; }
      .error { margin: 0 0 16px; color: #b91c1c; }
      p { color: #475569; }
    </style>
  </head>
  <body>
    <main>
      <h1>Connect SinglePageStartup</h1>
      <p>Sign in with your SinglePageStartup account to authorize this MCP connector.</p>
      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
      <form method="post" action="/oauth/authorize">
        ${hidden("response_type", params["response_type"])}
        ${hidden("client_id", params["client_id"])}
        ${hidden("redirect_uri", params["redirect_uri"])}
        ${hidden("scope", params["scope"] || DEFAULT_SCOPE)}
        ${hidden("state", params["state"])}
        ${hidden("code_challenge", params["code_challenge"])}
        ${hidden("code_challenge_method", params["code_challenge_method"])}
        ${hidden("resource", params["resource"])}
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Authorize</button>
      </form>
    </main>
  </body>
</html>`);
}

function getOAuthStore() {
  if (store) {
    return store;
  }

  if (
    process.env["MCP_SERVICE_OAUTH_STORE"] === "redis" ||
    process.env["KV_PROVIDER"] === "redis"
  ) {
    store = new RedisOAuthStore(
      new Redis({
        host: process.env["KV_HOST"] || "127.0.0.1",
        port: Number(process.env["KV_PORT"] || 6379),
        password: process.env["KV_PASSWORD"] || undefined,
        lazyConnect: false,
      }),
    );
  } else {
    store = new MemoryOAuthStore();
  }

  return store;
}

function getMcpJwtSecret() {
  const secret =
    process.env["MCP_SERVICE_OAUTH_JWT_SECRET"] ||
    process.env["RBAC_JWT_SECRET"];

  if (!secret) {
    throw new Error(
      "MCP_SERVICE_OAUTH_JWT_SECRET or RBAC_JWT_SECRET is required",
    );
  }

  return secret;
}

function verifyJwt(accessToken: string) {
  const payload = jwt.verify(accessToken, getMcpJwtSecret());

  if (!isJwtPayload(payload)) {
    throw new Error("Invalid JWT payload");
  }

  return payload;
}

function getRbacSubjectIdFromAuthenticationJwt(
  rbacSubjectAuthenticationJwt: string,
) {
  const secret = process.env["RBAC_JWT_SECRET"];

  if (!secret) {
    return "rbac-subject";
  }

  const payload = jwt.verify(rbacSubjectAuthenticationJwt, secret);

  if (!isJwtPayload(payload)) {
    return "rbac-subject";
  }

  if (typeof payload.sub === "string") {
    return payload.sub;
  }

  if (
    isRecord(payload["subject"]) &&
    typeof payload["subject"]["id"] === "string"
  ) {
    return payload["subject"]["id"];
  }

  if (typeof payload["id"] === "string") {
    return payload["id"];
  }

  return "rbac-subject";
}

function getVerifiedRbacSubjectIdFromAuthenticationJwt(
  rbacSubjectAuthenticationJwt: string,
) {
  const secret = process.env["RBAC_JWT_SECRET"];

  if (!secret) {
    throw new Error("RBAC_JWT_SECRET is required");
  }

  const payload = jwt.verify(rbacSubjectAuthenticationJwt, secret);

  if (
    !isJwtPayload(payload) ||
    !isRecord(payload["subject"]) ||
    typeof payload["subject"]["id"] !== "string" ||
    !payload["subject"]["id"]
  ) {
    throw new Error(
      "RBAC subject authentication JWT does not include subject.id",
    );
  }

  return payload["subject"]["id"];
}

function assertInternalTokenExchangeSecret(providedSecret?: string) {
  const expectedSecret =
    process.env["MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET"];

  if (!expectedSecret) {
    throw new InternalTokenExchangeError(
      500,
      "server_error",
      "MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET is not configured",
    );
  }

  if (!providedSecret || !secretsAreEqual(providedSecret, expectedSecret)) {
    throw new InternalTokenExchangeError(
      401,
      "invalid_client",
      "Internal token exchange authentication failed",
    );
  }
}

function assertNoSubjectOverride(body: Record<string, unknown>) {
  const overrideKeys = [
    "subject",
    "subjectId",
    "subject_id",
    "rbacSubjectId",
    "rbac_subject_id",
  ];
  const overrideKey = overrideKeys.find((key) =>
    Object.prototype.hasOwnProperty.call(body, key),
  );

  if (overrideKey) {
    throw new InternalTokenExchangeError(
      400,
      "invalid_request",
      `${overrideKey} is not accepted; subject is derived from subject_token`,
    );
  }
}

function secretsAreEqual(providedSecret: string, expectedSecret: string) {
  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

function clientSecretIsValid(client: IOAuthClient, clientSecret?: string) {
  if (!client.clientSecret) {
    return true;
  }

  return client.clientSecret === clientSecret;
}

function withTtl<T>(value: T, ttlSeconds: number) {
  return {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
}

function getUnexpired<T>(
  map: Map<string, { value: T; expiresAt: number }>,
  id: string,
) {
  const entry = map.get(id);

  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    map.delete(id);

    return undefined;
  }

  return entry.value;
}

async function getJson<T>(redis: Redis, redisKey: string) {
  const value = await redis.get(redisKey);

  if (!value) {
    return undefined;
  }

  return JSON.parse(value) as T;
}

function key(type: string, id: string) {
  return `mcp:oauth:${type}:${id}`;
}

function getAuthCodeTtlSeconds() {
  return getEnvNumber(
    "MCP_SERVICE_OAUTH_AUTH_CODE_TTL_SECONDS",
    DEFAULT_AUTH_CODE_TTL_SECONDS,
  );
}

function getAccessTokenTtlSeconds() {
  return getEnvNumber(
    "MCP_SERVICE_OAUTH_ACCESS_TOKEN_TTL_SECONDS",
    DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  );
}

function getRefreshTokenTtlSeconds() {
  return getEnvNumber(
    "MCP_SERVICE_OAUTH_REFRESH_TOKEN_TTL_SECONDS",
    DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
  );
}

function getEnvNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function readJsonBody(req: IncomingMessage) {
  const raw = await readBody(req);

  if (!raw) {
    return {};
  }

  return JSON.parse(raw) as Record<string, unknown>;
}

function getHeader(req: IncomingMessage, name: string) {
  const value = req.headers[name.toLowerCase()];

  return Array.isArray(value) ? value[0] : value;
}

async function readFormBody(req: IncomingMessage) {
  const raw = await readBody(req);

  return new URLSearchParams(raw);
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function sendEmpty(res: ServerResponse, status: number) {
  res.statusCode = status;
  res.end();
}

function hidden(name: string, value?: string) {
  return `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value || "")}" />`;
}

function randomSecret() {
  return randomBytes(32).toString("base64url");
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function optionalString(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" && value ? value : undefined;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getPayloadError(payload: Record<string, unknown>) {
  if (typeof payload["message"] === "string") {
    return payload["message"];
  }

  if (typeof payload["error"] === "string") {
    return payload["error"];
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isJwtPayload(value: unknown): value is JwtPayload {
  return isRecord(value);
}
