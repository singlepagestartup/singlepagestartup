/**
 * BDD Suite: bill-route billing-routes matcher.
 *
 * Given: the composed billing matcher (singlepage + startup + options).
 * When: the OpenRouter reaction path and unrelated paths are tested.
 * Then: only the configured billed routes match, method-aware.
 */

import { createBillingRoutesMatcher } from "./index";

const SID = "303302a0-4eb7-4cef-af04-74d7e8e72442";
const PID = "88862025-5c38-4ce8-bb4c-4c5c511b874c";
const CID = "e3d65d9b-60fa-4e6b-8e4d-7a93960bc249";
const MID = "e9fb51ab-dd98-4d5c-b3f8-7466ce7e440e";

describe("bill-route billing routes", () => {
  const matcher = createBillingRoutesMatcher();

  /**
   * BDD Scenario: OpenRouter reaction is billed on POST.
   */
  it("bills the OpenRouter reaction route", () => {
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages/${MID}/react-by/openrouter`,
        "POST",
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario: Unrelated routes are not billed.
   */
  it("does not bill unrelated routes", () => {
    expect(matcher.matches("/api/ecommerce/orders", "POST")).toBe(false);
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages`,
        "POST",
      ),
    ).toBe(false);
  });

  /**
   * BDD Scenario: Project/option extensions are honored.
   */
  it("honors project/option billing-route extensions", () => {
    const extended = createBillingRoutesMatcher([
      { regexPath: /\/api\/crm\/.*\/ai-enrich/, methods: ["POST"] },
    ]);

    expect(extended.matches("/api/crm/boards/x/ai-enrich", "POST")).toBe(true);
  });
});
