/**
 * BDD Suite: MCP content-management input schemas
 * Given Codex calls generic content-management tools with structured input
 * When entity selectors, filters, ordering, and destructive confirmations are parsed
 * Then invalid entity keys and unsafe delete calls are rejected before SDK calls
 */

import {
  ContentDeleteApplyInputSchema,
  ContentEntityDescribeInputSchema,
  ContentFindInputSchema,
} from "./schemas";

describe("MCP content-management input schemas", () => {
  /**
   * BDD Scenario: Canonical entity keys are accepted
   * Given blog.widget is a supported content entity
   * When Codex describes the entity
   * Then schema validation accepts the selector
   */
  it("accepts supported canonical entity keys", () => {
    expect(
      ContentEntityDescribeInputSchema.safeParse({
        entity: "blog.widget",
      }).success,
    ).toBe(true);
  });

  /**
   * BDD Scenario: Filtered reads cap broad list requests
   * Given a generic find request asks for too many records
   * When the find schema validates the request
   * Then the request is rejected above the MCP limit cap
   */
  it("rejects unbounded find limits above the cap", () => {
    expect(
      ContentFindInputSchema.safeParse({
        entity: "host.page",
        limit: 101,
      }).success,
    ).toBe(false);
  });

  /**
   * BDD Scenario: Delete apply requires explicit confirmation
   * Given delete-preview returned a confirmation token
   * When delete-apply is missing confirm true
   * Then schema validation rejects the destructive call
   */
  it("requires explicit confirmation for delete apply", () => {
    expect(
      ContentDeleteApplyInputSchema.safeParse({
        entity: "blog.widget",
        id: "widget-1",
        confirmationToken: "blog.widget:widget-1",
      }).success,
    ).toBe(false);
  });
});
