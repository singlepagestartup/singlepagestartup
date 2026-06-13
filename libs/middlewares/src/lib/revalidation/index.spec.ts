/**
 * BDD Suite: Revalidation middleware topic resolution and extension API.
 *
 * Given: the middleware compiled with built-in defaults and optional
 *        project-level extensions.
 * When: broadcast topics are resolved for mutation paths.
 * Then: explicit rules win over canonical derivation, project rules win over
 *       defaults, and unmatched paths fall back to the shared deriver.
 */

jest.mock("@sps/backend-utils", () => {
  return {
    websocketManager: {
      broadcastMessage: jest.fn(),
    },
  };
});

import { Middleware } from "./index";

const SID = "303302a0-4eb7-4cef-af04-74d7e8e72442";
const PID = "88862025-5c38-4ce8-bb4c-4c5c511b874c";
const CID = "e3d65d9b-60fa-4e6b-8e4d-7a93960bc249";
const TID = "38529ce7-f88d-45d3-9f34-f40b6a3bf82c";
const MID = "e9fb51ab-dd98-4d5c-b3f8-7466ce7e440e";

function intersects(a: string[], b: string[]): boolean {
  return a.some((topic) => b.includes(topic));
}

describe("revalidation topic resolution", () => {
  /**
   * BDD Scenario: Explicit default rule takes precedence over derivation.
   * Given: the built-in thread-scoped message rule.
   * When:  topics are resolved for a thread message create path.
   * Then:  the rule's topics are returned (scoped chain, social.messages).
   */
  it("resolves the built-in thread message rule before derivation", () => {
    const middleware = new Middleware();
    const topics = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
    );

    expect(topics).toContain(`social.threads.${TID}.messages`);
    expect(topics).toContain("social.messages");
    expect(topics).not.toContain(`social.chats.${CID}`);
    expect(topics).not.toContain(`social.profiles.${PID}`);
  });

  /**
   * BDD Scenario: Canonical derivation covers rule-less paths.
   * Given: a mutation path with no explicit rule (any project model).
   * When:  topics are resolved.
   * Then:  the shared deriver provides collection/entity/chain topics, with
   *        no bare ancestor entity topics.
   */
  it("falls back to canonical derivation for unruled paths", () => {
    const middleware = new Middleware();
    const topics = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/ecommerce-module/orders/${CID}`,
    );

    expect(topics).toEqual(
      expect.arrayContaining(["ecommerce.orders", `ecommerce.orders.${CID}`]),
    );
    expect(topics).not.toContain(`rbac.subjects.${SID}`);
  });

  /**
   * BDD Scenario: Project rules extend and override without forking.
   * Given: a project registers its own topic rule via constructor options.
   * When:  topics are resolved for the project's custom path.
   * Then:  the project rule wins (evaluated before defaults and derivation).
   */
  it("lets a project rule override via constructor options", () => {
    const middleware = new Middleware({
      topicRules: [
        {
          routeTemplate:
            "/api/rbac/subjects/[rbac.subjects.id]/crm-module/boards/[crm.boards.id]/cards",
          topics: ["crm.boards.[crm.boards.id].cards", "crm.cards"],
          stop: true,
        },
      ],
    });

    const topics = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/crm-module/boards/${CID}/cards`,
    );

    expect(topics).toEqual(
      expect.arrayContaining([`crm.boards.${CID}.cards`, "crm.cards"]),
    );
  });

  /**
   * BDD Scenario: Project notRevalidating extensions are accepted.
   * Given: a project registers an extra non-revalidating route.
   * When:  the middleware is constructed.
   * Then:  construction succeeds and defaults remain intact (smoke).
   */
  it("accepts project notRevalidatingRoutes extensions", () => {
    expect(() => {
      return new Middleware({
        notRevalidatingRoutes: [
          {
            regexPath: /\/api\/custom\/webhooks/,
            methods: ["POST"],
          },
        ],
      });
    }).not.toThrow();
  });
});

