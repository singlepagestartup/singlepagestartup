/**
 * BDD Suite: MCP OAuth helpers and authorization flow
 *
 * Given a remote MCP public URL configuration and the in-memory OAuth store
 * When clients register, users consent and sign in, and tokens are exchanged
 * Then registrations expire, redirect targets are limited, deleting needs an approved scope, and oversized bodies are refused
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import {
  createPkceChallenge,
  exchangeRbacSubjectAuthenticationJwtForMcpToken,
  getAuthorizationServerMetadata,
  getProtectedResourceMetadata,
  getWwwAuthenticateHeader,
  handleOAuthRequest,
  INTERNAL_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH,
  isInternalRbacSubjectTokenExchangeRoute,
  isOAuthRoute,
  verifyMcpAccessToken,
} from "./oauth";
import jwt, { type JwtPayload } from "jsonwebtoken";

const oauthEnv = {
  MCP_SERVICE_PUBLIC_BASE_URL: "https://mcp.example.com",
  MCP_SERVICE_PUBLIC_URL: "https://mcp.example.com/mcp",
  MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET: "internal-exchange-secret",
  MCP_SERVICE_OAUTH_JWT_SECRET: "mcp-oauth-secret",
  MCP_SERVICE_OAUTH_STORE: "memory",
  RBAC_JWT_SECRET: "rbac-jwt-secret",
  KV_PROVIDER: "memory",
};

describe("MCP OAuth helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ...oauthEnv,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  /**
   * BDD Scenario: Protected resource metadata
   *
   * Given MCP_SERVICE_PUBLIC_URL points to the remote streamable HTTP endpoint
   * When protected resource metadata is generated
   * Then it advertises the MCP resource, authorization server, and both content scopes
   */
  it("exposes protected resource metadata for the MCP endpoint", () => {
    expect(getProtectedResourceMetadata()).toEqual({
      resource: "https://mcp.example.com/mcp",
      authorization_servers: ["https://mcp.example.com"],
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp:content", "mcp:content:delete"],
      resource_name: "SinglePageStartup MCP",
    });
  });

  /**
   * BDD Scenario: Authorization server metadata
   *
   * Given MCP_SERVICE_PUBLIC_BASE_URL points to the connector host
   * When authorization server metadata is generated
   * Then it exposes OAuth endpoints and PKCE S256 support
   */
  it("exposes authorization server metadata with PKCE S256 support", () => {
    expect(getAuthorizationServerMetadata()).toMatchObject({
      issuer: "https://mcp.example.com",
      authorization_endpoint: "https://mcp.example.com/oauth/authorize",
      token_endpoint: "https://mcp.example.com/oauth/token",
      registration_endpoint: "https://mcp.example.com/oauth/register",
      revocation_endpoint: "https://mcp.example.com/oauth/revoke",
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["mcp:content", "mcp:content:delete"],
    });
  });

  /**
   * BDD Scenario: Resource-specific metadata routes
   *
   * Given the MCP resource is served from /mcp
   * When OAuth well-known routes are matched
   * Then both root and resource-specific metadata URLs are accepted
   */
  it("accepts root and MCP resource-specific OAuth metadata routes", () => {
    expect(isOAuthRoute("/.well-known/oauth-protected-resource")).toBe(true);
    expect(isOAuthRoute("/.well-known/oauth-protected-resource/mcp")).toBe(
      true,
    );
    expect(isOAuthRoute("/.well-known/oauth-authorization-server")).toBe(true);
    expect(isOAuthRoute("/.well-known/oauth-authorization-server/mcp")).toBe(
      true,
    );
  });

  /**
   * BDD Scenario: Protected resource authentication challenge
   *
   * Given the MCP resource is served from /mcp
   * When a client receives a Bearer challenge
   * Then the challenge points to the resource-specific metadata document
   */
  it("advertises the MCP resource-specific metadata URL in the Bearer challenge", () => {
    const metadataUrl =
      "https://mcp.example.com/.well-known/oauth-protected-resource/mcp";

    expect(getWwwAuthenticateHeader()).toBe(
      `Bearer resource_metadata="${metadataUrl}"`,
    );
  });

  /**
   * BDD Scenario: PKCE challenge
   *
   * Given an RFC 7636 code verifier
   * When the S256 challenge is calculated
   * Then the challenge matches the standard base64url example
   */
  it("creates RFC 7636 S256 PKCE challenges", () => {
    expect(
      createPkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
    ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  /**
   * BDD Scenario: Internal rbac.subject token exchange route
   *
   * Given the MCP HTTP server receives a route path
   * When the internal rbac.subject exchange route is matched
   * Then only the dedicated internal endpoint is accepted
   */
  it("matches only the dedicated internal rbac.subject exchange endpoint", () => {
    expect(
      isInternalRbacSubjectTokenExchangeRoute(
        INTERNAL_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH,
      ),
    ).toBe(true);
    expect(isInternalRbacSubjectTokenExchangeRoute("/oauth/token")).toBe(false);
    expect(isOAuthRoute(INTERNAL_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH)).toBe(false);
  });

  /**
   * BDD Scenario: RBAC subject authentication JWT exchange
   *
   * Given a valid RBAC subject authentication JWT for an rbac.subject and the internal service secret
   * When the JWT is exchanged for an MCP token
   * Then the access-only token lasts five minutes, resolves to that rbac.subject, and keeps the profile agent's delete access
   */
  it("issues a five-minute access-only MCP token for the verified rbac.subject", async () => {
    const rbacSubjectAuthenticationJwt =
      createRbacSubjectAuthenticationJwt("rbac-subject-1");
    const before = Math.floor(Date.now() / 1000);
    const response = await exchangeRbacSubjectAuthenticationJwtForMcpToken({
      providedSecret: "internal-exchange-secret",
      body: {
        subject_token: rbacSubjectAuthenticationJwt,
      },
    });
    const verified = await verifyMcpAccessToken(response.access_token);
    const accessPayload = jwt.verify(
      response.access_token,
      "mcp-oauth-secret",
    ) as JwtPayload;

    expect(response).toMatchObject({
      token_type: "Bearer",
      expires_in: 300,
      scope: "mcp:content mcp:content:delete",
    });
    expect(response).not.toHaveProperty("refresh_token");
    expect(verified).toMatchObject({
      clientId: "internal-rbac-subject",
      scopes: ["mcp:content", "mcp:content:delete"],
      rbacSubjectId: "rbac-subject-1",
      rbacSubjectAuthenticationJwt,
    });
    expect(verified.expiresAt).toBeGreaterThanOrEqual(before + 300);
    expect(verified.expiresAt).toBeLessThanOrEqual(before + 301);
    expect(accessPayload).toMatchObject({
      sub: "rbac-subject-1",
      client_id: "internal-rbac-subject",
      scope: "mcp:content mcp:content:delete",
    });
  });

  /**
   * BDD Scenario: Wrong internal exchange secret
   *
   * Given a valid RBAC subject authentication JWT but an incorrect service secret
   * When internal exchange is attempted
   * Then no MCP credential is issued
   */
  it("rejects an incorrect internal token exchange secret", async () => {
    await expect(
      exchangeRbacSubjectAuthenticationJwtForMcpToken({
        providedSecret: "wrong-secret",
        body: {
          subject_token: createRbacSubjectAuthenticationJwt("rbac-subject-2"),
        },
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "invalid_client",
    });
  });

  /**
   * BDD Scenario: Subject override is supplied
   *
   * Given a valid JWT for one rbac.subject and a separate subject id in the request
   * When internal exchange is attempted
   * Then the request is rejected instead of trusting caller-controlled identity
   */
  it("rejects separately supplied rbac.subject identifiers", async () => {
    await expect(
      exchangeRbacSubjectAuthenticationJwtForMcpToken({
        providedSecret: "internal-exchange-secret",
        body: {
          subject_token: createRbacSubjectAuthenticationJwt("rbac-subject-3"),
          subjectId: "attacker-controlled-subject",
        },
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "invalid_request",
    });
  });

  /**
   * BDD Scenario: Invalid or expired rbac.subject authentication credential
   *
   * Given a malformed or expired RBAC subject authentication JWT
   * When internal exchange verifies the subject token
   * Then the request is rejected without deriving a fallback subject
   */
  it.each([
    ["invalid", "not-a-jwt"],
    ["expired", createRbacSubjectAuthenticationJwt("rbac-subject-4", -1)],
  ])(
    "rejects an %s RBAC subject authentication JWT",
    async (_label, rbacSubjectAuthenticationJwt) => {
      await expect(
        exchangeRbacSubjectAuthenticationJwtForMcpToken({
          providedSecret: "internal-exchange-secret",
          body: {
            subject_token: rbacSubjectAuthenticationJwt,
          },
        }),
      ).rejects.toMatchObject({
        status: 401,
        code: "invalid_subject_token",
      });
    },
  );

  /**
   * BDD Scenario: RBAC subject authentication JWT has no subject
   *
   * Given a correctly signed RBAC subject authentication JWT without subject.id
   * When internal exchange verifies the token
   * Then it rejects the credential rather than using a generic fallback subject
   */
  it("rejects a signed rbac.subject JWT without subject.id", async () => {
    const rbacSubjectAuthenticationJwt = jwt.sign(
      { subject: {} },
      process.env["RBAC_JWT_SECRET"] as string,
      { expiresIn: 60 },
    );

    await expect(
      exchangeRbacSubjectAuthenticationJwtForMcpToken({
        providedSecret: "internal-exchange-secret",
        body: {
          subject_token: rbacSubjectAuthenticationJwt,
        },
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "invalid_subject_token",
    });
  });
});

const clientRedirectUri = "http://127.0.0.1:33418/callback";
const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

describe("MCP OAuth authorization flow", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ...oauthEnv,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario: Connector callbacks register
   *
   * Given the callbacks used by remote connectors and by clients on the user's machine
   * When a client registers them
   * Then https targets and http targets on localhost, 127.0.0.1 and [::1] are accepted
   */
  it("registers https and loopback redirect URIs", async () => {
    const redirectUris = [
      "https://claude.ai/api/mcp/auth_callback",
      "http://localhost:6274/oauth/callback",
      "http://127.0.0.1:33418/callback",
      "http://[::1]:8080/callback",
    ];
    const response = await registerClient(redirectUris);

    expect(response.status).toBe(201);
    expect(JSON.parse(response.body)).toMatchObject({
      redirect_uris: redirectUris,
      scope: "mcp:content",
    });
  });

  /**
   * BDD Scenario: Unsafe redirect targets are refused
   *
   * Given a registration that lists a valid callback next to an unsafe one
   * When the client registers
   * Then the registration is refused as invalid_redirect_uri
   */
  it.each([
    ["a javascript URI", "javascript:alert(1)"],
    ["a data URI", "data:text/html,<script>alert(1)</script>"],
    ["a fragment", "https://client.example/callback#token"],
    ["an empty fragment", "https://client.example/callback#"],
    ["credentials", "https://user:secret@client.example/callback"],
    ["plain http on a public host", "http://client.example/callback"],
    ["whitespace", "https://client.example/call back"],
    ["an unparseable value", "not a url"],
    ["a value that is not a string", 42],
  ])("refuses a redirect URI with %s", async (_label, redirectUri) => {
    const response = await registerClient([clientRedirectUri, redirectUri]);

    expect(response.status).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      error: "invalid_redirect_uri",
    });
  });

  /**
   * BDD Scenario: Malformed registration metadata
   *
   * Given a registration body that is not JSON
   * When the client registers
   * Then the server answers invalid_client_metadata instead of a server error
   */
  it("refuses a registration body that is not JSON", async () => {
    const response = await sendOAuthRequest({
      method: "POST",
      path: "/oauth/register",
      body: "{not json",
    });

    expect(response.status).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      error: "invalid_client_metadata",
    });
  });

  /**
   * BDD Scenario: Redirect matching stays exact
   *
   * Given a client registered with one loopback callback
   * When authorization or the code exchange names a different callback
   * Then authorization shows an error and the exchange fails as invalid_client
   */
  it("keeps exact redirect matching at authorize and token time", async () => {
    const client = await createClient([clientRedirectUri]);
    const page = await authorizePage(client.client_id, {
      redirectUri: `${clientRedirectUri}/`,
    });

    expect(page.status).toBe(400);
    expect(page.body).toContain("Invalid client or redirect_uri");

    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const token = await exchangeCode(
      client.client_id,
      code,
      "http://127.0.0.1:33418/other",
    );

    expect(token.status).toBe(400);
    expect(JSON.parse(token.body)).toMatchObject({ error: "invalid_client" });
  });

  /**
   * BDD Scenario: An unused registration expires
   *
   * Given MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS is one minute
   * When nobody uses the registered client for longer than that
   * Then authorization no longer finds the client
   */
  it("expires a registered client that is never used", async () => {
    process.env["MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS"] = "60";
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    const client = await createClient([clientRedirectUri]);

    expect((await authorizePage(client.client_id)).status).toBe(200);

    clock.mockReturnValue(now + 61 * 1000);

    const page = await authorizePage(client.client_id);

    expect(page.status).toBe(400);
    expect(page.body).toContain("Invalid client or redirect_uri");
  });

  /**
   * BDD Scenario: A registration in use outlives its first TTL
   *
   * Given a client TTL of one minute and a refresh-token lifetime of two minutes
   * When the client obtains tokens and refreshes them after ninety seconds
   * Then the refresh succeeds because obtaining tokens extended the registration
   */
  it("keeps a client that obtains tokens past its first TTL", async () => {
    process.env["MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS"] = "60";
    process.env["MCP_SERVICE_OAUTH_REFRESH_TOKEN_TTL_SECONDS"] = "120";
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    const client = await createClient([clientRedirectUri]);
    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const token = await exchangeCode(client.client_id, code, clientRedirectUri);

    expect(token.status).toBe(200);

    clock.mockReturnValue(now + 90 * 1000);

    const refreshed = await sendOAuthRequest({
      method: "POST",
      path: "/oauth/token",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: JSON.parse(token.body).refresh_token,
        client_id: client.client_id,
      }).toString(),
    });

    expect(refreshed.status).toBe(200);
    expect(JSON.parse(refreshed.body)).toMatchObject({ scope: "mcp:content" });
  });

  /**
   * BDD Scenario: Consent comes before credentials
   *
   * Given a registered client with a name
   * When the user opens the authorization URL
   * Then the page names the client, its id and its callback, asks for approval without a password field, and refuses framing
   */
  it("names the client and its redirect target before asking for credentials", async () => {
    const client = await createClient([clientRedirectUri], {
      client_name: "Inspector <test>",
    });
    const page = await authorizePage(client.client_id);

    expect(page.status).toBe(200);
    expect(page.headers["x-frame-options"]).toBe("DENY");
    expect(page.headers["content-security-policy"]).toBe(
      "frame-ancestors 'none'",
    );
    expect(page.body).toContain(client.client_id);
    expect(page.body).toContain("Inspector &lt;test&gt;");
    expect(page.body).toContain(clientRedirectUri);
    expect(page.body).toContain('name="consent" value="approve"');
    expect(page.body).not.toContain('name="password"');
  });

  /**
   * BDD Scenario: Deleting is offered only on request
   *
   * Given a registered client
   * When it asks for mcp:content alone, and then for the delete scope as well
   * Then the consent step shows the delete choice only in the second case
   */
  it("offers deleting only when the client asks for it", async () => {
    const client = await createClient([clientRedirectUri]);
    const contentPage = await authorizePage(client.client_id, {
      scope: "mcp:content",
    });
    const deletePage = await authorizePage(client.client_id, {
      scope: "mcp:content mcp:content:delete",
    });

    expect(contentPage.body).not.toContain('name="allow_delete"');
    expect(deletePage.body).toContain('name="allow_delete"');
  });

  /**
   * BDD Scenario: The user cancels
   *
   * Given the consent step for a registered client
   * When the user cancels
   * Then the client receives access_denied with its state and no code
   */
  it("returns access_denied to the client when the user cancels", async () => {
    const client = await createClient([clientRedirectUri]);
    const response = await submitAuthorize(client.client_id, {
      consent: "deny",
    });
    const location = new URL(response.headers["location"]);

    expect(response.status).toBe(302);
    expect(`${location.origin}${location.pathname}`).toBe(clientRedirectUri);
    expect(location.searchParams.get("error")).toBe("access_denied");
    expect(location.searchParams.get("state")).toBe("client-state");
    expect(location.searchParams.has("code")).toBe(false);
  });

  /**
   * BDD Scenario: The token carries the scope the user approved
   *
   * Given a client that asks for an unknown scope, mcp:content and the delete scope
   * When the user approves with the delete choice left unticked, or ticked
   * Then the token carries mcp:content alone, or both content scopes
   */
  it.each([
    ["left unticked", undefined, "mcp:content"],
    ["ticked", "true", "mcp:content mcp:content:delete"],
  ])(
    "issues the approved scope when deleting is %s",
    async (_label, allowDelete, expectedScope) => {
      const client = await createClient([clientRedirectUri]);
      const code = await obtainCode(client.client_id, {
        scope: "openid mcp:content mcp:content:delete",
        allowDelete,
      });
      const token = await exchangeCode(
        client.client_id,
        code,
        clientRedirectUri,
      );
      const body = JSON.parse(token.body);

      expect(token.status).toBe(200);
      expect(body.scope).toBe(expectedScope);
      expect((await verifyMcpAccessToken(body.access_token)).scopes).toEqual(
        expectedScope.split(" "),
      );
    },
  );

  /**
   * BDD Scenario: An unknown client gets no form
   *
   * Given an authorization URL for a client id that was never registered
   * When the user opens it
   * Then the page explains the error and offers neither consent nor sign-in
   */
  it("shows an error without a form for an unknown client", async () => {
    const page = await authorizePage("mcp_client_unknown");

    expect(page.status).toBe(400);
    expect(page.body).toContain("Invalid client or redirect_uri");
    expect(page.body).not.toContain("<form");
  });

  /**
   * BDD Scenario: Oversized OAuth bodies are refused
   *
   * Given a registration body larger than 64 KiB
   * When the client registers
   * Then the server answers 413 without storing a client
   */
  it("refuses an OAuth body larger than 64 KiB", async () => {
    const response = await registerClient([clientRedirectUri], {
      client_name: "x".repeat(70 * 1024),
    });

    expect(response.status).toBe(413);
    expect(JSON.parse(response.body)).toMatchObject({
      error: "invalid_request",
    });
  });
});

