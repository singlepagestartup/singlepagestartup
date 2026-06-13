/**
 * BDD Suite: actions-logger logging-routes matcher.
 *
 * Given: the composed logging matcher (singlepage + startup + options).
 * When: chat mutation paths and unrelated paths are tested.
 * Then: only the configured chat mutations are logged, method-aware.
 */

import { createLoggingRoutesMatcher } from "./index";

const SID = "303302a0-4eb7-4cef-af04-74d7e8e72442";
const PID = "88862025-5c38-4ce8-bb4c-4c5c511b874c";
const CID = "e3d65d9b-60fa-4e6b-8e4d-7a93960bc249";
const TID = "38529ce7-f88d-45d3-9f34-f40b6a3bf82c";

describe("actions-logger logging routes", () => {
  const matcher = createLoggingRoutesMatcher();

  /**
   * BDD Scenario: Chat message/action mutations are logged for their methods.
   */
  it("logs chat message and action mutations", () => {
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages`,
        "POST",
      ),
    ).toBe(true);
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
        "POST",
      ),
    ).toBe(true);
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/actions`,
        "DELETE",
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario: Reads and unrelated routes are not logged.
   */
  it("does not log reads or unrelated routes", () => {
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages`,
        "GET",
      ),
    ).toBe(false);
    expect(matcher.matches("/api/ecommerce/orders", "POST")).toBe(false);
  });
});