describe("action / RPC endpoint topic rules (issue #195 F3)", () => {
  /**
   * BDD Scenario: The AI-reaction RPC endpoint broadcasts message + action
   * topics, not a useless verb topic.
   * Given: the `react-by/openrouter` POST path (creates the AI response
   *        message and a chat action; the canonical deriver would emit
   *        `social.openrouter`).
   * When:  broadcast topics are resolved.
   * Then:  the message and action reader topics are emitted (scoped by the
   *        chat id present in the path) and the useless verb topic is not.
   */
  it("broadcasts message and action topics for the AI-reaction endpoint", () => {
    const middleware = new Middleware();
    const topics = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages/${MID}/react-by/openrouter`,
    );

    expect(topics).toEqual(
      expect.arrayContaining([
        "social.messages",
        `social.chats.${CID}.messages`,
        "social.actions",
        `social.chats.${CID}.actions`,
      ]),
    );
    expect(topics).not.toContain("social.openrouter");
  });

  /**
   * BDD Scenario: The AI-reaction broadcast reaches the chat readers.
   * Given: the thread-timeline read (subscribes to `social.messages`), the
   *        chat-scoped messages read, and the chat actions read.
   * When:  the AI-reaction endpoint broadcasts.
   * Then:  every reader's topic set intersects the broadcast — the new AI
   *        message and action arrive without a reload.
   */
  it("reaches the thread, chat-messages and chat-actions readers", () => {
    const middleware = new Middleware();
    const broadcast = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages/${MID}/react-by/openrouter`,
    );

    const threadTimelineRead = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
    );
    const chatMessagesRead = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages`,
    );
    const chatActionsRead = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/actions`,
    );

    expect(intersects(broadcast, threadTimelineRead)).toBe(true);
    expect(intersects(broadcast, chatMessagesRead)).toBe(true);
    expect(intersects(broadcast, chatActionsRead)).toBe(true);
  });

  /**
   * BDD Scenario: The ecommerce checkout RPC endpoint broadcasts order topics,
   * not a `ecommerce.checkout` verb topic.
   * Given: the `orders/checkout` POST path.
   * When:  broadcast topics are resolved.
   * Then:  the orders collection topic (+ subject-scoped chain) is emitted and
   *        the useless verb topic is not.
   */
  it("broadcasts order topics for the checkout endpoint", () => {
    const middleware = new Middleware();
    const topics = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/ecommerce-module/orders/checkout`,
    );

    expect(topics).toEqual(
      expect.arrayContaining([
        "ecommerce.orders",
        `ecommerce.subjects.${SID}.orders`,
      ]),
    );
    expect(topics).not.toContain("ecommerce.checkout");
  });

  /**
   * BDD Scenario: The checkout broadcast reaches the subject's order list.
   * Given: the subject order-list read (derives `ecommerce.orders`).
   * When:  checkout broadcasts.
   * Then:  the sets intersect via `ecommerce.orders`.
   */
  it("reaches the subject order-list reader", () => {
    const middleware = new Middleware();
    const broadcast = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/ecommerce-module/orders/checkout`,
    );
    const orderListRead = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/ecommerce-module/orders`,
    );

    expect(orderListRead).toContain("ecommerce.orders");
    expect(intersects(broadcast, orderListRead)).toBe(true);
  });

  /**
   * BDD Scenario: The checkout rule matches on segment boundaries only.
   * Given: the sibling `orders/checkout-attributes` GET endpoint, which shares
   *        the `orders/checkout` prefix as a STRING but not as a segment.
   * When:  topics are resolved for it.
   * Then:  it falls through to canonical derivation (its own verb topic), NOT
   *        the checkout rule's order topics — the rule does not over-match.
   */
  it("does not let the checkout rule swallow checkout-attributes", () => {
    const middleware = new Middleware();
    const topics = middleware.resolveBroadcastTopics(
      `/api/rbac/subjects/${SID}/ecommerce-module/orders/checkout-attributes`,
    );

    expect(topics).not.toContain(`ecommerce.subjects.${SID}.orders`);
    expect(topics).toContain("ecommerce.checkout-attributes");
  });
});
