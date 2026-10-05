/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social profile client request credentials.
 *
 * Given: a signed-in browser whose session JWT sits in the rbac.subject.jwt
 *        cookie, and a stubbed fetch.
 * When: the profile client reads a profile's chats.
 * Then: the request carries the session as a bearer Authorization header next
 *       to any caller headers.
 */

import { api } from "@sps/social/models/profile/sdk/client";

const fetchMock = jest.fn();

describe("Given: a signed-in browser reads a profile's chats", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    document.cookie = "rbac.subject.jwt=session-jwt; path=/";
  });

  afterEach(() => {
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
  });

  /**
   * BDD Scenario: the chat read sends the session header.
   *
   * Given: the session cookie holds a JWT and the caller adds its own header.
   * When: findByIdChatFind sends its request.
   * Then: the request carries Authorization: Bearer <jwt> and the caller
   *       header.
   */
  it("sends the session header with findByIdChatFind", async () => {
    await api.findByIdChatFind({
      id: "profile-id",
      options: { headers: { "X-Request-Id": "request-1" } },
    });

    const headers = new Headers(fetchMock.mock.calls[0][1].headers);

    expect(fetchMock.mock.calls[0][0]).toContain("/profile-id/chats");
    expect(headers.get("Authorization")).toBe("Bearer session-jwt");
    expect(headers.get("X-Request-Id")).toBe("request-1");
  });
});
