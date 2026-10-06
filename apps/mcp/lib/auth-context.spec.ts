/**
 * BDD Suite: MCP outbound credential forwarding
 *
 * Given the MCP process patches fetch to forward the caller's credentials
 * When code calls the SinglePageStartup API or any other origin, with or without a request context
 * Then only requests to the API origin receive the request credentials or the local operator secret
 */
import { API_SERVICE_URL } from "@sps/shared-utils";
import {
  installMcpFetchAuthForwarding,
  runWithMcpRequestAuthContext,
} from "./auth-context";

describe("MCP outbound credential forwarding", () => {
  const originalFetch = globalThis.fetch;
  const originalOperatorSecret = process.env["RBAC_SECRET_KEY"];
  const sent: Array<{ url: string; headers: Headers }> = [];
  const apiUrl = `${API_SERVICE_URL}/api/blog/articles`;
  const otherUrl = "https://files.example.com/cover.webp";

  beforeAll(() => {
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      sent.push({ url: String(input), headers: new Headers(init?.headers) });

      return new Response("{}");
    }) as typeof fetch;
    installMcpFetchAuthForwarding();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    process.env["RBAC_SECRET_KEY"] = originalOperatorSecret;
  });

  beforeEach(() => {
    sent.length = 0;
    process.env["RBAC_SECRET_KEY"] = "local-operator-secret";
  });

  /**
   * BDD Scenario: Request credentials reach the API
   *
   * Given an MCP request authenticated with a subject JWT
   * When a tool calls the API
   * Then the API request carries that Authorization header
   */
  it("forwards the request context credentials to the API", async () => {
    await runWithMcpRequestAuthContext(
      { authorization: "Bearer subject-jwt" },
      () => fetch(apiUrl),
    );

    expect(sent[0].headers.get("authorization")).toBe("Bearer subject-jwt");
  });

  /**
   * BDD Scenario: The local operator secret reaches the API
   *
   * Given no MCP request context, as in a stdio process
   * When code calls the API
   * Then the API request carries the operator secret from the environment
   */
  it("sends the local operator secret to the API without a request context", async () => {
    await fetch(apiUrl);

    expect(sent[0].headers.get("x-rbac-secret-key")).toBe(
      "local-operator-secret",
    );
  });

  /**
   * BDD Scenario: Other origins receive no credentials
   *
   * Given a request context with a JWT and a secret, and a call without any context
   * When code fetches a URL on another origin
   * Then neither request carries Authorization or X-RBAC-SECRET-KEY
   */
  it("sends no credentials to another origin", async () => {
    await runWithMcpRequestAuthContext(
      { authorization: "Bearer subject-jwt", rbacSecretKey: "request-secret" },
      () => fetch(otherUrl),
    );
    await fetch(otherUrl);

    expect(sent).toHaveLength(2);

    for (const request of sent) {
      expect(request.url).toBe(otherUrl);
      expect(request.headers.has("authorization")).toBe(false);
      expect(request.headers.has("x-rbac-secret-key")).toBe(false);
    }
  });
});
