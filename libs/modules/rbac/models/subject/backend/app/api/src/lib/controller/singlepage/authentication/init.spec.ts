/**
 * BDD Suite: session initialization response.
 *
 * Given: the init handler mounted on a Hono app, with the session service
 *        stubbed to issue a token pair.
 * When: a browser or a service initializes a session.
 * Then: the token pair comes back in the body, no session cookie is written,
 *       and only a JWT in the Authorization header is offered for reuse.
 */

import { Hono } from "hono";
import { Handler } from "./init";

function createInitRoute() {
  const service = {
    init: jest.fn().mockResolvedValue({
      jwt: "session-jwt",
      refresh: "refresh-jwt",
      subject: { id: "subject-id" },
      reused: false,
    }),
  };
  const handler = new Handler(service as any);
  const hono = new Hono();

  hono.get("/init", (c, next) => handler.execute(c, next));

  return { hono, service };
}

describe("Given: a caller initializes a session", () => {
  /**
   * BDD Scenario: the token pair travels in the body only.
   *
   * Given: a caller without a token.
   * When: init answers.
   * Then: it returns 201 with jwt and refresh and sets no cookie.
   */
  it("answers with the token pair and writes no session cookie", async () => {
    const { hono } = createInitRoute();

    const response = await hono.request("/init");

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      data: { jwt: "session-jwt", refresh: "refresh-jwt" },
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  /**
   * BDD Scenario: a bearer token is offered for reuse.
   *
   * Given: a caller that sends its JWT as Authorization: Bearer.
   * When: init answers.
   * Then: the service receives that token, so the session is reused.
   */
  it("offers a bearer token to the service for reuse", async () => {
    const { hono, service } = createInitRoute();

    await hono.request("/init", {
      headers: { Authorization: "Bearer header-jwt" },
    });

    expect(service.init).toHaveBeenCalledWith({ token: "header-jwt" });
  });

  /**
   * BDD Scenario: a cookie is not a session.
   *
   * Given: a caller whose JWT sits only in an rbac.subject.jwt cookie.
   * When: init answers.
   * Then: the service receives no token and starts a new session.
   */
  it("does not offer a JWT that arrives only in a cookie", async () => {
    const { hono, service } = createInitRoute();

    await hono.request("/init", {
      headers: { Cookie: "rbac.subject.jwt=cookie-jwt" },
    });

    expect(service.init).toHaveBeenCalledWith({ token: undefined });
  });
});
