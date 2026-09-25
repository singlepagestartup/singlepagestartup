/**
 * BDD Suite: RBAC secret comparison.
 *
 * Given: a deployment whose RBAC_SECRET_KEY, or another configured secret, may
 *        be set, empty or absent.
 * When: a caller-supplied secret is compared against it.
 * Then: only an exact match passes, and an unconfigured secret refuses every
 *       caller instead of accepting an empty one.
 */

let mockConfiguredSecret: string | undefined;

jest.mock("@sps/shared-utils", () => ({
  get RBAC_SECRET_KEY() {
    return mockConfiguredSecret;
  },
}));

import { Hono } from "hono";
import { rbacSecretMatches, readRbacSecret, secretMatches } from "./index";

const CONFIGURED_SECRET = "configured-operator-secret";

function createSecretReadingApp() {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({ secret: readRbacSecret(c) ?? null });
  });

  return app;
}

describe("Given: a caller presents the operator credential", () => {
  beforeEach(() => {
    mockConfiguredSecret = CONFIGURED_SECRET;
  });

  /**
   * BDD Scenario: the caller holds the configured secret.
   *
   * Given: a deployment with RBAC_SECRET_KEY set.
   * When: the caller presents exactly that value.
   * Then: the comparison passes.
   */
  it("accepts a secret that matches the configured value", () => {
    expect(rbacSecretMatches(CONFIGURED_SECRET)).toBe(true);
  });

  /**
   * BDD Scenario: a near miss of the same length.
   *
   * Given: a deployment with RBAC_SECRET_KEY set.
   * When: the caller presents a value differing in a single byte.
   * Then: the comparison fails.
   */
  it("rejects a secret of the same length that differs in one byte", () => {
    const nearMiss = `${CONFIGURED_SECRET.slice(0, -1)}X`;

    expect(nearMiss).toHaveLength(CONFIGURED_SECRET.length);
    expect(rbacSecretMatches(nearMiss)).toBe(false);
  });

  /**
   * BDD Scenario: a candidate of a different length.
   *
   * Given: a deployment with RBAC_SECRET_KEY set.
   * When: the caller presents a shorter or longer value.
   * Then: the comparison fails instead of throwing, because timingSafeEqual
   *       rejects buffers of unequal size.
   */
  it("rejects a secret of a different length without throwing", () => {
    expect(() => rbacSecretMatches("short")).not.toThrow();
    expect(rbacSecretMatches("short")).toBe(false);
    expect(rbacSecretMatches(`${CONFIGURED_SECRET}-and-more`)).toBe(false);
  });

  /**
   * BDD Scenario: no credential at all.
   *
   * Given: a deployment with RBAC_SECRET_KEY set.
   * When: the caller presents nothing.
   * Then: the comparison fails.
   */
  it("rejects an absent, null or empty caller secret", () => {
    expect(rbacSecretMatches()).toBe(false);
    expect(rbacSecretMatches(undefined)).toBe(false);
    expect(rbacSecretMatches(null)).toBe(false);
    expect(rbacSecretMatches("")).toBe(false);
  });
});

describe("Given: a deployment configured no operator credential", () => {
  /**
   * BDD Scenario: RBAC_SECRET_KEY is absent.
   *
   * Given: a deployment that never set the variable.
   * When: any caller is compared against it.
   * Then: every caller is refused, including one presenting nothing.
   */
  it("refuses every caller when the secret is unset", () => {
    mockConfiguredSecret = undefined;

    expect(rbacSecretMatches("any-value")).toBe(false);
    expect(rbacSecretMatches("")).toBe(false);
    expect(rbacSecretMatches(undefined)).toBe(false);
  });

  /**
   * BDD Scenario: RBAC_SECRET_KEY is the empty string.
   *
   * Given: a deployment that set the variable to an empty value.
   * When: a caller presents the same empty value.
   * Then: the caller is still refused, so an empty secret opens nothing.
   */
  it("refuses every caller when the secret is the empty string", () => {
    mockConfiguredSecret = "";

    expect(rbacSecretMatches("")).toBe(false);
    expect(rbacSecretMatches("any-value")).toBe(false);
  });
});

