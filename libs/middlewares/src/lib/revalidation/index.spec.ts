/**
 * BDD Suite: Revalidation middleware topic resolution and extension API.
 *
 * Given: the middleware compiled with built-in defaults and optional
 *        project-level extensions.
 * When: broadcast topics are resolved for mutation paths.
 * Then: explicit rules win over canonical derivation, project rules win over
 *       defaults, and unmatched paths fall back to the shared deriver.
 */
import { Middleware } from "./index";
import { Hono } from "hono";
import { websocketManager } from "@sps/backend-utils";
import {
  MUTATION_SKIPPED_CONTEXT_KEY,
  READ_ONLY_OPERATION_CONTEXT_KEY,
} from "@sps/shared-utils";

jest.mock("@sps/backend-utils", () => {
  return {
    requestHostRevalidation: jest.requireActual(
      "../../../../shared/backend/utils/src/lib/host-revalidation",
    ).requestHostRevalidation,
    websocketManager: {
      broadcastMessage: jest.fn(),
    },
  };
});

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  HOST_SERVICE_REVALIDATION_SECRET: "fixture-revalidation-secret",
  HOST_SERVICE_REVALIDATION_SECRET_HEADER: "X-HOST-REVALIDATION-SECRET",
}));

const SID = "303302a0-4eb7-4cef-af04-74d7e8e72442";
const PID = "88862025-5c38-4ce8-bb4c-4c5c511b874c";
const CID = "e3d65d9b-60fa-4e6b-8e4d-7a93960bc249";
const TID = "38529ce7-f88d-45d3-9f34-f40b6a3bf82c";
const MID = "e9fb51ab-dd98-4d5c-b3f8-7466ce7e440e";

describe("Next tag batching", () => {
  afterEach(() => jest.restoreAllMocks());
  it("sends 279 distinct tags in three bounded requests and deduplicates repeats", async () => {
    const fetch = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const tags = Array.from({ length: 279 }, (_, index) => `tag-${index}`);
    await new Middleware().revalidateTags([...tags, tags[0]]);
    expect(fetch).toHaveBeenCalledTimes(3);
    const batches = fetch.mock.calls.map(
      ([, options]) => JSON.parse(options!.body as string).tags,
    );
    expect(batches.map((batch) => batch.length)).toEqual([128, 128, 23]);
    expect(batches.flat()).toEqual(tags);
  });
  it("keeps failed required invalidation retryable", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("error", { status: 500 }));
    await expect(new Middleware().revalidateTags(["tag"])).rejects.toThrow(
      "Next invalidation failed (500)",
    );
  });
  it.each([401, 404, 405])(
    "propagates HTTP %s without a second request",
    async (status) => {
      const fetch = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response("", { status }));
      await expect(new Middleware().revalidateTags(["a", "b"])).rejects.toThrow(
        `Next invalidation failed (${status})`,
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: "POST",
        headers: {
          "X-HOST-REVALIDATION-SECRET": "fixture-revalidation-secret",
        },
      });
    },
  );
});

it("broadcasts a successful mutation without sending a second Host invalidation", async () => {
  const fetch = jest.spyOn(globalThis, "fetch");
  const app = new Hono();
  app.use(new Middleware().init());
  app.post("/api/example/items", (c) => c.json({ ok: true }));
  try {
    expect(
      (await app.request("/api/example/items", { method: "POST" })).status,
    ).toBe(200);
    expect(websocketManager.broadcastMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: "/api/example/items",
        slug: "revalidation",
      }),
    );
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    fetch.mockRestore();
  }
});

it("executes a read-only POST without publishing a mutation notification", async () => {
  jest.mocked(websocketManager.broadcastMessage).mockClear();
  const calculate = jest.fn(() => ({ amount: "10.00" }));
  const app = new Hono<{
    Variables: Record<typeof READ_ONLY_OPERATION_CONTEXT_KEY, boolean>;
  }>();
  app.use(new Middleware().init());
  app.post("/api/example/items/quote", (c) => {
    c.set(READ_ONLY_OPERATION_CONTEXT_KEY, true);
    return c.json({ data: calculate() });
  });
  const response = await app.request("/api/example/items/quote", {
    method: "POST",
  });
  expect(await response.json()).toEqual({ data: { amount: "10.00" } });
  expect(calculate).toHaveBeenCalledTimes(1);
  expect(websocketManager.broadcastMessage).not.toHaveBeenCalled();
});

it("keeps duplicate mutations free of HTTP mutation notifications", async () => {
  jest.mocked(websocketManager.broadcastMessage).mockClear();
  const app = new Hono<{
    Variables: Record<typeof MUTATION_SKIPPED_CONTEXT_KEY, boolean>;
  }>();
  app.use(new Middleware().init());
  app.post("/api/example/items/selection", (c) => {
    c.set(MUTATION_SKIPPED_CONTEXT_KEY, true);
    return c.json({ data: { applied: false } });
  });
  const response = await app.request("/api/example/items/selection", {
    method: "POST",
  });
  expect(await response.json()).toEqual({ data: { applied: false } });
  expect(websocketManager.broadcastMessage).not.toHaveBeenCalled();
});

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
