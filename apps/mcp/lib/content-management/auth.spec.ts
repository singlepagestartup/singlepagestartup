/**
 * BDD Suite: MCP content-management RBAC auth helper
 * Given MCP content-management tools call server SDK adapters
 * When SDK options are built for protected API calls
 * Then the RBAC secret header is provided or a configuration error is raised
 */

import { getRbacHeaders, getRbacSdkOptions } from "./auth";

const originalRbacSecretKey = process.env.RBAC_SECRET_KEY;

describe("MCP content-management RBAC auth helper", () => {
  afterEach(() => {
    process.env.RBAC_SECRET_KEY = originalRbacSecretKey;
  });

  /**
   * BDD Scenario: RBAC headers use the runtime secret
   * Given RBAC_SECRET_KEY is configured
   * When the MCP helper builds SDK headers
   * Then the API RBAC header is returned
   */
  it("returns RBAC headers from the runtime environment", () => {
    process.env.RBAC_SECRET_KEY = "test-secret";

    expect(getRbacHeaders()).toEqual({
      "X-RBAC-SECRET-KEY": "test-secret",
    });
    expect(getRbacSdkOptions()).toEqual({
      headers: {
        "X-RBAC-SECRET-KEY": "test-secret",
      },
    });
  });

  /**
   * BDD Scenario: Missing RBAC secret is rejected
   * Given RBAC_SECRET_KEY is not configured
   * When the MCP helper builds SDK headers
   * Then a configuration error prevents an unauthenticated SDK call
   */
  it("throws when RBAC_SECRET_KEY is missing", () => {
    delete process.env.RBAC_SECRET_KEY;

    expect(() => getRbacHeaders()).toThrow(
      "Configuration error. RBAC_SECRET_KEY is not set",
    );
  });
});
