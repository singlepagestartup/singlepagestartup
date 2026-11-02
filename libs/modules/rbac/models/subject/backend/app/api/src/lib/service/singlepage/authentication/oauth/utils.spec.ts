/**
 * BDD Suite: OAuth redirect target normalisation.
 *
 * Given: the host origin is configured and a caller supplies a redirect target.
 * When: the target is normalised before it is stored and before it is used.
 * Then: only same-origin paths survive; every other shape falls back to the configured default.
 */

const mockEnvs = {
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://host.example",
  RBAC_OAUTH_SUCCESS_REDIRECT_PATH: "/",
};

jest.mock("@sps/shared-utils", () => ({
  get NEXT_PUBLIC_HOST_SERVICE_URL() {
    return mockEnvs.NEXT_PUBLIC_HOST_SERVICE_URL;
  },
  get RBAC_OAUTH_SUCCESS_REDIRECT_PATH() {
    return mockEnvs.RBAC_OAUTH_SUCCESS_REDIRECT_PATH;
  },
}));

import {
  getHostRedirectOrigins,
  resolveDefaultRedirectPath,
  resolveRedirectTarget,
} from "./utils";

describe("Given: a redirect target reaches the OAuth flow", () => {
  beforeEach(() => {
    mockEnvs.NEXT_PUBLIC_HOST_SERVICE_URL = "https://host.example";
    mockEnvs.RBAC_OAUTH_SUCCESS_REDIRECT_PATH = "/";
  });

  function resolve(target: unknown) {
    return resolveRedirectTarget({
      target,
      allowedOrigins: getHostRedirectOrigins(),
    });
  }

  /**
   * BDD Scenario: a path on the host origin.
   *
   * Given: the target is a plain path with a query and a fragment.
   * When: it is normalised.
   * Then: it survives unchanged.
   */
  it("keeps a same-origin path unchanged", () => {
    expect(resolve("/a/b?c=d#e")).toBe("/a/b?c=d#e");
  });

  /**
   * BDD Scenario: an authority-relative target.
   *
   * Given: the target starts with a double slash, so a prefix test accepts it.
   * When: it is normalised.
   * Then: the configured default is returned instead of the foreign origin.
   */
  it("falls back to the default when the target resolves to another origin", () => {
    expect(resolve("//evil.example/steal")).toBe("/");
  });

  /**
   * BDD Scenario: a slash followed by a backslash.
   *
   * Given: the target is the shape the URL parser folds into an authority.
   * When: it is normalised.
   * Then: the configured default is returned.
   */
  it("falls back to the default when the target contains a backslash", () => {
    expect(resolve("/\\evil.example/steal")).toBe("/");
  });

  /**
   * BDD Scenario: an absolute URL.
   *
   * Given: the target names an origin the operator did not configure.
   * When: it is normalised.
   * Then: the configured default is returned.
   */
  it("falls back to the default for an absolute URL", () => {
    expect(resolve("https://evil.example/steal")).toBe("/");
  });

  /**
   * BDD Scenario: nothing usable was supplied.
   *
   * Given: the target is empty, missing or not a string.
   * When: it is normalised.
   * Then: the configured default is returned for each shape.
   */
  it("falls back to the default for an empty or non-string target", () => {
    expect(resolve("")).toBe("/");
    expect(resolve(undefined)).toBe("/");
    expect(resolve(null)).toBe("/");
    expect(resolve({ toString: () => "/injected" })).toBe("/");
  });

  /**
   * BDD Scenario: a misconfigured environment.
   *
   * Given: RBAC_OAUTH_SUCCESS_REDIRECT_PATH is itself authority-relative.
   * When: the default is resolved, with no attacker involved.
   * Then: it is refused and "/" is used.
   */
  it('falls back to "/" when the configured default is itself not same-origin', () => {
    mockEnvs.RBAC_OAUTH_SUCCESS_REDIRECT_PATH = "//evil.example/steal";

    expect(
      resolveDefaultRedirectPath({ allowedOrigins: getHostRedirectOrigins() }),
    ).toBe("/");
    expect(resolve("//evil.example/steal")).toBe("/");
  });

  /**
   * BDD Scenario: a configured default that is a real path.
   *
   * Given: the operator points the flow at a landing page.
   * When: a target is refused.
   * Then: the browser goes to that landing page.
   */
  it("uses the configured default when it is a same-origin path", () => {
    mockEnvs.RBAC_OAUTH_SUCCESS_REDIRECT_PATH = "/account";

    expect(resolve("https://evil.example/steal")).toBe("/account");
  });

  /**
   * BDD Scenario: a project that redirects to a second origin.
   *
   * Given: the service seam widened the allowed origins.
   * When: a target on the second origin is normalised.
   * Then: it is accepted, and an origin outside the list still is not.
   */
  it("accepts a target on an origin the project allowed", () => {
    const allowedOrigins = [
      ...getHostRedirectOrigins(),
      "https://second.example",
    ];

    expect(
      resolveRedirectTarget({
        target: "https://second.example/landing",
        allowedOrigins,
      }),
    ).toBe("https://second.example/landing");
    expect(
      resolveRedirectTarget({
        target: "https://evil.example/steal",
        allowedOrigins,
      }),
    ).toBe("/");
  });
});
