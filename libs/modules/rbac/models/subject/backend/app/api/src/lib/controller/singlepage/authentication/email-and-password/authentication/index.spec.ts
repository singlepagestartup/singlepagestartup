/**
 * BDD Suite: email-and-password login response.
 *
 * Given: the login handler mounted on a Hono app, with the service stubbed to
 *        accept the credentials and issue a token pair.
 * When: a browser signs in with an email and a password.
 * Then: the token pair comes back in the body and no session cookie is
 *       written.
 */

import { Hono } from "hono";
import { Handler } from "./index";

function createLoginRoute() {
  const service = {
    authenticationLoginAndPassowrd: jest.fn().mockResolvedValue({
      jwt: "session-jwt",
      refresh: "refresh-jwt",
    }),
  };
  const handler = new Handler(service as any);
  const hono = new Hono();

  hono.post("/authentication", (c, next) => handler.execute(c, next));

  return { hono, service };
}

describe("Given: a browser signs in with an email and a password", () => {
  /**
   * BDD Scenario: the pair travels in the body only.
   *
   * Given: a request with the credentials in its form data.
   * When: the handler answers.
   * Then: it returns 201 with the token pair, sets no cookie, and asks the
   *       service for an authentication rather than a registration.
   */
  it("answers with the token pair and writes no session cookie", async () => {
    const { hono, service } = createLoginRoute();
    const credentials = {
      login: "person@example.com",
      password: "a-password",
    };
    const body = new FormData();

    body.set("data", JSON.stringify(credentials));

    const response = await hono.request("/authentication", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      data: { jwt: "session-jwt", refresh: "refresh-jwt" },
    });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(service.authenticationLoginAndPassowrd).toHaveBeenCalledWith({
      data: credentials,
      type: "authentication",
    });
  });
});