async function sendOAuthRequest(props: {
  method: string;
  path: string;
  body?: string;
}) {
  const url = new URL(props.path, "https://mcp.example.com");
  const req = Object.assign(
    Readable.from(props.body ? [Buffer.from(props.body)] : []),
    {
      method: props.method,
      url: `${url.pathname}${url.search}`,
      headers: {},
    },
  );
  const headers: Record<string, string> = {};
  let body = "";
  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
    end(chunk?: string) {
      body = chunk ?? "";
    },
  };

  await handleOAuthRequest(
    req as unknown as IncomingMessage,
    res as unknown as ServerResponse,
    url,
  );

  return { status: res.statusCode, headers, body };
}

function registerClient(
  redirectUris: unknown[],
  metadata: Record<string, unknown> = {},
) {
  return sendOAuthRequest({
    method: "POST",
    path: "/oauth/register",
    body: JSON.stringify({ ...metadata, redirect_uris: redirectUris }),
  });
}

async function createClient(
  redirectUris: string[],
  metadata: Record<string, unknown> = {},
) {
  const response = await registerClient(redirectUris, metadata);

  expect(response.status).toBe(201);

  return JSON.parse(response.body) as { client_id: string };
}

function getAuthorizeParams(
  clientId: string,
  props: { redirectUri?: string; scope?: string } = {},
) {
  return {
    response_type: "code",
    client_id: clientId,
    redirect_uri: props.redirectUri ?? clientRedirectUri,
    scope: props.scope ?? "mcp:content",
    state: "client-state",
    code_challenge: createPkceChallenge(codeVerifier),
    code_challenge_method: "S256",
  };
}

