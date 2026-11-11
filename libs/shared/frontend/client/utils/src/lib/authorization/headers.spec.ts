/**
 * BDD Suite: authorization headers.
 *
 * Given: the browser keeps its session JWT in the rbac.subject.jwt cookie.
 * When: request headers are built from document.cookie.
 * Then: the JWT becomes a bearer Authorization header and no other cookie,
 *       including an rbac.secret-key cookie, becomes a credential header.
 */

import { util as headers } from "./headers";

describe("authorization headers", () => {
  afterEach(() => {
    delete (global as any).document;
  });

  /**
   * BDD Scenario: the session cookie becomes the bearer header.
   *
   * Given: document.cookie holds rbac.subject.jwt among other cookies.
   * When: headers are built.
   * Then: only Authorization: Bearer <jwt> is returned.
   */
  it("extracts the jwt from cookies as a bearer header", () => {
    Object.defineProperty(global, "document", {
      value: {
        cookie: "foo=bar; rbac.subject.jwt=test-jwt-token",
      },
      configurable: true,
    });

    expect(headers()).toEqual({
      Authorization: "Bearer test-jwt-token",
    });
  });

  /**
   * BDD Scenario: the operator secret never leaves the browser as a header.
   *
   * Given: document.cookie also holds an rbac.secret-key cookie.
   * When: headers are built.
   * Then: X-RBAC-SECRET-KEY is not sent; the secret belongs to services.
   */
  it("does not forward an rbac.secret-key cookie as X-RBAC-SECRET-KEY", () => {
    Object.defineProperty(global, "document", {
      value: {
        cookie:
          "foo=bar; rbac.subject.jwt=test-jwt-token; rbac.secret-key=test-secret",
      },
      configurable: true,
    });

    expect(headers()).toEqual({
      Authorization: "Bearer test-jwt-token",
    });
  });

  /**
   * BDD Scenario: no session cookie.
   *
   * Given: document.cookie holds no authentication cookie.
   * When: headers are built.
   * Then: an empty object is returned.
   */
  it("returns empty object when cookies do not contain auth keys", () => {
    Object.defineProperty(global, "document", {
      value: {
        cookie: "foo=bar; hello=world",
      },
      configurable: true,
    });

    expect(headers()).toEqual({});
  });
});
