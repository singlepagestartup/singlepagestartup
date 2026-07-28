/**
 * BDD Suite: Canonical topic derivation (framework realtime layer).
 *
 * Given: API paths in both framework URL shapes (flat module routes and
 *        subject-scoped `-module` routes).
 * When: deriveTopicsFromPath computes the canonical topic set.
 * Then: reads and mutations of the same data land in intersecting topic sets,
 *       while parent-entity reads stay isolated from child mutations.
 */

import { deriveTopicsFromPath } from "./index";

const SID = "303302a0-4eb7-4cef-af04-74d7e8e72442";
const PID = "88862025-5c38-4ce8-bb4c-4c5c511b874c";
const CID = "e3d65d9b-60fa-4e6b-8e4d-7a93960bc249";
const TID = "38529ce7-f88d-45d3-9f34-f40b6a3bf82c";
const MID = "e9fb51ab-dd98-4d5c-b3f8-7466ce7e440e";

function intersects(a: string[], b: string[]): boolean {
  return a.some((topic) => b.includes(topic));
}

describe("deriveTopicsFromPath", () => {
  /**
   * BDD Scenario: Flat collection route.
   * Given: a flat module list route.
   * When:  topics are derived.
   * Then:  only the collection topic is emitted.
   */
  it("derives the collection topic for a flat list route", () => {
    expect(deriveTopicsFromPath("/api/social/messages")).toEqual([
      "social.messages",
    ]);
    expect(deriveTopicsFromPath("/api/ecommerce/orders")).toEqual([
      "ecommerce.orders",
    ]);
  });

  /**
   * BDD Scenario: Flat entity route.
   * Given: a flat module detail route.
   * When:  topics are derived.
   * Then:  collection + entity topics are emitted.
   */
  it("derives collection and entity topics for a flat detail route", () => {
    expect(deriveTopicsFromPath(`/api/ecommerce/orders/${MID}`)).toEqual([
      "ecommerce.orders",
      `ecommerce.orders.${MID}`,
    ]);
  });

  /**
   * BDD Scenario: Subject-scoped nested chain (3 ancestor levels).
   * Given: the chat thread messages path.
   * When:  topics are derived.
   * Then:  collection topic + one scoped chain per ancestor-with-id; NO bare
   *        ancestor entity topics.
   */
  it("derives scoped chains for the thread messages path without ancestor entity topics", () => {
    const topics = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
    );

    expect(topics).toEqual(
      expect.arrayContaining([
        "social.messages",
        `social.profiles.${PID}.messages`,
        `social.chats.${CID}.messages`,
        `social.threads.${TID}.messages`,
      ]),
    );
    expect(topics).not.toContain(`social.chats.${CID}`);
    expect(topics).not.toContain(`social.profiles.${PID}`);
    expect(topics).not.toContain("social");
  });

  /**
   * BDD Scenario: Both URL shapes reduce to the same canonical space.
   * Given: a flat order mutation and a subject-scoped order mutation.
   * When:  topics are derived for both.
   * Then:  the canonical collection/entity topics are identical.
   */
  it("maps flat and subject-scoped routes into the same canonical space", () => {
    const flat = deriveTopicsFromPath(`/api/ecommerce/orders/${CID}`);
    const scoped = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/ecommerce-module/orders/${CID}`,
    );

    expect(flat).toContain("ecommerce.orders");
    expect(flat).toContain(`ecommerce.orders.${CID}`);
    expect(scoped).toContain("ecommerce.orders");
    expect(scoped).toContain(`ecommerce.orders.${CID}`);
  });

  /**
   * BDD Scenario: count/bulk suffixes address the base collection.
   * Given: factory count and bulk routes.
   * When:  topics are derived.
   * Then:  they match the base collection topics.
   */
  it("strips count and bulk suffixes", () => {
    expect(deriveTopicsFromPath("/api/ecommerce/orders/count")).toEqual([
      "ecommerce.orders",
    ]);
    expect(deriveTopicsFromPath("/api/ecommerce/orders/bulk")).toEqual([
      "ecommerce.orders",
    ]);
  });

  /**
   * BDD Scenario: Numeric ids are recognized.
   */
  it("treats numeric segments as ids", () => {
    expect(deriveTopicsFromPath("/api/blog/articles/42")).toEqual([
      "blog.articles",
      "blog.articles.42",
    ]);
  });

  /**
   * BDD Scenario: Non-model paths derive nothing.
   */
  it("returns [] for non-api and bare module paths", () => {
    expect(deriveTopicsFromPath("/ws/revalidation")).toEqual([]);
    expect(deriveTopicsFromPath("/api/social")).toEqual([]);
    expect(deriveTopicsFromPath("")).toEqual([]);
    expect(deriveTopicsFromPath("/favicon.ico")).toEqual([]);
  });

  /**
   * BDD Scenario: Query strings are ignored.
   */
  it("ignores query strings", () => {
    expect(
      deriveTopicsFromPath("/api/social/messages?filters[0][column]=id"),
    ).toEqual(["social.messages"]);
  });

  /**
   * BDD Scenario: Action / RPC endpoints derive a LITERAL verb topic.
   * Given: custom action routes whose trailing segment is a verb, not a
   *        collection (the deriver cannot tell them apart by design).
   * When:  topics are derived.
   * Then:  the verb is treated as a collection → a literal topic no reader
   *        subscribes to. This documents why action endpoints MUST be covered
   *        by explicit topic rules (issue #195 F3); the deriver intentionally
   *        does NOT special-case verbs.
   */
  it("derives a literal verb topic for action/RPC endpoints", () => {
    expect(
      deriveTopicsFromPath(
        `/api/rbac/subjects/${SID}/ecommerce-module/orders/checkout`,
      ),
    ).toEqual(["ecommerce.checkout"]);

    const reaction = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages/${MID}/react-by/openrouter`,
    );

    expect(reaction).toContain("social.openrouter");
    expect(reaction).not.toContain("social.messages");
  });
});

