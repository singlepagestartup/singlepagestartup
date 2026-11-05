import type { ITopicRule } from "./index";

/**
 * Project-level realtime TOPIC rules (startup layer) — FINAL, client-editable.
 *
 * Projects built on the SinglePageStartup framework register or OVERRIDE topic
 * rules here. This layer is evaluated BEFORE the framework `./singlepage.ts`
 * defaults, so a rule with `stop: true` for the same route overrides the
 * default without forking `singlepage.ts`.
 *
 * `startup.ts` is project-owned and preserved across base-module syncs — the
 * framework only ships `singlepage.ts`, so a sync never overwrites this file.
 *
 * These rules feed mutation notifications through the shared resolver in
 * `./index`. A project may also pass rules via the `RevalidationMiddleware`
 * constructor in `apps/api/app.ts`, layered on top of these.
 */
export const topicRules: ITopicRule[] = [];
