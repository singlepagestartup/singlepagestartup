/**
 * BDD Suite: Operator credential on service control routes.
 *
 * Given: a service control route composed behind the operator middleware.
 * When: a request arrives with a matching, mismatched, or absent
 *       X-RBAC-SECRET-KEY header, or with the secret only in a cookie.
 * Then: only the matching credential reaches the handler, the rejection
 *       echoes neither the submitted value nor the configured one and does
 *       not name the header, and a service with no configured secret rejects
 *       every caller instead of admitting every caller.
 */

const mockConfiguredSecret = "3f1c8a0d5e7b2946af13c0d8e5b7a2946";

let mockRbacSecretKey: string | undefined = mockConfiguredSecret;

jest.mock("@sps/shared-utils", () => {
  return {
    get RBAC_SECRET_KEY() {
      return mockRbacSecretKey;
    },
  };
});

import { Hono } from "hono";
import { Middleware } from "./index";

function createControlRoute() {
  const handler = jest.fn((c: any) => c.json({ ok: true }));
  const hono = new Hono();

  hono.post("/stop", new Middleware().init(), handler);

  return { handler, hono };
}

describe("operator credential on service control routes", () => {
  beforeEach(() => {
    mockRbacSecretKey = mockConfiguredSecret;
  });

  /**
   * BDD Scenario
   * Given: a request to a control route carries no operator credential.
   * When: the operator middleware evaluates it.
   * Then: the request is rejected before the handler runs.
   */
  it("When: the credential is absent Then: the control route is not reached", async () => {
    const { handler, hono } = createControlRoute();

    const response = await hono.request("/stop", { method: "POST" });

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a request carries an operator credential that does not match the configured secret.
   * When: the operator middleware evaluates it.
   * Then: the request is rejected with the same response as a missing credential.
   */
  it("When: the credential does not match Then: the rejection is indistinguishable from an absent one", async () => {
    const submitted = "0000000000000000000000000000000000";
    const { handler, hono } = createControlRoute();

    const rejected = await hono.request("/stop", {
      method: "POST",
      headers: { "X-RBAC-SECRET-KEY": submitted },
    });
    const absent = await createControlRoute().hono.request("/stop", {
      method: "POST",
    });
    const body = await rejected.text();

    expect(rejected.status).toBe(absent.status);
    expect(body).toBe(await absent.text());
    expect(body).not.toContain(submitted);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a request is refused by the operator middleware.
   * When: the body of the refusal is read.
   * Then: it names neither the credential header nor the configured secret.
   */
  it("When: a request is refused Then: the body discloses neither the header nor the configured secret", async () => {
    const { hono } = createControlRoute();

    const response = await hono.request("/stop", { method: "POST" });
    const body = (await response.text()).toLowerCase();

    expect(response.status).toBe(401);
    expect(body).not.toContain(mockConfiguredSecret.toLowerCase());
    expect(body).not.toContain("rbac-secret-key");
    expect(body).not.toContain("rbac_secret_key");
  });

  /**
   * BDD Scenario
   * Given: a request carries the configured operator credential.
   * When: the operator middleware evaluates it.
   * Then: the request continues to the handler.
   */
  it("When: the credential matches Then: the control route runs", async () => {
    const { handler, hono } = createControlRoute();

    const response = await hono.request("/stop", {
      method: "POST",
      headers: { "X-RBAC-SECRET-KEY": mockConfiguredSecret },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: no operator secret is configured in the environment.
   * When: any request reaches the operator middleware.
   * Then: the request is rejected rather than allowed through.
   */
  it("When: no secret is configured Then: every caller is rejected", async () => {
    mockRbacSecretKey = undefined;
    const unset = createControlRoute();

    const withoutHeader = await unset.hono.request("/stop", { method: "POST" });
    const withHeader = await unset.hono.request("/stop", {
      method: "POST",
      headers: { "X-RBAC-SECRET-KEY": "anything" },
    });

    expect(withoutHeader.status).toBe(401);
    expect(withHeader.status).toBe(401);
    expect(unset.handler).not.toHaveBeenCalled();

    mockRbacSecretKey = "";
    const empty = createControlRoute();

    const withEmptySecretConfigured = await empty.hono.request("/stop", {
      method: "POST",
      headers: { "X-RBAC-SECRET-KEY": "" },
    });

    expect(withEmptySecretConfigured.status).toBe(401);
    expect(empty.handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a browser holds the configured operator secret in an rbac.secret-key cookie.
   * When: a control route is called with that cookie and no header.
   * Then: the request is refused like one without a credential, because the
   *       secret is accepted only from the X-RBAC-SECRET-KEY header.
   */
  it("When: the credential arrives only in a cookie Then: the control route is not reached", async () => {
    const { handler, hono } = createControlRoute();

    const response = await hono.request("/stop", {
      method: "POST",
      headers: { Cookie: `rbac.secret-key=${mockConfiguredSecret}` },
    });

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});
