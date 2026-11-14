/**
 * BDD Suite: session refresh response.
 *
 * Given: the refresh handler mounted on a Hono app, with the session service
 *        stubbed to rotate a token pair.
 * When: a browser exchanges its refresh token.
 * Then: the new token pair comes back in the body and no session cookie is
 *       written.
 */

import { Hono } from "hono";
import { Handler } from "./refresh";

function createRefreshRoute() {
  const service = {
    refresh: jest.fn().mockResolvedValue({
      jwt: "next-session-jwt",
      refresh: "next-refresh-jwt",
    }),
  };
  const handler = new Handler(service as any);
  const hono = new Hono();

  hono.post("/refresh", (c, next) => handler.execute(c, next));

  return { hono, service };
}

function refreshForm(refresh: string) {
  const body = new FormData();

  body.set("data", JSON.stringify({ refresh }));

  return body;
}

describe("Given: a browser refreshes its session", () => {
  /**
   * BDD Scenario: the rotated pair travels in the body only.
   *
   * Given: a request with a refresh token in its form data.
   * When: refresh answers.
   * Then: it returns 201 with the new pair and sets no cookie.
   */
  it("answers with the new token pair and writes no session cookie", async () => {
    const { hono, service } = createRefreshRoute();

    const response = await hono.request("/refresh", {
      method: "POST",
      body: refreshForm("refresh-jwt"),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      data: { jwt: "next-session-jwt", refresh: "next-refresh-jwt" },
    });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(service.refresh).toHaveBeenCalledWith({ refresh: "refresh-jwt" });
  });
});
