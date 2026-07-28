/**
 * BDD Suite: subject cart aggregate cache policy.
 *
 * Given: cart data can change through checkout jobs and cleanup outside the browser.
 * When: a cart aggregate is requested through the subject SDK.
 * Then: the request bypasses browser, Next.js, and API HTTP caches.
 */

import { action as list } from "./list";
import { action as quantity } from "./quantity";
import { action as total } from "./total";

describe("subject cart aggregate cache policy", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ data: [] }), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * BDD Scenario: every cart aggregate bypasses stale HTTP data.
   *
   * Given: a caller supplies its own request headers and a cache preference.
   * When: list, quantity, and total are fetched.
   * Then: caller headers are preserved while no-store remains enforced.
   */
  it("forces no-store for list, quantity, and total requests", async () => {
    const props = {
      id: "subject-id",
      host: "http://api.test",
      options: {
        cache: "force-cache" as const,
        headers: {
          Authorization: "Bearer test",
        },
      },
    };

    await list(props);
    await quantity(props);
    await total(props);

    expect(global.fetch).toHaveBeenCalledTimes(3);

    for (const [, options] of (global.fetch as jest.Mock).mock.calls) {
      expect(options).toMatchObject({
        cache: "no-store",
        credentials: "include",
        method: "GET",
        headers: {
          Authorization: "Bearer test",
          "Cache-Control": "no-store",
        },
      });
    }
  });
});
