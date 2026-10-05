/**
 * BDD Suite: is-authorized middleware decisions after a logout.
 *
 * Given: the middleware in front of a protected route and of the logout
 * route, with the subject authorization call stubbed.
 * When: tokens are authorized, answered again from the decision cache, and
 * then their subject logs out.
 * Then: the next request with any token of that subject is not answered from
 * the cache but reaches the subject service, which refuses it; tokens of other
 * subjects keep their cached decisions.
 */

const mockIsAuthorized = jest.fn();

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    authenticationIsAuthorized: (...args: unknown[]) =>
      mockIsAuthorized(...args),
  },
}));

import { Hono } from "hono";
import * as jwt from "hono/jwt";
import { RBAC_REVOKED_SUBJECT_CONTEXT_KEY } from "@sps/shared-utils";
import { Middleware } from ".";

/**
 * The stubbed service decides; the middleware only reads the subject a token
 * names, so any signing secret will do.
 */
function signToken(subjectId: string, jti: string) {
  return jwt.sign({ jti, subject: { id: subjectId } }, "test-secret");
}

function createApp() {
  const app = new Hono<{
    Variables: Record<typeof RBAC_REVOKED_SUBJECT_CONTEXT_KEY, string>;
  }>();

  app.use(new Middleware().init());
  app.get("/api/ecommerce/orders", (c) => {
    return c.json({ data: [] });
  });
  app.post("/api/rbac/subjects/authentication/logout", async (c) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const { payload } = jwt.decode(token);
      const subject = payload["subject"] as { id: string };

      c.set(RBAC_REVOKED_SUBJECT_CONTEXT_KEY, subject.id);
    }

    return c.json({ data: { ok: true } });
  });

  return app;
}

type IApp = ReturnType<typeof createApp>;

function readOrders(app: IApp, token: string) {
  return app.request("/api/ecommerce/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function logout(app: IApp, token: string) {
  return app.request("/api/rbac/subjects/authentication/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe("Given: the is-authorized middleware caches decisions per token", () => {
  beforeEach(() => {
    mockIsAuthorized.mockReset();
  });

  /**
   * BDD Scenario
   * Given: a token whose decision for a protected route is cached.
   * When: its subject logs out with that token and the token is presented
   * again within the cache lifetime.
   * Then: the request goes to the subject service again and its refusal
   * reaches the caller as 401.
   */
  it("When: a token is logged out Then: its cached decisions are not trusted", async () => {
    const app = createApp();
    const token = await signToken("subject-logged-out", "token-1");

    mockIsAuthorized.mockResolvedValue({ ok: true });

    expect((await readOrders(app, token)).status).toBe(200);
    expect((await readOrders(app, token)).status).toBe(200);
    expect(mockIsAuthorized).toHaveBeenCalledTimes(1);

    expect((await logout(app, token)).status).toBe(200);

    mockIsAuthorized.mockRejectedValue(
      new Error("Authentication error. Token revoked"),
    );

    expect((await readOrders(app, token)).status).toBe(401);
    expect(mockIsAuthorized).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario
   * Given: two tokens of one subject, such as two devices, each with a
   * cached decision.
   * When: the subject logs out with one of them.
   * Then: the other token is not answered from the cache either, because
   * logout revokes every token of the subject.
   */
  it("When: the subject logs out with another token Then: this token is not answered from the cache", async () => {
    const app = createApp();
    const phone = await signToken("subject-two-devices", "token-phone");
    const laptop = await signToken("subject-two-devices", "token-laptop");

    mockIsAuthorized.mockResolvedValue({ ok: true });

    expect((await readOrders(app, laptop)).status).toBe(200);
    expect((await logout(app, phone)).status).toBe(200);

    mockIsAuthorized.mockRejectedValue(
      new Error("Authentication error. Token revoked"),
    );

    expect((await readOrders(app, laptop)).status).toBe(401);
    expect(mockIsAuthorized).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario
   * Given: tokens of two subjects with cached decisions.
   * When: one subject logs out.
   * Then: the other subject's token is still answered from the cache.
   */
  it("When: another subject logs out Then: this token keeps its cached decision", async () => {
    const app = createApp();
    const kept = await signToken("subject-kept", "token-kept");
    const other = await signToken("subject-other", "token-other");

    mockIsAuthorized.mockResolvedValue({ ok: true });

    expect((await readOrders(app, kept)).status).toBe(200);
    expect((await logout(app, other)).status).toBe(200);
    expect((await readOrders(app, kept)).status).toBe(200);
    expect(mockIsAuthorized).toHaveBeenCalledTimes(1);
  });
});
