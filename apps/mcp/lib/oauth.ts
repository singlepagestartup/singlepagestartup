import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import Redis from "ioredis";
import jwt, { type JwtPayload } from "jsonwebtoken";
import {
  MCP_CONTENT_DELETE_SCOPE,
  MCP_CONTENT_SCOPE,
  MCP_SCOPES,
} from "./auth";
import { readRequestBody, RequestBodyTooLargeError } from "./request-body";

const DEFAULT_AUTH_CODE_TTL_SECONDS = 5 * 60;
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_CLIENT_TTL_SECONDS = 30 * 24 * 60 * 60;
const OAUTH_BODY_LIMIT_BYTES = 64 * 1024;
const LOOPBACK_REDIRECT_HOSTS = ["localhost", "127.0.0.1", "[::1]"];
const SCOPE_DESCRIPTIONS: Record<string, string> = {
  [MCP_CONTENT_SCOPE]: "Read, create and update content",
  [MCP_CONTENT_DELETE_SCOPE]: "Delete records",
};
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

type IAuthorizeRequest = {
  client: IOAuthClient;
  redirectUri: string;
  codeChallenge: string;
  resource?: string;
  scope: string;
  state?: string;
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
  saveClient(client: IOAuthClient, ttlSeconds: number): Promise<void>;
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
  private clients = new Map<
    string,
    { value: IOAuthClient; expiresAt: number }
  >();
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
    return getUnexpired(this.clients, clientId);
  }

  async saveClient(client: IOAuthClient, ttlSeconds: number) {
    this.clients.set(client.clientId, withTtl(client, ttlSeconds));
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

  async saveClient(client: IOAuthClient, ttlSeconds: number) {
    await this.redis.set(
      key("client", client.clientId),
      JSON.stringify(client),
      "EX",
      ttlSeconds,
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
    scopes_supported: [...MCP_SCOPES],
  };
}

export function getProtectedResourceMetadata() {
  const resource = getMcpPublicUrl();

  return {
    resource,
    authorization_servers: [getMcpPublicBaseUrl()],
    bearer_methods_supported: ["header"],
    scopes_supported: [...MCP_SCOPES],
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
      return await handleRegister(req, res);
    }

    if (url.pathname === "/oauth/authorize") {
      return await handleAuthorize(req, res, url);
    }

    if (url.pathname === "/oauth/token") {
      return await handleToken(req, res);
    }

    if (url.pathname === "/oauth/revoke") {
      return await handleRevoke(req, res);
    }

    sendJson(res, 404, { error: "not_found" });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return sendJson(res, 413, {
        error: "invalid_request",
        error_description: error.message,
      });
    }

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

    if (error instanceof RequestBodyTooLargeError) {
      return sendJson(res, 413, {
        error: "invalid_request",
        error_description: error.message,
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

  // The API's profile agent follows the tools' own preview and confirmation
  // rules, deletes included, and the API still decides what the subject may do.
  const scope = MCP_SCOPES.join(" ");
  const issued = await issueAccessToken({
    clientId: INTERNAL_RBAC_SUBJECT_CLIENT_ID,
    rbacSubjectId,
    scope,
    rbacSubjectAuthenticationJwt,
    ttlSeconds: INTERNAL_RBAC_SUBJECT_ACCESS_TOKEN_TTL_SECONDS,
  });

  return {
    access_token: issued.accessToken,
    token_type: "Bearer",
    expires_in: issued.expiresIn,
    scope,
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

  let body: Record<string, unknown>;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendJson(res, 400, {
        error: "invalid_client_metadata",
        error_description: "Request body must be valid JSON",
      });
    }

    throw error;
  }

  const redirectUris: unknown[] =
    isRecord(body) && Array.isArray(body["redirect_uris"])
      ? body["redirect_uris"]
      : [];

  if (!redirectUris.length) {
    return sendJson(res, 400, {
      error: "invalid_redirect_uri",
      error_description: "redirect_uris must include at least one URI",
    });
  }

  if (!redirectUris.every(isAllowedRedirectUri)) {
    return sendJson(res, 400, {
      error: "invalid_redirect_uri",
      error_description:
        "Each redirect URI must be an https URL, or an http URL on localhost, 127.0.0.1 or [::1], without a fragment or credentials",
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

  await getOAuthStore().saveClient(client, getClientTtlSeconds());

  return sendJson(res, 201, {
    client_id: client.clientId,
    ...(client.clientSecret ? { client_secret: client.clientSecret } : {}),
    client_id_issued_at: client.createdAt,
    redirect_uris: client.redirectUris,
    token_endpoint_auth_method: tokenEndpointAuthMethod,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: MCP_CONTENT_SCOPE,
  });
}

/**
 * Authorization runs in two steps. The consent step names the client and the
 * address the code returns to, and lets the user allow deleting when the client
 * asked for it; the sign-in step then takes the SinglePageStartup credentials.
 */
async function handleAuthorize(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const params =
    req.method === "GET"
      ? Object.fromEntries(url.searchParams)
      : Object.fromEntries(await readFormBody(req));
  const consent = params["consent"];
  let request: IAuthorizeRequest;

  try {
    request = await validateAuthorizeParams(params);
  } catch (error) {
    return renderAuthorizeError(res, getErrorMessage(error));
  }

  if (req.method === "GET" || (consent !== "approve" && consent !== "deny")) {
    return renderAuthorizeConsent(res, request);
  }

  if (consent === "deny") {
    return redirectToClient(res, request, { error: "access_denied" });
  }

  if (params["email"] === undefined) {
    return renderAuthorizeSignIn(res, {
      ...request,
      scope: getApprovedScope(request.scope, params["allow_delete"] === "true"),
    });
  }

  try {
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

    return redirectToClient(res, request, { code });
  } catch (error) {
    return renderAuthorizeSignIn(res, request, getErrorMessage(error));
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
    client,
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
    client,
    rbacSubjectId: record.rbacSubjectId,
    scope: record.scope,
    rbacSubjectAuthenticationJwt: record.rbacSubjectAuthenticationJwt,
  });
}

async function issueTokenResponse(
  res: ServerResponse,
  props: {
    client: IOAuthClient;
    rbacSubjectId: string;
    scope: string;
    rbacSubjectAuthenticationJwt: string;
  },
) {
  const accessTokenTtl = getAccessTokenTtlSeconds();
  const refreshTokenTtl = getRefreshTokenTtlSeconds();
  const issued = await issueAccessToken({
    clientId: props.client.clientId,
    rbacSubjectId: props.rbacSubjectId,
    scope: props.scope,
    rbacSubjectAuthenticationJwt: props.rbacSubjectAuthenticationJwt,
    ttlSeconds: accessTokenTtl,
  });
  const refreshToken = randomSecret();

  await getOAuthStore().saveRefreshToken(
    {
      token: refreshToken,
      clientId: props.client.clientId,
      rbacSubjectId: props.rbacSubjectId,
      scope: props.scope,
      rbacSubjectAuthenticationJwt: props.rbacSubjectAuthenticationJwt,
      createdAt: nowSeconds(),
    },
    refreshTokenTtl,
  );
  // Every token issue extends the registration, never below the lifetime of
  // the refresh token just issued, so a client in use outlives its tokens.
  await getOAuthStore().saveClient(
    props.client,
    Math.max(getClientTtlSeconds(), refreshTokenTtl),
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

async function validateAuthorizeParams(
  params: Record<string, string>,
): Promise<IAuthorizeRequest> {
  const clientId = String(params["client_id"] || "");
  const redirectUri = String(params["redirect_uri"] || "");
  const responseType = String(params["response_type"] || "");
  const codeChallenge = String(params["code_challenge"] || "");
  const codeChallengeMethod = String(params["code_challenge_method"] || "");
  const resource = optionalString(params["resource"]);
  const scope = normalizeScope(optionalString(params["scope"]));
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

  if (
    !client ||
    !client.redirectUris.includes(redirectUri) ||
    !isAllowedRedirectUri(redirectUri)
  ) {
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

/**
 * A redirect target is an https URL, or an http URL on a loopback host for a
 * client that listens on the user's own machine (RFC 8252 7.3). A fragment,
 * credentials, whitespace or a non-ASCII character is refused.
 */
function isAllowedRedirectUri(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^[\x21-\x7e]+$/.test(value) ||
    value.includes("#")
  ) {
    return false;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.username || url.password) {
    return false;
  }

  if (url.protocol === "https:") {
    return true;
  }

  return (
    url.protocol === "http:" && LOOPBACK_REDIRECT_HOSTS.includes(url.hostname)
  );
}

/**
 * Keeps the requested scopes this server knows, in the order it lists them, and
 * always grants mcp:content. RFC 6749 3.3 lets a server ignore unknown values.
 */
function normalizeScope(scope?: string) {
  const requested = (scope || "").split(" ");

  return MCP_SCOPES.filter(
    (item) => item === MCP_CONTENT_SCOPE || requested.includes(item),
  ).join(" ");
}

function getApprovedScope(scope: string, allowDelete: boolean) {
  return scope
    .split(" ")
    .filter((item) => allowDelete || item !== MCP_CONTENT_DELETE_SCOPE)
    .join(" ");
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
      `Unable to reach SinglePageStartup API at ${apiUrl}. Is npm run api:dev running? ${getErrorMessage(error)}`,
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

function renderAuthorizeConsent(
  res: ServerResponse,
  request: IAuthorizeRequest,
) {
  const requestsDelete = request.scope
    .split(" ")
    .includes(MCP_CONTENT_DELETE_SCOPE);

  return sendAuthorizePage(
    res,
    200,
    `<h1>Connect SinglePageStartup</h1>
      <p>An application asks to use SinglePageStartup MCP with your account. Continue only if you started this connection and recognize the address below.</p>
      <dl>
        <dt>Application</dt>
        <dd>${escapeHtml(request.client.clientName || "Unnamed application")}</dd>
        <dt>Client ID</dt>
        <dd><code>${escapeHtml(request.client.clientId)}</code></dd>
        <dt>Returns to</dt>
        <dd><code>${escapeHtml(request.redirectUri)}</code></dd>
      </dl>
      <form method="post" action="/oauth/authorize">
        ${renderAuthorizeFields(request)}
        <p>It will be able to:</p>
        <ul>
          <li>${escapeHtml(SCOPE_DESCRIPTIONS[MCP_CONTENT_SCOPE])}</li>
        </ul>
        ${
          requestsDelete
            ? `<label class="choice"><input type="checkbox" name="allow_delete" value="true" /> Also allow deleting records (${escapeHtml(MCP_CONTENT_DELETE_SCOPE)})</label>`
            : ""
        }
        <div class="actions">
          <button type="submit" name="consent" value="approve">Continue</button>
          <button type="submit" name="consent" value="deny" class="secondary">Cancel</button>
        </div>
      </form>`,
  );
}

function renderAuthorizeSignIn(
  res: ServerResponse,
  request: IAuthorizeRequest,
  error?: string,
) {
  const access = request.scope
    .split(" ")
    .map((scope) => SCOPE_DESCRIPTIONS[scope])
    .join("; ");

  return sendAuthorizePage(
    res,
    200,
    `<h1>Sign in to approve</h1>
      <p>Sign in with your SinglePageStartup account to connect ${escapeHtml(request.client.clientName || request.client.clientId)}. Access: ${escapeHtml(access)}.</p>
      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
      <form method="post" action="/oauth/authorize">
        ${renderAuthorizeFields(request)}
        ${hidden("consent", "approve")}
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Authorize</button>
      </form>`,
  );
}

function renderAuthorizeError(res: ServerResponse, error: string) {
  return sendAuthorizePage(
    res,
    400,
    `<h1>Connect SinglePageStartup</h1>
      <p class="error">${escapeHtml(error)}</p>
      <p>Start the connection again from your MCP client.</p>`,
  );
}

function renderAuthorizeFields(request: IAuthorizeRequest) {
  return [
    hidden("response_type", "code"),
    hidden("client_id", request.client.clientId),
    hidden("redirect_uri", request.redirectUri),
    hidden("scope", request.scope),
    hidden("state", request.state),
    hidden("code_challenge", request.codeChallenge),
    hidden("code_challenge_method", "S256"),
    hidden("resource", request.resource),
  ].join("\n        ");
}

function sendAuthorizePage(
  res: ServerResponse,
  status: number,
  content: string,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  // A consent page inside another site's frame could be clicked through.
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
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
      button.secondary { background: #e2e8f0; color: #0f172a; }
      dl { font-size: 14px; }
      dt { font-weight: 600; margin-top: 10px; }
      dd { margin: 4px 0 0; overflow-wrap: anywhere; }
      ul { color: #475569; }
      .choice { display: flex; gap: 8px; align-items: flex-start; font-weight: 400; }
      .choice input { width: auto; margin-top: 3px; }
      .actions { display: flex; gap: 10px; }
      .error { margin: 0 0 16px; color: #b91c1c; }
      p { color: #475569; }
    </style>
  </head>
  <body>
    <main>
      ${content}
    </main>
  </body>
</html>`);
}

function redirectToClient(
  res: ServerResponse,
  request: IAuthorizeRequest,
  params: Record<string, string>,
) {
  const redirectUrl = new URL(request.redirectUri);

  for (const [name, value] of Object.entries(params)) {
    redirectUrl.searchParams.set(name, value);
  }

  if (request.state) {
    redirectUrl.searchParams.set("state", request.state);
  }

  res.statusCode = 302;
  res.setHeader("Location", redirectUrl.toString());
  res.end();
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

function getClientTtlSeconds() {
  return getEnvNumber(
    "MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS",
    DEFAULT_CLIENT_TTL_SECONDS,
  );
}

function getEnvNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function readJsonBody(req: IncomingMessage) {
  const raw = await readRequestBody(req, OAUTH_BODY_LIMIT_BYTES);

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
  const raw = await readRequestBody(req, OAUTH_BODY_LIMIT_BYTES);

  return new URLSearchParams(raw);
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
