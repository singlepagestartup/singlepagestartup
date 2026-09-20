/**
 * BDD Suite: require-RBAC-secret route middleware.
 *
 * Given: a route guarded by the middleware on a Hono app.
 * When: a request arrives with, without or with a wrong secret.
 * Then: only the correct secret reaches the handler, and the refusal says
 *       nothing about the expected credential.
 */

let mockConfiguredSecret: string | undefined;

jest.mock("@sps/shared-utils", () => ({
  get RBAC_SECRET_KEY() {
    return mockConfiguredSecret;
  },
}));

import { Hono } from "hono";
import { Middleware } from "./index";

const CONFIGURED_SECRET = "configured-operator-secret";

function createGuardedApp() {
  const app = new Hono();
  const handler = jest.fn((c: any) => c.json({ ok: true }));

  app.get("/dump", new Middleware().init(), handler);

  return { app, handler };
}

describe("Given: a dump route is guarded by the operator credential", () => {
  beforeEach(() => {
    mockConfiguredSecret = CONFIGURED_SECRET;
  });

  /**
   * BDD Scenario: the header carries the configured secret.
   *
   * Given: a deployment with RBAC_SECRET_KEY set.
   * When: the caller sends that value in the X-RBAC-SECRET-KEY header.
   * Then: the handler runs.
   */
  it("passes a request whose header carries the configured secret", async () => {
    const { app, handler } = createGuardedApp();

    const response = await app.request("/dump", {
      headers: { "X-RBAC-SECRET-KEY": CONFIGURED_SECRET },
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: the cookie carries the configured secret.
   *
   * Given: a caller that presents the credential the way the MCP transport
   *        documents it.
   * When: the request carries only the rbac.secret-key cookie.
   * Then: the handler runs.
   */
  it("passes a request whose rbac.secret-key cookie carries the configured secret", async () => {
    const { app, handler } = createGuardedApp();

    const response = await app.request("/dump", {
      headers: { Cookie: `rbac.secret-key=${CONFIGURED_SECRET}` },
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: an anonymous caller.
   *
   * Given: a request with no credential.
   * When: the guarded route is called.
   * Then: it answers 401 and the handler never runs, so the table is neither
   *       read nor rewritten.
   */
  it("refuses an anonymous request before the handler runs", async () => {
    const { app, handler } = createGuardedApp();

    const response = await app.request("/dump");

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a wrong credential.
   *
   * Given: a caller holding a value that is not the configured secret.
   * When: the guarded route is called.
   * Then: it answers 401 and the handler never runs.
   */
  it("refuses a request carrying a wrong secret", async () => {
    const { app, handler } = createGuardedApp();

    const response = await app.request("/dump", {
      headers: { "X-RBAC-SECRET-KEY": "not-the-configured-secret" },
    });

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the refusal is silent about the credential.
   *
   * Given: a refused request.
   * When: its body and headers are inspected.
   * Then: neither names the header nor repeats the configured value.
   */
  it("does not disclose the expected credential in a refusal", async () => {
    const { app } = createGuardedApp();

    const response = await app.request("/dump");
    const body = await response.text();

    expect(body).not.toContain(CONFIGURED_SECRET);
    expect(body.toLowerCase()).not.toContain("rbac-secret-key");
    expect(body.toLowerCase()).not.toContain("rbac_secret_key");
  });
});

describe("Given: a deployment configured no operator credential", () => {
  /**
   * BDD Scenario: the guard fails closed.
   *
   * Given: a deployment with RBAC_SECRET_KEY unset.
   * When: any caller reaches the guarded route, with or without a credential.
   * Then: every request is refused rather than admitted.
   */
  it("refuses every caller when RBAC_SECRET_KEY is unset", async () => {
    mockConfiguredSecret = undefined;
    const { app, handler } = createGuardedApp();

    const anonymous = await app.request("/dump");
    const credentialed = await app.request("/dump", {
      headers: { "X-RBAC-SECRET-KEY": CONFIGURED_SECRET },
    });

    expect(anonymous.status).toBe(401);
    expect(credentialed.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});
