/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social chat client request credentials.
 *
 * Given: a signed-in browser whose session JWT sits in the rbac.subject.jwt
 *        cookie, and a stubbed fetch.
 * When: the chat client reads a chat's messages.
 * Then: the request carries the session as a bearer Authorization header next
 *       to any caller headers.
 */

import { api } from "@sps/social/models/chat/sdk/client";

const fetchMock = jest.fn();

describe("Given: a signed-in browser reads chat messages", () => {
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
   * BDD Scenario: the message read sends the session header.
   *
   * Given: the session cookie holds a JWT and the caller adds its own header.
   * When: messageFind sends its request.
   * Then: the request carries Authorization: Bearer <jwt> and the caller
   *       header.
   */
  it("sends the session header with messageFind", async () => {
    await api.messageFind({
      id: "chat-id",
      options: { headers: { "X-Request-Id": "request-1" } },
    });

    const headers = new Headers(fetchMock.mock.calls[0][1].headers);

    expect(fetchMock.mock.calls[0][0]).toContain("/chat-id/messages");
    expect(headers.get("Authorization")).toBe("Bearer session-jwt");
    expect(headers.get("X-Request-Id")).toBe("request-1");
  });
});
