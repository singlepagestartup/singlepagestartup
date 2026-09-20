/**
 * BDD Suite: the subject owner middleware reads a configured route parameter.
 *
 * Given: routes that name the subject id differently - "id" on most, "uuid" on the identity routes.
 * When: the middleware is constructed for a route with that parameter name.
 * Then: ownership is checked against that parameter, and a token for another subject is refused.
 */

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "test-jwt-secret",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

import { Hono } from "hono";
import * as jwt from "hono/jwt";
import { Middleware } from ".";

const SUBJECT_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_SUBJECT_ID = "22222222-2222-2222-2222-222222222222";

async function createToken(subjectId: string) {
  return jwt.sign({ subject: { id: subjectId } }, "test-jwt-secret");
}

function createApp(options?: { param?: string }) {
  const app = new Hono();

  app.post("/subjects/:uuid/identities", new Middleware().init(options), (c) =>
    c.json({ ok: true }),
  );

  return app;
}

describe("Given: a route names the subject id something other than 'id'", () => {
  /**
   * BDD Scenario: the owner of the named subject.
   *
   * Given: a route registered with ":uuid" and a token for that subject.
   * When: the middleware is configured with that parameter name.
   * Then: the request reaches the handler.
   */
  it("admits the owner when the configured parameter matches the token", async () => {
    const response = await createApp({ param: "uuid" }).request(
      `/subjects/${SUBJECT_ID}/identities`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${await createToken(SUBJECT_ID)}` },
      },
    );

    expect(response.status).toBe(200);
  });

  /**
   * BDD Scenario: a token for somebody else.
   *
   * Given: a route registered with ":uuid".
   * When: the token names a different subject.
   * Then: the request is refused before the handler runs.
   */
  it("refuses a token that names another subject", async () => {
    const response = await createApp({ param: "uuid" }).request(
      `/subjects/${SUBJECT_ID}/identities`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await createToken(OTHER_SUBJECT_ID)}`,
        },
      },
    );

    expect(response.status).toBe(401);
  });

  /**
   * BDD Scenario: no token at all.
   *
   * Given: a route registered with ":uuid".
   * When: the request carries neither a token nor the secret key.
   * Then: it is refused.
   */
  it("refuses a request with no token", async () => {
    const response = await createApp({ param: "uuid" }).request(
      `/subjects/${SUBJECT_ID}/identities`,
      { method: "POST" },
    );

    expect(response.status).toBe(400);
  });

  /**
   * BDD Scenario: the default is unchanged.
   *
   * Given: the middleware is constructed without options, as every existing
   * route constructs it.
   * When: the route parameter is named "uuid" and so no "id" is present.
   * Then: the request is refused, which is the behaviour those routes rely on.
   */
  it("still looks at 'id' when no parameter name is configured", async () => {
    const response = await createApp().request(
      `/subjects/${SUBJECT_ID}/identities`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${await createToken(SUBJECT_ID)}` },
      },
    );

    expect(response.status).toBe(400);
  });
});
