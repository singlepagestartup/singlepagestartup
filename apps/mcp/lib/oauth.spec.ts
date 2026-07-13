/**
 * BDD Suite: MCP OAuth helpers
 *
 * Given a remote MCP public URL configuration
 * When OAuth metadata and PKCE values are generated
 * Then the helpers expose connector-compatible resource metadata and S256 challenges
 */
import {
  createPkceChallenge,
  exchangeEmployeeSpsJwtForMcpToken,
  getAuthorizationServerMetadata,
  getProtectedResourceMetadata,
  getWwwAuthenticateHeader,
  INTERNAL_EMPLOYEE_TOKEN_EXCHANGE_PATH,
  isInternalEmployeeTokenExchangeRoute,
  isOAuthRoute,
  verifyMcpAccessToken,
} from "./oauth";
import jwt, { type JwtPayload } from "jsonwebtoken";

describe("MCP OAuth helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MCP_PUBLIC_BASE_URL: "https://mcp.example.com",
      MCP_PUBLIC_URL: "https://mcp.example.com/mcp",
      MCP_INTERNAL_TOKEN_EXCHANGE_SECRET: "internal-exchange-secret",
      MCP_OAUTH_JWT_SECRET: "mcp-oauth-secret",
      MCP_OAUTH_STORE: "memory",
      RBAC_JWT_SECRET: "rbac-jwt-secret",
      KV_PROVIDER: "memory",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  /**
   * BDD Scenario: Protected resource metadata
   *
   * Given MCP_PUBLIC_URL points to the remote streamable HTTP endpoint
   * When protected resource metadata is generated
   * Then it advertises the MCP resource and authorization server
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
   * Given MCP_PUBLIC_BASE_URL points to the connector host
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
   * BDD Scenario: Internal employee token exchange route
   *
   * Given the MCP HTTP server receives a route path
   * When the internal employee exchange route is matched
   * Then only the dedicated internal endpoint is accepted
   */
  it("matches only the dedicated internal employee exchange endpoint", () => {
    expect(
      isInternalEmployeeTokenExchangeRoute(
        INTERNAL_EMPLOYEE_TOKEN_EXCHANGE_PATH,
      ),
    ).toBe(true);
    expect(isInternalEmployeeTokenExchangeRoute("/oauth/token")).toBe(false);
    expect(isOAuthRoute(INTERNAL_EMPLOYEE_TOKEN_EXCHANGE_PATH)).toBe(false);
  });

  /**
   * BDD Scenario: Employee JWT exchange
   *
   * Given a valid SPS JWT for an employee subject and the internal service secret
   * When the JWT is exchanged for an MCP token
   * Then the access-only token lasts five minutes and resolves to that employee
   */
  it("issues a five-minute access-only MCP token for the verified employee", async () => {
    const subjectToken = createEmployeeSpsJwt("employee-subject-1");
    const before = Math.floor(Date.now() / 1000);
    const response = await exchangeEmployeeSpsJwtForMcpToken({
      providedSecret: "internal-exchange-secret",
      body: {
        subject_token: subjectToken,
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
      scope: "mcp:content",
    });
    expect(response).not.toHaveProperty("refresh_token");
    expect(verified).toMatchObject({
      clientId: "internal-rbac-openrouter",
      scopes: ["mcp:content"],
      subject: "employee-subject-1",
      spsJwt: subjectToken,
    });
    expect(verified.expiresAt).toBeGreaterThanOrEqual(before + 300);
    expect(verified.expiresAt).toBeLessThanOrEqual(before + 301);
    expect(accessPayload).toMatchObject({
      sub: "employee-subject-1",
      client_id: "internal-rbac-openrouter",
      scope: "mcp:content",
    });
  });

  /**
   * BDD Scenario: Wrong internal exchange secret
   *
   * Given a valid employee SPS JWT but an incorrect service secret
   * When internal exchange is attempted
   * Then no MCP credential is issued
   */
  it("rejects an incorrect internal token exchange secret", async () => {
    await expect(
      exchangeEmployeeSpsJwtForMcpToken({
        providedSecret: "wrong-secret",
        body: {
          subject_token: createEmployeeSpsJwt("employee-subject-2"),
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
   * Given a valid JWT for one employee and a separate subject id in the request
   * When internal exchange is attempted
   * Then the request is rejected instead of trusting caller-controlled identity
   */
  it("rejects separately supplied employee subject identifiers", async () => {
    await expect(
      exchangeEmployeeSpsJwtForMcpToken({
        providedSecret: "internal-exchange-secret",
        body: {
          subject_token: createEmployeeSpsJwt("employee-subject-3"),
          subjectId: "attacker-controlled-subject",
        },
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "invalid_request",
    });
  });

  /**
   * BDD Scenario: Invalid or expired employee credential
   *
   * Given a malformed or expired SPS JWT
   * When internal exchange verifies the subject token
   * Then the request is rejected without deriving a fallback subject
   */
  it.each([
    ["invalid", "not-a-jwt"],
    ["expired", createEmployeeSpsJwt("employee-subject-4", -1)],
  ])("rejects an %s employee SPS JWT", async (_label, subjectToken) => {
    await expect(
      exchangeEmployeeSpsJwtForMcpToken({
        providedSecret: "internal-exchange-secret",
        body: {
          subject_token: subjectToken,
        },
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "invalid_subject_token",
    });
  });

  /**
   * BDD Scenario: Employee JWT has no subject
   *
   * Given a correctly signed SPS JWT without subject.id
   * When internal exchange verifies the token
   * Then it rejects the credential rather than using a generic fallback subject
   */
  it("rejects a signed employee JWT without subject.id", async () => {
    const subjectToken = jwt.sign(
      { subject: {} },
      process.env["RBAC_JWT_SECRET"] as string,
      { expiresIn: 60 },
    );

    await expect(
      exchangeEmployeeSpsJwtForMcpToken({
        providedSecret: "internal-exchange-secret",
        body: {
          subject_token: subjectToken,
        },
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "invalid_subject_token",
    });
  });
});

function createEmployeeSpsJwt(subjectId: string, expiresIn = 60) {
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
