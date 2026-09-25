/**
 * BDD Suite: logout server SDK action.
 *
 * Given: a caller that identifies the subject to log out with an
 * Authorization header, as the client SDK and server-side callers do.
 * When: the server SDK posts to the logout route.
 * Then: the caller's headers reach the request together with the no-store
 * header, so the API can revoke the tokens of the presented subject.
 */

import { action } from "./logout";

function mockFetch() {
  return jest.fn().mockResolvedValue(
    new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("logout server SDK action", () => {
  /**
   * BDD Scenario: the caller presents its access token.
   *
   * Given: request options carrying an Authorization header.
   * When: the SDK action runs.
   * Then: the logout route is posted with that Authorization header and the
   * no-store header.
   */
  it("sends the caller's Authorization header to the logout route", async () => {
    const originalFetch = global.fetch;
    global.fetch = mockFetch();

    try {
      await action({
        host: "https://api.example.com",
        options: {
          headers: {
            Authorization: "Bearer access-token-1",
          },
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/rbac/subjects/authentication/logout?",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Cache-Control": "no-store",
            Authorization: "Bearer access-token-1",
          },
        }),
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  /**
   * BDD Scenario: the caller passes no headers.
   *
   * Given: request options without headers.
   * When: the SDK action runs.
   * Then: the logout route is still posted with the no-store header.
   */
  it("keeps the no-store header when the caller passes no headers", async () => {
    const originalFetch = global.fetch;
    global.fetch = mockFetch();

    try {
      await action({ host: "https://api.example.com" });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/rbac/subjects/authentication/logout?",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Cache-Control": "no-store",
          },
        }),
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