describe("read/mutation symmetry (the framework realtime guarantee)", () => {
  const threadMessagesRead = deriveTopicsFromPath(
    `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
  );

  /**
   * BDD Scenario: Thread timeline listener receives thread message creations.
   * Given: a client subscribed via the thread messages read path.
   * When:  a message is created on the same thread-scoped path.
   * Then:  topic sets intersect → the listener is invalidated.
   */
  it("matches thread message create to the thread timeline subscription", () => {
    const mutation = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
    );

    expect(intersects(threadMessagesRead, mutation)).toBe(true);
  });

  /**
   * BDD Scenario: Chat-scoped message update reaches the thread timeline.
   * Given: update/delete mutations run on the CHAT-scoped message path (no
   *        threadId in the URL).
   * When:  topics are derived for the mutation.
   * Then:  they intersect the thread timeline subscription via the
   *        chat-scoped chain (`social.chats.<cid>.messages`).
   */
  it("matches chat-scoped message update to the thread timeline subscription", () => {
    const mutation = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages/${MID}`,
    );

    expect(intersects(threadMessagesRead, mutation)).toBe(true);
  });

  /**
   * BDD Scenario: Flat admin table listens to every message mutation.
   */
  it("matches any message mutation to the flat admin list subscription", () => {
    const adminRead = deriveTopicsFromPath("/api/social/messages");
    const scopedMutation = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
    );
    const flatMutation = deriveTopicsFromPath(`/api/social/messages/${MID}`);

    expect(intersects(adminRead, scopedMutation)).toBe(true);
    expect(intersects(adminRead, flatMutation)).toBe(true);
  });

  /**
   * BDD Scenario: Server-side flat action create reaches the chat actions list.
   * Given: actions are created server-side through the flat module route.
   * When:  topics are derived for both sides.
   * Then:  they intersect via the collection topic (this previously fell
   *        through to route fallback and never matched).
   */
  it("matches flat action create to the chat actions subscription", () => {
    const actionsRead = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/actions`,
    );
    const serverSideCreate = deriveTopicsFromPath("/api/social/actions");

    expect(intersects(actionsRead, serverSideCreate)).toBe(true);
  });

  /**
   * BDD Scenario: A newly created chat reaches the profile's chat-LIST
   * subscription — regression guard for "new chat missing until reload".
   * Given: the chat list reads the profile-scoped collection
   *        (.../profiles/{pid}/chats) and create POSTs the unscoped
   *        collection (.../social-module/chats).
   * When:  topics are derived for both.
   * Then:  they intersect via the `social.chats` collection topic, so the
   *        list is invalidated without a reload.
   */
  it("matches chat create to the profile chat-list subscription", () => {
    const chatListRead = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats`,
    );
    const chatCreate = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/chats`,
    );

    expect(chatListRead).toContain("social.chats");
    expect(chatCreate).toContain("social.chats");
    expect(intersects(chatListRead, chatCreate)).toBe(true);
  });

  /**
   * BDD Scenario: A knowledge document create reaches the document-LIST
   * subscription (same class as the chat-list regression).
   */
  it("matches knowledge document create to the document-list subscription", () => {
    const docListRead = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/knowledge/documents`,
    );
    const docCreate = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/knowledge/documents`,
    );

    expect(docListRead).toContain("social.documents");
    expect(intersects(docListRead, docCreate)).toBe(true);
  });

  /**
   * BDD Scenario: Sending a message does NOT invalidate the chat list
   * (no over-invalidation — message topics don't include bare `social.chats`).
   */
  it("does not match a message mutation to the chat-list subscription", () => {
    const chatListRead = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats`,
    );
    const messageCreate = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
    );

    expect(intersects(chatListRead, messageCreate)).toBe(false);
  });

  /**
   * BDD Scenario: Entity listeners receive updates of exactly their entity.
   */
  it("matches entity update to the findById subscription and not to other entities", () => {
    const detailRead = deriveTopicsFromPath(`/api/ecommerce/orders/${CID}`);
    const sameEntityUpdate = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/ecommerce-module/orders/${CID}`,
    );
    const otherEntityUpdate = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/ecommerce-module/orders/${TID}`,
    );

    expect(intersects(detailRead, sameEntityUpdate)).toBe(true);
    // The collection topic still links them (a list containing the entity must
    // know) — but the ENTITY topics differ:
    expect(detailRead).not.toContain(`ecommerce.orders.${TID}`);
    expect(otherEntityUpdate).not.toContain(`ecommerce.orders.${CID}`);
  });

  /**
   * BDD Scenario: Parent-entity reads are isolated from child mutations —
   * the "page rerenders on message send" class (issue #195, Incident 3).
   * Given: the chat findById read (page-level query).
   * When:  a message is created in that chat.
   * Then:  topic sets DO NOT intersect.
   */
  it("does not match child message mutations to the parent chat findById subscription", () => {
    const chatDetailRead = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}`,
    );
    const messageCreate = deriveTopicsFromPath(
      `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
    );

    expect(intersects(chatDetailRead, messageCreate)).toBe(false);
  });

  /**
   * BDD Scenario: Equivalence with the hand-written chat SDK topics.
   * Given: the topics hand-written in the chat SDK files (Phase 9 state).
   * When:  the emitter derives topics for the matching mutation paths.
   * Then:  every hand-written subscription is still reachable (non-empty
   *        intersection) — proving the explicit chat topic rules can be
   *        replaced by derivation.
   */
  it("keeps every hand-written chat subscription reachable", () => {
    const handWrittenSubscriptions: string[][] = [
      // thread timeline messages (find.ts)
      [
        `social.chats.${CID}.threads.${TID}.messages`,
        `social.threads.${TID}.messages`,
        "social.messages",
      ],
      // chat actions (action/find.ts)
      [`social.chats.${CID}.actions`, "social.actions"],
      // chat-scoped messages (message/find.ts)
      [`social.chats.${CID}.messages`, "social.messages"],
      // chat findById (find-by-id.ts) — reachable by CHAT mutations
      [`social.profiles.${PID}`, `social.chats.${CID}`],
      // threads list (thread/find.ts)
      [`social.chats.${CID}.threads`, "social.threads"],
    ];

    const mutations = {
      threadMessageCreate: deriveTopicsFromPath(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
      ),
      chatScopedAction: deriveTopicsFromPath(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/actions`,
      ),
      chatScopedMessageUpdate: deriveTopicsFromPath(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages/${MID}`,
      ),
      chatUpdate: deriveTopicsFromPath(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}`,
      ),
      threadCreate: deriveTopicsFromPath(
        `/api/rbac/subjects/${SID}/social-module/chats/${CID}/threads`,
      ),
    };

    expect(
      intersects(handWrittenSubscriptions[0], mutations.threadMessageCreate),
    ).toBe(true);
    expect(
      intersects(handWrittenSubscriptions[1], mutations.chatScopedAction),
    ).toBe(true);
    expect(
      intersects(
        handWrittenSubscriptions[2],
        mutations.chatScopedMessageUpdate,
      ),
    ).toBe(true);
    expect(intersects(handWrittenSubscriptions[3], mutations.chatUpdate)).toBe(
      true,
    );
    expect(
      intersects(handWrittenSubscriptions[4], mutations.threadCreate),
    ).toBe(true);
  });
});
