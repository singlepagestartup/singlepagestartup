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
 * These rules feed BOTH the revalidation broadcast and the http-cache version
 * bump (one shared resolver in `./index`), keeping the two realtime layers in
 * lockstep. (A project may also pass rules via the `RevalidationMiddleware`
 * constructor in `apps/api/app.ts`, which are layered on top of these.)
 */
export const topicRules: ITopicRule[] = [];
