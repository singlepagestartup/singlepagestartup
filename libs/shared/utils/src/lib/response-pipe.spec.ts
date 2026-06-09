/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: responsePipe error handling.
 *
 * Given: response handling may recover from expected API errors or browser auth state.
 * When: non-OK API responses are processed with catch or client-side throw behavior.
 * Then: expected silent statuses skip noisy logs while existing auth recovery behavior remains intact.
 */

import { util as responsePipe } from "./response-pipe";

describe("Given: client-side unauthorized responses", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario: Recoverable unauthorized response.
   *
   * Given: the browser still has a refresh token.
   * When: responsePipe handles a 401 response.
   * Then: the existing browser authorization state is preserved.
   */
  it("When: a 401 happens and a refresh token still exists Then: the browser auth state is preserved", async () => {
    localStorage.setItem("rbac.subject.refresh", "refresh-token");
    document.cookie = "rbac.subject.jwt=jwt-token; path=/";

    const response = new Response(
      JSON.stringify({
        message:
          "token(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9) signature mismatched",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(responsePipe({ res: response })).rejects.toMatchObject({
      message:
        "token(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9) signature mismatched",
      status: 401,
    });

    expect(localStorage.getItem("rbac.subject.refresh")).toBe("refresh-token");
    expect(document.cookie).toContain("rbac.subject.jwt=jwt-token");
  });

  /**
   * BDD Scenario: Unrecoverable unauthorized response.
   *
   * Given: the browser has no refresh token.
   * When: responsePipe handles a 401 response.
   * Then: the browser authorization state is cleared.
   */
  it("When: a 401 happens without a refresh token Then: browser auth state is cleared", async () => {
    document.cookie = "rbac.subject.jwt=jwt-token; path=/";

    const response = new Response(
      JSON.stringify({
        message: "Authorization error. Token required",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(responsePipe({ res: response })).rejects.toMatchObject({
      message: "Session expired. Please sign in again.",
      status: 401,
    });

    expect(localStorage.getItem("rbac.subject.refresh")).toBeNull();
    expect(document.cookie).not.toContain("rbac.subject.jwt=jwt-token");
  });
});

describe("Given: catchErrors response handling", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario: Expected not-found response.
   *
   * Given: catchErrors is enabled and 404 is configured as silent.
   * When: responsePipe handles a 404 API response.
   * Then: it returns undefined without logging an API error.
   */
  it("When: a silent 404 happens Then: no API error is logged", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const response = new Response(
      JSON.stringify({
        error: "Not Found error. Page with url /missing not found",
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(
      responsePipe({
        res: response,
        catchErrors: true,
        silentErrorStatuses: [404],
      }),
    ).resolves.toBeUndefined();

    expect(consoleError).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Non-silent caught response.
   *
   * Given: catchErrors is enabled and only 404 is configured as silent.
   * When: responsePipe handles a 500 API response.
   * Then: it preserves the existing API error log behavior.
   */
  it("When: a non-silent error happens Then: the API error is logged", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const response = new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(
      responsePipe({
        res: response,
        catchErrors: true,
        silentErrorStatuses: [404],
      }),
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      "❌ API Error:",
      expect.stringContaining('"status": 500'),
    );
  });
});