describe("Given: a route secret other than the operator credential", () => {
  const ROUTE_SECRET = "configured-route-secret";

  /**
   * BDD Scenario: the caller holds the route secret.
   *
   * Given: a secret configured for one route.
   * When: the caller presents exactly that value.
   * Then: the comparison passes.
   */
  it("accepts a candidate that matches the configured secret", () => {
    expect(secretMatches(ROUTE_SECRET, ROUTE_SECRET)).toBe(true);
  });

  /**
   * BDD Scenario: near misses and other lengths.
   *
   * Given: a secret configured for one route.
   * When: the caller presents a value differing in one byte or in length.
   * Then: the comparison fails without throwing.
   */
  it("rejects a one-byte miss and a candidate of another length", () => {
    const nearMiss = `${ROUTE_SECRET.slice(0, -1)}X`;

    expect(secretMatches(ROUTE_SECRET, nearMiss)).toBe(false);
    expect(() => secretMatches(ROUTE_SECRET, "short")).not.toThrow();
    expect(secretMatches(ROUTE_SECRET, "short")).toBe(false);
  });

  /**
   * BDD Scenario: the route secret is not configured.
   *
   * Given: a route whose secret is absent or the empty string.
   * When: a caller presents nothing, an empty value or any value.
   * Then: every caller is refused, so an unset secret opens nothing.
   */
  it("refuses every candidate when the configured secret is unset or empty", () => {
    expect(secretMatches(undefined, undefined)).toBe(false);
    expect(secretMatches(undefined, "any-value")).toBe(false);
    expect(secretMatches(null, null)).toBe(false);
    expect(secretMatches("", "")).toBe(false);
    expect(secretMatches("", "any-value")).toBe(false);
  });
});

describe("Given: a request carries the credential in a header or a cookie", () => {
  beforeEach(() => {
    mockConfiguredSecret = CONFIGURED_SECRET;
  });

  /**
   * BDD Scenario: the header carries the credential.
   *
   * Given: a request with an X-RBAC-SECRET-KEY header.
   * When: the credential is read from the request.
   * Then: the header value is returned.
   */
  it("reads the credential from the X-RBAC-SECRET-KEY header", async () => {
    const response = await createSecretReadingApp().request("/", {
      headers: { "X-RBAC-SECRET-KEY": CONFIGURED_SECRET },
    });

    await expect(response.json()).resolves.toEqual({
      secret: CONFIGURED_SECRET,
    });
  });

  /**
   * BDD Scenario: only the cookie carries the credential.
   *
   * Given: a request with an rbac.secret-key cookie and no header.
   * When: the credential is read from the request.
   * Then: the cookie value is returned, so the documented MCP transport keeps
   *       working.
   */
  it("falls back to the rbac.secret-key cookie when no header is sent", async () => {
    const response = await createSecretReadingApp().request("/", {
      headers: { Cookie: `rbac.secret-key=${CONFIGURED_SECRET}` },
    });

    await expect(response.json()).resolves.toEqual({
      secret: CONFIGURED_SECRET,
    });
  });

  /**
   * BDD Scenario: both sources are present.
   *
   * Given: a request whose header and cookie disagree.
   * When: the credential is read from the request.
   * Then: the header wins, matching the order is-authorized already uses.
   */
  it("prefers the header over the cookie when both are present", async () => {
    const response = await createSecretReadingApp().request("/", {
      headers: {
        "X-RBAC-SECRET-KEY": CONFIGURED_SECRET,
        Cookie: "rbac.secret-key=cookie-secret",
      },
    });

    await expect(response.json()).resolves.toEqual({
      secret: CONFIGURED_SECRET,
    });
  });

  /**
   * BDD Scenario: neither source is present.
   *
   * Given: a request with no credential.
   * When: the credential is read from the request.
   * Then: nothing is returned.
   */
  it("returns nothing when the request carries no credential", async () => {
    const response = await createSecretReadingApp().request("/");

    await expect(response.json()).resolves.toEqual({ secret: null });
  });
});
