/**
 * BDD Suite: Shared realtime topic-rule resolver.
 *
 * Given: topic rules (template-based) and the framework default rule set.
 * When: a mutation/read path is resolved to its broadcast/bump topics.
 * Then: explicit rules win (with placeholder substitution + stop ordering), the
 *       canonical deriver is the fallback, and the framework defaults map the
 *       RPC/action endpoints onto the topics their readers subscribe to — the
 *       single resolver BOTH the revalidation broadcast and the http-cache
 *       version bump call, so the two layers never diverge (issue #195).
 */

import {
  compileTopicRules,
  defaultCompiledTopicRules,
  resolveTopicsForPath,
  type ITopicRule,
} from "./index";

describe("resolveTopicsForPath — rules vs canonical", () => {
  /**
   * BDD Scenario: A matching rule substitutes placeholders and wins over
   * canonical derivation.
   */
  it("returns the rule topics with params substituted from the path", () => {
    const rules = compileTopicRules([
      {
        routeTemplate: "/api/x/items/[x.items.id]/publish",
        topics: ["x.items", "x.items.[x.items.id]"],
        stop: true,
      },
    ]);

    expect(resolveTopicsForPath("/api/x/items/abc-123/publish", rules)).toEqual(
      ["x.items", "x.items.abc-123"],
    );
  });

  /**
   * BDD Scenario: No rule matches → canonical deriveTopicsFromPath fallback.
   */
  it("falls back to canonical derivation when no rule matches", () => {
    const rules = compileTopicRules([
      {
        routeTemplate: "/api/x/items/[x.items.id]/publish",
        topics: ["x.items"],
      },
    ]);

    // A plain collection read no rule covers derives the canonical topic.
    expect(resolveTopicsForPath("/api/social/messages", rules)).toEqual([
      "social.messages",
    ]);
  });

  /**
   * BDD Scenario: A `stop` rule listed first overrides a later rule for the
   * same path — the mechanism a project `startup.ts` rule uses to override a
   * framework `singlepage.ts` default.
   */
  it("honors stop-ordering so an earlier rule overrides a later one", () => {
    const projectRule: ITopicRule = {
      routeTemplate: "/api/x/items",
      topics: ["x.items.project-override"],
      stop: true,
    };
    const frameworkRule: ITopicRule = {
      routeTemplate: "/api/x/items",
      topics: ["x.items"],
      stop: true,
    };

    const rules = compileTopicRules([projectRule, frameworkRule]);

    expect(resolveTopicsForPath("/api/x/items", rules)).toEqual([
      "x.items.project-override",
    ]);
  });
});

describe("defaultCompiledTopicRules — framework action endpoints", () => {
  /**
   * BDD Scenario: The ecommerce checkout RPC endpoint resolves to the orders
   * topics the cart reads subscribe to (not the literal `ecommerce.checkout`).
   */
  it("maps the checkout endpoint onto the orders topics", () => {
    const topics = resolveTopicsForPath(
      "/api/rbac/subjects/sub-1/ecommerce-module/orders/checkout",
      defaultCompiledTopicRules,
    );

    expect(topics).toContain("ecommerce.orders");
    expect(topics).not.toContain("ecommerce.checkout");
  });

  /**
   * BDD Scenario: The AI-reaction RPC endpoint resolves to the message, action,
   * Knowledge, and billing topics, so the assistant reply, action row, learned
   * profile document, and requester balance reconcile.
   */
  it("maps the AI-reaction endpoint onto message, action, Knowledge, and billing topics", () => {
    const topics = resolveTopicsForPath(
      "/api/rbac/subjects/sub-1/social-module/profiles/p-1/chats/c-1/messages/m-1/react-by/openrouter",
      defaultCompiledTopicRules,
    );

    expect(topics).toContain("social.messages");
    expect(topics).toContain("social.actions");
    expect(topics).toContain("social.chats.c-1.actions");
    expect(topics).toContain("social.profiles-to-knowledge-module-documents");
    expect(topics).toContain("knowledge.documents");
    expect(topics).toContain("rbac.subjects-to-billing-module-currencies");
    expect(topics).not.toContain("social.openrouter");
  });

  /**
   * BDD Scenario: Profile Knowledge reads resolve to the collections they join.
   * Given: the chat-sidebar and profile-scoped Knowledge document endpoints.
   * When: their realtime topics are resolved through the framework rules.
   * Then: both subscribe to Social relation and Knowledge document changes.
   */
  it("maps profile Knowledge reads onto relation and document topics", () => {
    const paths = [
      "/api/rbac/subjects/sub-1/social-module/profiles/requester-1/chats/chat-1/profiles/assistant-1/knowledge/documents",
      "/api/rbac/subjects/sub-1/social-module/profiles/assistant-1/knowledge/documents",
    ];

    for (const path of paths) {
      expect(resolveTopicsForPath(path, defaultCompiledTopicRules)).toEqual([
        "social.profiles-to-knowledge-module-documents",
        "knowledge.documents",
      ]);
    }
  });
});
