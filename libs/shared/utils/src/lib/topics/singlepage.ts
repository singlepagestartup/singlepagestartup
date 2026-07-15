import type { ITopicRule } from "./index";

/**
 * Framework-default realtime TOPIC rules (singlepage layer).
 *
 * Maps specific routes — parent scopes and RPC/action endpoints the canonical
 * `deriveTopicsFromPath` cannot describe — to the explicit topics their readers
 * subscribe to. Shipped with the framework. Projects OVERRIDE or extend these
 * in `./startup.ts` (evaluated BEFORE this layer, so a startup rule with
 * `stop: true` for the same route wins).
 *
 * These rules drive BOTH the revalidation WS broadcast and the http-cache
 * version bump (one shared resolver in `./index`), so the two realtime layers
 * stay in lockstep for every rule listed here.
 */
export const topicRules: ITopicRule[] = [
  {
    // Thread-scoped message mutations (the chat send path). Without this rule
    // the generic fallback broadcasts broad topics (social.chats.[id],
    // social.profiles.[id]) that invalidate the chat findById query and
    // rerender the whole chat page on every send (issue #195). These topics
    // exactly match the thread timeline query meta, so only the timeline
    // boundary reconciles.
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/threads/[social.threads.id]/messages",
    topics: [
      "social.chats.[social.chats.id].threads.[social.threads.id].messages",
      "social.threads.[social.threads.id].messages",
      "social.messages",
    ],
    stop: true,
  },
  {
    // AI-reaction RPC endpoint (issue #195 F3): a POST that creates the AI
    // response MESSAGE in the chat thread, a chat ACTION, AND settles the
    // requester's billing balance. The canonical
    // deriver would treat the trailing verbs as collections and emit
    // `social.openrouter` (+ scoped variants) — topics no reader subscribes
    // to — so the new message/action never reach the open chat. Only `cid`/
    // `mid` are in the URL (no `tid`), so thread-timeline readers are reached
    // through the collection-wide `social.messages` topic that their own topic
    // rule also emits.
    //
    // MUST precede the chat-messages rule below: rules are PREFIX-matched
    // (path-to-regexp `end: false`), so `.../chats/[cid]/messages` would
    // otherwise match this path's prefix and `stop` before this rule runs.
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/messages/[social.messages.id]/react-by/openrouter",
    topics: [
      "social.messages",
      "social.chats.[social.chats.id].messages",
      "social.actions",
      "social.chats.[social.chats.id].actions",
      "social.profiles-to-knowledge-module-documents",
      "knowledge.documents",
      "rbac.subjects-to-billing-module-currencies",
    ],
    stop: true,
  },
  {
    // Profile Knowledge is a composite RBAC read over both the Social-owned
    // profile-document relation and Knowledge documents. Canonical derivation
    // sees only the trailing `documents` segment and therefore cannot identify
    // either collection that actually changes.
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/profiles/[social.target-profiles.id]/knowledge/documents",
    topics: [
      "social.profiles-to-knowledge-module-documents",
      "knowledge.documents",
    ],
    stop: true,
  },
  {
    // Profile-scoped variant of the same composite Knowledge document read.
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/knowledge/documents",
    topics: [
      "social.profiles-to-knowledge-module-documents",
      "knowledge.documents",
    ],
    stop: true,
  },
  {
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/messages",
    topics: [
      "social",
      "social.chats.[social.chats.id].messages",
      "social.messages",
    ],
    stop: true,
  },
  {
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/actions",
    topics: [
      "social",
      "social.chats.[social.chats.id].actions",
      "social.actions",
    ],
    stop: true,
  },
  {
    // Ecommerce checkout RPC endpoint (issue #195 F3): a POST whose trailing
    // `checkout` verb the canonical deriver would emit as `ecommerce.checkout`
    // — a topic no order reader subscribes to. Checkout mutates the subject's
    // order(s), so emit the orders collection topic (reaches the subject order
    // list / cart, which derives `ecommerce.orders`) plus a subject-scoped
    // chain for projects that subscribe per subject.
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/ecommerce-module/orders/checkout",
    topics: [
      "ecommerce.orders",
      "ecommerce.subjects.[rbac.subjects.id].orders",
    ],
    stop: true,
  },
];
