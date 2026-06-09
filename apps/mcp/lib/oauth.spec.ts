/**
 * BDD Suite: MCP OAuth helpers
 *
 * Given a remote MCP public URL configuration
 * When OAuth metadata and PKCE values are generated
 * Then the helpers expose connector-compatible resource metadata and S256 challenges
 */
import {
  createPkceChallenge,
  getAuthorizationServerMetadata,
  getProtectedResourceMetadata,
  getWwwAuthenticateHeader,
  isOAuthRoute,
} from "./oauth";

describe("MCP OAuth helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MCP_PUBLIC_BASE_URL: "https://mcp.example.com",
      MCP_PUBLIC_URL: "https://mcp.example.com/mcp",
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
});