function authorizePage(
  clientId: string,
  props: { redirectUri?: string; scope?: string } = {},
) {
  const query = new URLSearchParams(getAuthorizeParams(clientId, props));

  return sendOAuthRequest({
    method: "GET",
    path: `/oauth/authorize?${query}`,
  });
}

function submitAuthorize(
  clientId: string,
  fields: Record<string, string>,
  props: { scope?: string } = {},
) {
  return sendOAuthRequest({
    method: "POST",
    path: "/oauth/authorize",
    body: new URLSearchParams({
      ...getAuthorizeParams(clientId, props),
      ...fields,
    }).toString(),
  });
}

/**
 * Walks the consent and sign-in steps as a browser does: the sign-in step is
 * submitted with the scope the consent step wrote into it.
 */
async function obtainCode(
  clientId: string,
  props: { scope: string; allowDelete?: string },
) {
  const signIn = await submitAuthorize(
    clientId,
    {
      consent: "approve",
      ...(props.allowDelete ? { allow_delete: props.allowDelete } : {}),
    },
    { scope: props.scope },
  );
  const approvedScope = signIn.body.match(/name="scope" value="([^"]*)"/)?.[1];

  expect(signIn.body).toContain('name="password"');

  jest.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        data: { jwt: createRbacSubjectAuthenticationJwt("rbac-subject-5") },
      }),
      { status: 200 },
    ),
  );

  const redirect = await submitAuthorize(
    clientId,
    {
      consent: "approve",
      email: "subject@example.com",
      password: "subject-password",
    },
    { scope: approvedScope },
  );

  expect(redirect.status).toBe(302);

  return new URL(redirect.headers["location"]).searchParams.get(
    "code",
  ) as string;
}

function exchangeCode(clientId: string, code: string, redirectUri: string) {
  return sendOAuthRequest({
    method: "POST",
    path: "/oauth/token",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });
}

function createRbacSubjectAuthenticationJwt(subjectId: string, expiresIn = 60) {
  return jwt.sign(
    {
      subject: {
        id: subjectId,
      },
    },
    process.env["RBAC_JWT_SECRET"] as string,
    { expiresIn },
  );
}
