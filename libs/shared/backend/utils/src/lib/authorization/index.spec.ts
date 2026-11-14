/**
 * BDD Suite: subject JWT reader.
 *
 * Given: requests that present a subject JWT in the Authorization header, only
 *        in an rbac.subject.jwt cookie, or both.
 * When: the JWT is read from the request.
 * Then: only the Authorization header counts, with or without its Bearer
 *       prefix, and a cookie is never read.
 */

import { Hono } from "hono";
import { util as authorization } from "./index";

function createTokenReadingApp() {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({ token: authorization(c) ?? null });
  });

  return app;
}

describe("Given: a request presents a subject JWT", () => {
  /**
   * BDD Scenario: the bearer header.
   *
   * Given: a request with Authorization: Bearer <jwt>.
   * When: the JWT is read.
   * Then: the token without its prefix is returned.
   */
  it("reads the JWT from a bearer Authorization header", async () => {
    const response = await createTokenReadingApp().request("/", {
      headers: { Authorization: "Bearer header-jwt" },
    });

    await expect(response.json()).resolves.toEqual({ token: "header-jwt" });
  });

  /**
   * BDD Scenario: a raw token in the header.
   *
   * Given: a request whose Authorization header holds the bare token, as the
   *        API's own middlewares forward it.
   * When: the JWT is read.
   * Then: the token is returned as it is.
   */
  it("reads a bare token from the Authorization header", async () => {
    const response = await createTokenReadingApp().request("/", {
      headers: { Authorization: "header-jwt" },
    });

    await expect(response.json()).resolves.toEqual({ token: "header-jwt" });
  });

  /**
   * BDD Scenario: only a cookie.
   *
   * Given: a request whose JWT sits only in an rbac.subject.jwt cookie.
   * When: the JWT is read.
   * Then: nothing is returned, so the caller is anonymous.
   */
  it("ignores a JWT that arrives only in an rbac.subject.jwt cookie", async () => {
    const response = await createTokenReadingApp().request("/", {
      headers: { Cookie: "rbac.subject.jwt=cookie-jwt" },
    });

    await expect(response.json()).resolves.toEqual({ token: null });
  });

  /**
   * BDD Scenario: header and cookie disagree.
   *
   * Given: a request with a JWT in both places.
   * When: the JWT is read.
   * Then: the header value is returned.
   */
  it("reads the header when a cookie is present as well", async () => {
    const response = await createTokenReadingApp().request("/", {
      headers: {
        Authorization: "Bearer header-jwt",
        Cookie: "rbac.subject.jwt=cookie-jwt",
      },
    });

    await expect(response.json()).resolves.toEqual({ token: "header-jwt" });
  });
});
