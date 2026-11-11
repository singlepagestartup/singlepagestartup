/**
 * BDD Suite: MCP OAuth helpers and authorization flow
 *
 * Given a remote MCP public URL configuration and the in-memory OAuth store
 * When clients register, users consent and sign in, and tokens are exchanged
 * Then completed registrations survive token expiry, pending registrations are bounded, redirect targets are limited, operations use the subject RBAC permissions, and oversized bodies are refused
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

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  get RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS() {
    return Number(process.env.RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS || 3600);
  },
  get RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS() {
    return Number(
      process.env.RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS || 86400,
    );
  },
}));

const oauthEnv = {
  MCP_SERVICE_PUBLIC_BASE_URL: "https://mcp.example.com",
  MCP_SERVICE_PUBLIC_URL: "https://mcp.example.com/mcp",
  MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET: "internal-exchange-secret",
  MCP_SERVICE_OAUTH_JWT_SECRET: "mcp-oauth-secret",
  MCP_SERVICE_OAUTH_STORE: "memory",
  RBAC_JWT_SECRET: "rbac-jwt-secret",
  KV_PROVIDER: "memory",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: "3600",
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS: "86400",
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
   * Then it advertises the MCP resource, authorization server, and the connection scope
   */
  it("exposes protected resource metadata for the MCP endpoint", () => {
    expect(getProtectedResourceMetadata()).toEqual({
      resource: "https://mcp.example.com/mcp",
      authorization_servers: ["https://mcp.example.com"],
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp:content"],
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
      scopes_supported: ["mcp:content"],
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
   * Then the access-only token is bounded by the RBAC JWT lifetime, resolves to that rbac.subject, and keeps the profile agent's delete access
   */
  it("issues an access-only MCP token with the shared RBAC lifetime", async () => {
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
      expires_in: 3600,
      scope: "mcp:content",
    });
    expect(response).not.toHaveProperty("refresh_token");
    expect(verified).toMatchObject({
      clientId: "internal-rbac-subject",
      scopes: ["mcp:content"],
      rbacSubjectId: "rbac-subject-1",
      rbacSubjectAuthenticationJwt,
    });
    expect(verified.expiresAt).toBeGreaterThanOrEqual(before + 3600);
    expect(verified.expiresAt).toBeLessThanOrEqual(before + 3601);
    expect(accessPayload).toMatchObject({
      sub: "rbac-subject-1",
      client_id: "internal-rbac-subject",
      scope: "mcp:content",
    });
  });

  it("caps MCP access at the actual remaining lifetime of the subject JWT", async () => {
    const subjectToken = jwt.sign(
      { subject: { id: "rbac-subject-1" } },
      "rbac-jwt-secret",
      { expiresIn: 15 },
    );
    const response = await exchangeRbacSubjectAuthenticationJwtForMcpToken({
      providedSecret: "internal-exchange-secret",
      body: { subject_token: subjectToken },
    });

    expect(response.expires_in).toBeGreaterThan(0);
    expect(response.expires_in).toBeLessThanOrEqual(15);
    expect(
      (jwt.decode(response.access_token) as JwtPayload).exp,
    ).toBeLessThanOrEqual((jwt.decode(subjectToken) as JwtPayload).exp!);
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

  it("expires only pending registrations independently of the RBAC refresh lifetime", async () => {
    process.env.RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS = "60";
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    const client = await createClient([clientRedirectUri]);

    clock.mockReturnValue(now + 61 * 1000);
    expect((await authorizePage(client.client_id)).status).toBe(200);

    clock.mockReturnValue(now + 86401 * 1000);
    expect((await authorizePage(client.client_id)).status).toBe(400);
  });

  it("signs in again with the same client after both user tokens expire", async () => {
    process.env.RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS = "30";
    process.env.RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS = "60";
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    const client = await createClient([clientRedirectUri]);
    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const original = JSON.parse(
      (await exchangeCode(client.client_id, code, clientRedirectUri)).body,
    );

    clock.mockReturnValue(now + 86401 * 1000);
    await expect(verifyMcpAccessToken(original.access_token)).rejects.toThrow();
    const expiredRefresh = await refreshToken(
      client.client_id,
      original.refresh_token,
    );
    expect(JSON.parse(expiredRefresh.body).error).toBe("invalid_grant");
    expect((await authorizePage(client.client_id)).status).toBe(200);

    const nextCode = await obtainCode(client.client_id, {
      scope: "mcp:content",
    });
    const next = await exchangeCode(
      client.client_id,
      nextCode,
      clientRedirectUri,
    );
    expect(next.status).toBe(200);
    expect(
      (await verifyMcpAccessToken(JSON.parse(next.body).access_token)).clientId,
    ).toBe(client.client_id);
  });

  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "allows changing only the HTTP loopback port on %s",
    async (hostname) => {
      const registered = `http://${hostname}/callback?source=cli`;
      const callback = `http://${hostname}:42139/callback?source=cli`;
      const client = await createClient([registered]);
      expect(
        (await authorizePage(client.client_id, { redirectUri: callback }))
          .status,
      ).toBe(200);
      const code = await obtainCode(client.client_id, {
        scope: "mcp:content",
        redirectUri: callback,
      });

      // Even a permitted loopback port must match the specific authorization code.
      const mismatch = await exchangeCode(client.client_id, code, registered);
      expect(mismatch.status).toBe(400);
      expect(
        (await exchangeCode(client.client_id, code, callback)).status,
      ).toBe(200);
    },
  );

  it.each([
    [
      "http://127.0.0.1:41000/callback?a=1",
      "http://localhost:42000/callback?a=1",
    ],
    ["http://localhost:41000/callback?a=1", "http://localhost:42000/other?a=1"],
    [
      "http://localhost:41000/callback?a=1",
      "http://localhost:42000/callback?a=2",
    ],
    [
      "http://localhost:41000/callback",
      "http://localhost.evil.example:42000/callback",
    ],
    ["http://localhost:41000/callback", "http://user@localhost:42000/callback"],
    [
      "http://localhost:41000/callback",
      "http://localhost:42000/callback#fragment",
    ],
    ["http://localhost:41000/callback", "https://localhost:42000/callback"],
    [
      "http://localhost:41000/callback",
      "http://localhost:42000/other/../callback",
    ],
    [
      "https://client.example:41000/callback",
      "https://client.example:42000/callback",
    ],
    ["https://localhost:41000/callback", "https://localhost:42000/callback"],
  ])(
    "rejects callback changes beyond a loopback port: %s -> %s",
    async (registered, requested) => {
      const client = await createClient([registered]);
      expect(
        (await authorizePage(client.client_id, { redirectUri: requested }))
          .status,
      ).toBe(400);
    },
  );

  it("renews the RBAC session while keeping the client identity", async () => {
    process.env.RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS = "30";
    process.env.RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS = "120";
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    const client = await createClient([clientRedirectUri]);
    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const token = await exchangeCode(client.client_id, code, clientRedirectUri);
    const original = JSON.parse(token.body);
    expect(original.expires_in).toBe(30);
    const initial = await verifyMcpAccessToken(original.access_token);

    clock.mockReturnValue(now + 90 * 1000);
    await expect(verifyMcpAccessToken(original.access_token)).rejects.toThrow();
    const response = await refreshToken(
      client.client_id,
      original.refresh_token,
    );
    expect(response.status).toBe(200);
    const renewed = JSON.parse(response.body);
    const verified = await verifyMcpAccessToken(renewed.access_token);
    expect(verified.rbacSubjectId).toBe(initial.rbacSubjectId);
    expect(verified.rbacSubjectAuthenticationJwt).not.toBe(
      initial.rbacSubjectAuthenticationJwt,
    );
    expect(renewed.refresh_token).not.toBe(original.refresh_token);
    expect(renewed.expires_in).toBe(30);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/authentication/refresh"),
      expect.objectContaining({ redirect: "error" }),
    );
    expect(
      (await refreshToken(client.client_id, original.refresh_token)).status,
    ).toBe(400);
    clock.mockReturnValue(now + 150 * 1000);
    expect((await authorizePage(client.client_id)).status).toBe(200);
  });

  it("rejects refreshing after the RBAC refresh lifetime", async () => {
    process.env.RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS = "60";
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    const client = await createClient([clientRedirectUri]);
    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const token = JSON.parse(
      (await exchangeCode(client.client_id, code, clientRedirectUri)).body,
    );
    clock.mockReturnValue(now + 61 * 1000);
    const calls = (globalThis.fetch as jest.Mock).mock.calls.length;
    expect(
      (await refreshToken(client.client_id, token.refresh_token)).status,
    ).toBe(400);
    expect((globalThis.fetch as jest.Mock).mock.calls.length).toBe(calls);
  });

  it("accepts an OAuth refresh token only once across concurrent requests", async () => {
    const client = await createClient([clientRedirectUri]);
    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const token = JSON.parse(
      (await exchangeCode(client.client_id, code, clientRedirectUri)).body,
    );
    const responses = await Promise.all([
      refreshToken(client.client_id, token.refresh_token),
      refreshToken(client.client_id, token.refresh_token),
    ]);
    expect(responses.map((item) => item.status).sort()).toEqual([200, 400]);
  });

  it("preserves RBAC refresh rejection without issuing another token", async () => {
    const client = await createClient([clientRedirectUri]);
    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const token = JSON.parse(
      (await exchangeCode(client.client_id, code, clientRedirectUri)).body,
    );
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Authentication error. Revoked" }),
        { status: 401 },
      ),
    );
    const response = await refreshToken(client.client_id, token.refresh_token);
    expect(response.status).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ error: "invalid_grant" });
  });

  it("rejects a renewed RBAC session for a different subject", async () => {
    const client = await createClient([clientRedirectUri]);
    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const token = JSON.parse(
      (await exchangeCode(client.client_id, code, clientRedirectUri)).body,
    );
    (globalThis.fetch as jest.Mock).mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ data: createRbacCredentials("another-subject") }),
          { status: 200 },
        ),
    );
    expect(
      (await refreshToken(client.client_id, token.refresh_token)).status,
    ).toBe(400);
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

  it("describes the subject permissions without a separate delete choice", async () => {
    const client = await createClient([clientRedirectUri]);
    const page = await authorizePage(client.client_id);
    expect(page.body).not.toContain('name="allow_delete"');
    expect(page.body).toContain("your role permits it");
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

  it("issues one connection scope regardless of unknown requested scopes", async () => {
    const client = await createClient([clientRedirectUri]);
    const code = await obtainCode(client.client_id, {
      scope: "openid mcp:content unknown",
    });
    const response = await exchangeCode(
      client.client_id,
      code,
      clientRedirectUri,
    );
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.scope).toBe("mcp:content");
    expect((await verifyMcpAccessToken(body.access_token)).scopes).toEqual([
      "mcp:content",
    ]);
  });

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
  it("keeps a confidential connector's secret valid for sign-in and refresh", async () => {
    const registration = await registerClient([clientRedirectUri], {
      token_endpoint_auth_method: "client_secret_post",
    });
    const client = JSON.parse(registration.body);
    expect(client.client_secret).toBeTruthy();
    const code = await obtainCode(client.client_id, { scope: "mcp:content" });
    const fields = {
      grant_type: "authorization_code",
      client_id: client.client_id,
      client_secret: "wrong-secret",
      redirect_uri: clientRedirectUri,
      code,
      code_verifier: codeVerifier,
    };
    const invalid = await sendOAuthRequest({
      method: "POST",
      path: "/oauth/token",
      body: new URLSearchParams(fields).toString(),
    });
    expect(JSON.parse(invalid.body)).toMatchObject({ error: "invalid_client" });
    fields.client_secret = client.client_secret;
    const exchange = await sendOAuthRequest({
      method: "POST",
      path: "/oauth/token",
      body: new URLSearchParams(fields).toString(),
    });
    expect(exchange.status).toBe(200);
    const renewed = await sendOAuthRequest({
      method: "POST",
      path: "/oauth/token",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: client.client_id,
        client_secret: client.client_secret,
        refresh_token: JSON.parse(exchange.body).refresh_token,
      }).toString(),
    });
    expect(renewed.status).toBe(200);
    expect(
      await verifyMcpAccessToken(JSON.parse(renewed.body).access_token),
    ).toMatchObject({
      clientId: client.client_id,
    });
  });

  it("bounds pending registrations and releases capacity after sign-in or expiry", async () => {
    const now = Date.now() + 365 * 86400 * 1000;
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    const first = await createClient([clientRedirectUri]);
    for (let count = 1; count < 1000; count += 1) {
      expect((await registerClient([clientRedirectUri])).status).toBe(201);
    }
    expect((await registerClient([clientRedirectUri])).status).toBe(429);

    const code = await obtainCode(first.client_id, { scope: "mcp:content" });
    expect(
      (await exchangeCode(first.client_id, code, clientRedirectUri)).status,
    ).toBe(200);
    expect((await registerClient([clientRedirectUri])).status).toBe(201);
    expect((await registerClient([clientRedirectUri])).status).toBe(429);

    clock.mockReturnValue(now + 86401 * 1000);
    expect((await registerClient([clientRedirectUri])).status).toBe(201);
    expect((await authorizePage(first.client_id)).status).toBe(200);
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
  props: { scope: string; redirectUri?: string },
) {
  const signIn = await submitAuthorize(
    clientId,
    {
      consent: "approve",
    },
    props,
  );
  const approvedScope = signIn.body.match(/name="scope" value="([^"]*)"/)?.[1];

  expect(signIn.body).toContain('name="password"');

  jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ data: createRbacCredentials("rbac-subject-5") }),
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
    { ...props, scope: approvedScope },
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

function createRbacSubjectAuthenticationJwt(
  subjectId: string,
  expiresIn = Number(process.env.RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS || 3600),
) {
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

function createRbacCredentials(subjectId: string) {
  return {
    jwt: createRbacSubjectAuthenticationJwt(subjectId),
    refresh: createRbacSubjectAuthenticationJwt(
      subjectId,
      Number(process.env.RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS || 86400),
    ),
  };
}

function refreshToken(clientId: string, token: string) {
  return sendOAuthRequest({
    method: "POST",
    path: "/oauth/token",
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: token,
    }).toString(),
  });
}
