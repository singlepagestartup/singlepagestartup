/**
 * BDD Suite: subject ownership guard token type.
 *
 * Given: a subject route guarded by the request-subject-is-owner middleware.
 * When: the owner presents an access token or a refresh token of their own
 *       subject in the Authorization header.
 * Then: the access token passes and the refresh token is refused, because
 *       only an access token authorizes an action.
 */

const mockJwtSecret = "configured-jwt-secret";

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    RBAC_JWT_SECRET: mockJwtSecret,
    RBAC_SECRET_KEY: "configured-operator-secret",
  };
});

import { Hono } from "hono";
import { signJwt, type TJwtType } from "@sps/backend-utils";
import { Middleware } from "./index";

const OWNER_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

function createOwnerRoute() {
  const handler = jest.fn((c: any) => c.json({ ok: true }));
  const hono = new Hono();

  hono.get("/api/rbac/subjects/:id", new Middleware().init(), handler);

  return { handler, hono };
}

function requestWithOwnerToken(hono: Hono, type: TJwtType) {
  return signJwt(
    { subjectId: OWNER_ID, type, lifetimeInSeconds: 600 },
    mockJwtSecret,
  ).then((token) =>
    hono.request(`/api/rbac/subjects/${OWNER_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

describe("Given: the ownership guard reads the owner's token type", () => {
  /**
   * BDD Scenario: the owner's access token.
   *
   * Given: an access token naming the subject in the route.
   * When: the guard evaluates it.
   * Then: the route runs.
   */
  it("lets the owner through with an access token", async () => {
    const { handler, hono } = createOwnerRoute();

    const response = await requestWithOwnerToken(hono, "access");

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: the owner's refresh token.
   *
   * Given: a valid refresh token naming the subject in the route.
   * When: the guard evaluates it.
   * Then: it is refused with 401 and the route does not run.
   */
  it("refuses the owner's refresh token", async () => {
    const { handler, hono } = createOwnerRoute();

    const response = await requestWithOwnerToken(hono, "refresh");

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});
