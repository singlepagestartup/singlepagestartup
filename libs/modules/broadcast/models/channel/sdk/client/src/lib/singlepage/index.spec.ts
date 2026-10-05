/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: broadcast channel client request credentials.
 *
 * Given: a signed-in browser whose session JWT sits in the rbac.subject.jwt
 *        cookie, and a stubbed fetch.
 * When: a hand-written broadcast channel client function sends its request.
 * Then: the request carries the session as a bearer Authorization header next
 *       to any caller headers, like every factory request does.
 */

import { api } from "@sps/broadcast/models/channel/sdk/client";

const fetchMock = jest.fn();

function requestHeaders() {
  return new Headers(fetchMock.mock.calls[0][1].headers);
}

describe("Given: a signed-in browser calls the broadcast channel client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    document.cookie = "rbac.subject.jwt=session-jwt; path=/";
  });

  afterEach(() => {
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
  });

  /**
   * BDD Scenario: each hand-written function sends the session header.
   *
   * Given: the session cookie holds a JWT and the caller adds its own header.
   * When: the function sends its request.
   * Then: the request carries Authorization: Bearer <jwt> and the caller
   *       header.
   */
  it.each([
    [
      "pushMessage",
      () =>
        api.pushMessage({
          data: { slug: "channel", payload: "message" },
          options: { headers: { "X-Request-Id": "request-1" } },
        }),
    ],
    [
      "messageCreate",
      () =>
        api.messageCreate({
          id: "channel-id",
          data: { payload: "message" },
          options: { headers: { "X-Request-Id": "request-1" } },
        }),
    ],
    [
      "messageDelete",
      () =>
        api.messageDelete({
          id: "channel-id",
          messageId: "message-id",
          options: { headers: { "X-Request-Id": "request-1" } },
        }),
    ],
    [
      "messageFind",
      () =>
        api.messageFind({
          id: "channel-id",
          options: { headers: { "X-Request-Id": "request-1" } },
        }),
    ],
  ])("%s sends the session header", async (_name, send) => {
    await send();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestHeaders().get("Authorization")).toBe("Bearer session-jwt");
    expect(requestHeaders().get("X-Request-Id")).toBe("request-1");
  });
});
