/**
 * BDD Suite: Revalidation middleware topic resolution, extension API and host
 * call.
 *
 * Given: the middleware compiled with built-in defaults and optional
 *        project-level extensions, in front of a host that requires the
 *        shared revalidation secret.
 * When: broadcast topics are resolved for mutation paths, and a write asks the
 *       host to revalidate its cached reads.
 * Then: explicit rules win over canonical derivation, project rules win over
 *       defaults, unmatched paths fall back to the shared deriver, and the
 *       host call carries the secret and exactly the encoded tag.
 */

const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();
const MOCK_REVALIDATION_SECRET =
  "9c1e5a7d3b2f4086a1c9e7d5b3f2a4c6d8e0f1a3b5c7d9e2f4a6b8c0d1e3f5a7";

let mockRevalidationSecret: string | undefined = MOCK_REVALIDATION_SECRET;

jest.mock("@sps/backend-utils", () => {
  return {
    logger: {
      warn: (...args: unknown[]) => mockLoggerWarn(...args),
      error: (...args: unknown[]) => mockLoggerError(...args),
    },
    websocketManager: {
      broadcastMessage: jest.fn(),
    },
  };
});

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  HOST_SERVICE_URL: "http://host.test",
  RBAC_SECRET_KEY: "test-rbac-secret",
  get HOST_SERVICE_REVALIDATION_SECRET() {
    return mockRevalidationSecret;
  },
}));

import { Hono } from "hono";
import { HOST_SERVICE_REVALIDATION_SECRET_HEADER } from "@sps/shared-utils";
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
   * BDD Scenario: The AI-reaction RPC endpoint broadcasts message, action, and
   * Knowledge topics, not a useless verb topic.
   * Given: the `react-by/openrouter` POST path (creates the AI response
   *        message and a chat action; the canonical deriver would emit
   *        `social.openrouter`).
   * When:  broadcast topics are resolved.
   * Then:  the message, action, and learned-document reader topics are emitted
   *        and the useless verb topic is not.
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
        "social.profiles-to-knowledge-module-documents",
        "knowledge.documents",
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

describe("host revalidation call (issue #315)", () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    mockRevalidationSecret = MOCK_REVALIDATION_SECRET;
    mockLoggerWarn.mockClear();
    mockLoggerError.mockClear();
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    globalThis.fetch = fetchMock as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  /**
   * BDD Scenario: The host call carries the secret and one encoded tag.
   * Given: a tag that contains reserved query characters.
   * When:  the middleware asks the host to revalidate it.
   * Then:  the request carries the secret in the X-HOST-REVALIDATION-SECRET
   *        header and a single `tag` parameter that decodes to exactly that
   *        tag.
   */
  it("sends the secret and exactly one encoded tag", async () => {
    const tag = "/api/blog/articles/a&path=/&type=layout";

    await new Middleware().revalidateTag(tag);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    const requested = new URL(url);

    expect(`${requested.origin}${requested.pathname}`).toBe(
      "http://host.test/api/revalidate",
    );
    expect([...requested.searchParams.keys()]).toEqual(["tag"]);
    expect(requested.searchParams.get("tag")).toBe(tag);
    expect(init.headers).toEqual({
      "X-HOST-REVALIDATION-SECRET": MOCK_REVALIDATION_SECRET,
    });
  });

  /**
   * BDD Scenario: A write revalidates the entity and its collection.
   * Given: the middleware in front of a handler that answers a POST with 201.
   * When:  an entity is written.
   * Then:  the host is asked, with the secret, for the entity path and for
   *        the collection path.
   */
  it("asks the host for the entity and its collection after a write", async () => {
    const app = new Hono();

    app.use(new Middleware().init());
    app.post("/api/ecommerce/products/:id", (c) => {
      return c.json({ data: {} }, 201);
    });

    const response = await app.request(`/api/ecommerce/products/${PID}`, {
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(
      fetchMock.mock.calls.map(([url]) => {
        return new URL(url).searchParams.get("tag");
      }),
    ).toEqual([`/api/ecommerce/products/${PID}`, "/api/ecommerce/products"]);

    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers[HOST_SERVICE_REVALIDATION_SECRET_HEADER]).toBe(
        MOCK_REVALIDATION_SECRET,
      );
    }
  });

  /**
   * BDD Scenario: A read does not reach the host.
   * Given: the middleware in front of a handler that answers a GET with 200.
   * When:  an entity is read.
   * Then:  the host is not called.
   */
  it("does not call the host for a read", async () => {
    const app = new Hono();

    app.use(new Middleware().init());
    app.get("/api/ecommerce/products/:id", (c) => {
      return c.json({ data: {} });
    });

    await app.request(`/api/ecommerce/products/${PID}`);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: A refused call is visible in the API log.
   * Given: the host answers 401 because its secret is unset or differs.
   * When:  the middleware asks it to revalidate.
   * Then:  one warning names the status and the variable, never the secret.
   */
  it("logs a refusal with its status and without the secret", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    await new Middleware().revalidateTag("/api/blog/articles");

    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);

    const [message] = mockLoggerWarn.mock.calls[0];

    expect(message).toContain("401");
    expect(message).toContain("HOST_SERVICE_REVALIDATION_SECRET");
    expect(message).not.toContain(MOCK_REVALIDATION_SECRET);
  });

  /**
   * BDD Scenario: An unreachable host does not fail the write.
   * Given: the host cannot be reached.
   * When:  the middleware asks it to revalidate.
   * Then:  the call resolves and the failure is logged with its reason.
   */
  it("logs an unreachable host instead of throwing", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(
      new Middleware().revalidateTag("/api/blog/articles"),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining("ECONNREFUSED"),
    );
  });

  /**
   * BDD Scenario: An API without the secret still asks, and the host refuses.
   * Given: the API has no HOST_SERVICE_REVALIDATION_SECRET.
   * When:  the middleware asks the host to revalidate.
   * Then:  the header is sent empty, which the host treats as no credential.
   */
  it("sends an empty credential when the API has no secret", async () => {
    mockRevalidationSecret = undefined;

    await new Middleware().revalidateTag("/api/blog/articles");

    const [, init] = fetchMock.mock.calls[0];

    expect(init.headers).toEqual({
      [HOST_SERVICE_REVALIDATION_SECRET_HEADER]: "",
    });
  });
});
