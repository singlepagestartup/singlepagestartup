/**
 * BDD Suite: MCP content-management input schemas
 * Given Codex calls generic content-management tools with structured input
 * When module/model selectors, filters, ordering, and destructive confirmations are parsed
 * Then malformed selectors and unsafe delete calls are rejected before SDK calls
 */

import {
  ContentModelDeleteApplyInputSchema,
  ContentModelFindInputSchema,
  ContentModelSelectorSchema,
} from "./schemas";

describe("MCP content-management input schemas", () => {
  /**
   * BDD Scenario: Model selectors are accepted
   * Given blog.widget is a supported content model
   * When Codex describes the model
   * Then schema validation accepts the selector
   */
  it("accepts explicit module and model selectors", () => {
    expect(
      ContentModelSelectorSchema.safeParse({
        module: "blog",
        model: "widget",
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
      ContentModelFindInputSchema.safeParse({
        module: "host",
        model: "page",
        limit: 101,
      }).success,
    ).toBe(false);
  });

  /**
   * BDD Scenario: Tool auth is not exposed in input
   * Given auth is provided by the MCP transport
   * When content find input schema is exposed to clients
   * Then direct auth fields are absent from the tool input shape
   */
  it("does not expose direct auth input for content tools", () => {
    expect("auth" in ContentModelFindInputSchema.shape).toBe(false);
    expect("authorization" in ContentModelFindInputSchema.shape).toBe(false);
    expect("rbacSecretKey" in ContentModelFindInputSchema.shape).toBe(false);
  });

  /**
   * BDD Scenario: Delete apply requires explicit confirmation
   * Given delete-preview returned a confirmation token
   * When delete-apply is missing confirm true
   * Then schema validation rejects the destructive call
   */
  it("requires explicit confirmation for delete apply", () => {
    expect(
      ContentModelDeleteApplyInputSchema.safeParse({
        module: "blog",
        model: "widget",
        id: "widget-1",
        confirmationToken: "model:blog:widget:widget-1",
      }).success,
    ).toBe(false);
  });
});
