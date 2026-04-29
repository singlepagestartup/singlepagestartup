/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: responsePipe authentication recovery.
 *
 * Given: browser authorization state may include a JWT cookie and an independent refresh token.
 * When: client-side response handling receives unauthorized API responses during page bootstrap.
 * Then: recoverable sessions keep their refresh token for silent recovery, while unrecoverable sessions are cleared.
 */

import { util as responsePipe } from "./response-pipe";

describe("Given: client-side unauthorized responses", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
  });

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
