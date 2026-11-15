/**
 * BDD Suite: OAuth start controller reads the current session from the header.
 *
 * Given: the start handler mounted on a Hono app, with the OAuth service
 *        stubbed to return an authorization URL.
 * When: a browser starts a sign-in or link flow.
 * Then: the service receives the JWT from the Authorization header, and a JWT
 *       held only in a cookie is not treated as the current session.
 */

import { Hono } from "hono";
import { Handler } from "./start";

function createStartRoute() {
  const service = {
    authenticationOAuthStart: jest.fn().mockResolvedValue({
      authorizationUrl: "https://accounts.example/authorize",
    }),
  };
  const handler = new Handler(service as any);
  const hono = new Hono();

  hono.post("/oauth/:provider", (c, next) => handler.execute(c, next));

  return { hono, service };
}

describe("Given: a browser starts an OAuth flow", () => {
  /**
   * BDD Scenario: the current session in the header.
   *
   * Given: a signed-in browser sends its JWT as Authorization: Bearer.
   * When: the flow starts.
   * Then: the service receives that JWT as the current session.
   */
  it("passes the bearer JWT to the service as the current session", async () => {
    const { hono, service } = createStartRoute();

    const response = await hono.request("/oauth/google", {
      method: "POST",
      headers: { Authorization: "Bearer header-jwt" },
    });

    expect(response.status).toBe(201);
    expect(service.authenticationOAuthStart).toHaveBeenCalledWith({
      provider: "google",
      authorization: "header-jwt",
      data: undefined,
    });
  });

  /**
   * BDD Scenario: a cookie is not a session.
   *
   * Given: a browser whose JWT sits only in an rbac.subject.jwt cookie.
   * When: the flow starts.
   * Then: the service receives no current session.
   */
  it("does not treat a JWT that arrives only in a cookie as the session", async () => {
    const { hono, service } = createStartRoute();

    await hono.request("/oauth/google", {
      method: "POST",
      headers: { Cookie: "rbac.subject.jwt=cookie-jwt" },
    });

    expect(service.authenticationOAuthStart).toHaveBeenCalledWith({
      provider: "google",
      authorization: undefined,
      data: undefined,
    });
  });
});
