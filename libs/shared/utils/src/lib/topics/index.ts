/**
 * Canonical realtime topic derivation (issue #195, framework-grade layer).
 *
 * ONE algorithm shared by three layers so that precision is symmetric by
 * construction for any model in any project built on the framework:
 *
 * 1. Backend revalidation middleware — derives topics for mutation broadcasts.
 * 2. Frontend factory queries — derive `meta.topics` subscriptions from their
 *    read routes.
 * 3. HTTP-cache middleware — derives topic version keys for GET cache keys and
 *    mutation version bumps.
 *
 * Canonical topic space (both URL shapes reduce to the same space):
 * - flat module routes:        /api/<module>/<collection>[/<id>]...
 * - subject-scoped routes:     /api/.../<name>-module/<chain...>
 *
 * Emitted topics for a path:
 * - collection topic:            `<module>.<collection>`
 * - entity topic (id present):   `<module>.<collection>.<id>`
 * - single-ancestor scoped chains, one per ancestor that has an id:
 *   `<module>.<ancestor>.<ancestorId>.<collection>`
 *
 * Deliberately NOT emitted: bare ancestor entity topics
 * (`social.chats.<cid>` for a message mutation). Those are what make a child
 * mutation invalidate parent-level queries and rerender whole pages; parents
 * opt in via explicit topic rules only.
 *
 * Because reads and mutations use the same derivation, a subscriber matches a
 * mutation exactly when its read scope contains the mutated collection:
 * - list read `.../threads/<tid>/messages`  ⟂ message create in that thread ✓
 * - findById `.../messages/<mid>`           ⟂ update/delete of that message ✓
 * - flat admin list `/api/social/messages`  ⟂ any message mutation ✓
 * - chat findById `.../chats/<cid>`         ⟂ message mutations ✗ (by design)
 */

import { match } from "path-to-regexp";

import { topicRules as singlepageTopicRules } from "./singlepage";
import { topicRules as startupTopicRules } from "./startup";

const UUID_SEGMENT_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_SEGMENT_REGEX = /^\d+$/;

// Path suffixes that scope or aggregate a collection route without being
// collections themselves. They are stripped so `/api/x/items/count` derives
// the same collection topic as `/api/x/items`.
const STRIPPED_TERMINAL_SEGMENTS = new Set(["count", "bulk"]);

interface ITopicStep {
  collection: string;
  id?: string;
}

function isIdSegment(segment: string): boolean {
  return (
    UUID_SEGMENT_REGEX.test(segment) || NUMERIC_SEGMENT_REGEX.test(segment)
  );
}

function parseSteps(segments: string[]): ITopicStep[] {
  const steps: ITopicStep[] = [];

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];

    if (!segment || isIdSegment(segment)) {
      continue;
    }

    const nextSegment = segments[index + 1];

    if (nextSegment && isIdSegment(nextSegment)) {
      steps.push({ collection: segment, id: nextSegment });
      index += 1;
    } else {
      steps.push({ collection: segment });
    }
  }

  return steps;
}

/**
 * Derives the canonical topic set for an API path. Returns [] for paths that
 * do not address a model collection (non-/api paths, bare module roots).
 *
 * The same function serves reads and mutations:
 * - terminal segment without id (list GET / create POST) → collection +
 *   ancestor-scoped chains;
 * - terminal id (detail GET / update PUT / delete DELETE) → the above plus the
 *   entity topic.
 *
 * RPC / ACTION endpoints (issue #195): this deriver is collection-shaped and
 * CANNOT know which trailing segments are verbs rather than collections. A
 * custom action route therefore derives a LITERAL segment topic from its
 * trailing verb — `.../orders/checkout` → `ecommerce.checkout`,
 * `.../messages/{id}/react-by/openrouter` → `social.openrouter` — a topic no
 * reader subscribes to. Do NOT special-case verbs here (the verb vocabulary is
 * open-ended and project-defined). Instead every action endpoint that must
 * trigger realtime updates MUST be covered by an explicit topic rule (see the
 * `singlepage.ts` framework defaults + `startup.ts` project layer in this
 * topics folder) that maps the action path to the real reader topics. Those
 * rules are consumed by BOTH the revalidation broadcast and the http-cache
 * version bump (the single shared resolver below), so the two layers always
 * agree.
 */
export function deriveTopicsFromPath(path: string): string[] {
  const normalizedPath = (path || "").split("?")[0];
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments[0] !== "api" || segments.length < 2) {
    return [];
  }

  while (
    segments.length &&
    STRIPPED_TERMINAL_SEGMENTS.has(segments[segments.length - 1])
  ) {
    segments.pop();
  }

  const moduleSegmentIndex = segments.findIndex((segment) =>
    segment.endsWith("-module"),
  );

  let moduleName: string;
  let chainSegments: string[];

  if (moduleSegmentIndex >= 0) {
    moduleName = segments[moduleSegmentIndex].replace(/-module$/, "");
    chainSegments = segments.slice(moduleSegmentIndex + 1);
  } else {
    moduleName = segments[1];
    chainSegments = segments.slice(2);
  }

  if (!moduleName || !chainSegments.length) {
    return [];
  }

  const steps = parseSteps(chainSegments);

  if (!steps.length) {
    return [];
  }

  const terminalStep = steps[steps.length - 1];
  const ancestorSteps = steps.slice(0, -1);
  const topics = new Set<string>();

  topics.add(`${moduleName}.${terminalStep.collection}`);

  if (terminalStep.id) {
    topics.add(`${moduleName}.${terminalStep.collection}.${terminalStep.id}`);
  }

  for (const ancestorStep of ancestorSteps) {
    if (!ancestorStep.id) {
      continue;
    }

    topics.add(
      `${moduleName}.${ancestorStep.collection}.${ancestorStep.id}.${terminalStep.collection}`,
    );
  }

  return Array.from(topics);
}

/**
 * Explicit topic RULE (issue #195): maps a route template to a fixed topic set,
 * overriding the canonical `deriveTopicsFromPath` for that path. Needed for
 * (a) parent scopes that must opt into a child mutation, and (b) RPC/action
 * endpoints whose trailing verb the deriver cannot interpret
 * (`.../orders/checkout`, `.../react-by/openrouter`).
 *
 * `routeTemplate` and `topics` share `[placeholder]` params (path-to-regexp
 * under the hood); placeholders in `topics` are substituted from the matched
 * path. `stop: true` ends evaluation, so a rule listed before the framework
 * defaults overrides them — this is the override mechanism for the
 * `singlepage.ts` (framework) / `startup.ts` (project) rule layers.
 */
export interface ITopicRule {
  routeTemplate: string;
  topics: string[];
  stop?: boolean;
}

export interface ICompiledTopicRule {
  matcher: ReturnType<typeof match>;
  topics: string[];
  stop: boolean;
  paramNamesByPlaceholder: Map<string, string>;
}

/**
 * Compiles `[placeholder]`-templated topic rules into path-to-regexp matchers.
 * The `[a.b.id]` placeholder syntax is normalized to a `:a_b_id` named param
 * (path-to-regexp forbids dots/dashes in names); the original placeholder →
 * param-name mapping is kept so topic templates can be re-expanded.
 */
export function compileTopicRules(rules: ITopicRule[]): ICompiledTopicRule[] {
  return rules.map((rule) => {
    const paramNamesByPlaceholder = new Map<string, string>();
    const template = rule.routeTemplate.replace(/\[(.+?)\]/g, (_, p1) => {
      const paramName = p1.replace(/[.\-]/g, "_");
      paramNamesByPlaceholder.set(p1, paramName);
      return `:${paramName}`;
    });

    return {
      matcher: match(template, {
        decode: decodeURIComponent,
        end: false,
      }),
      topics: rule.topics,
      stop: Boolean(rule.stop),
      paramNamesByPlaceholder,
    };
  });
}

function resolveTopicsFromRules(
  normalizedPath: string,
  compiledRules: ICompiledTopicRule[],
): string[] {
  const topics = new Set<string>();

  for (const rule of compiledRules) {
    const matchResult = rule.matcher(normalizedPath);
    if (!matchResult) {
      continue;
    }

    for (const topicTemplate of rule.topics) {
      const topic = topicTemplate.replace(/\[(.+?)\]/g, (_, p1) => {
        const paramName = rule.paramNamesByPlaceholder.get(p1);
        if (!paramName) {
          return "";
        }

        const paramValue =
          matchResult.params?.[paramName as keyof typeof matchResult.params];
        if (Array.isArray(paramValue)) {
          return paramValue[0] || "";
        }

        return typeof paramValue === "string" ? paramValue : "";
      });

      const isMalformedTopic =
        !topic ||
        topic.includes("..") ||
        topic.startsWith(".") ||
        topic.endsWith(".");

      if (!isMalformedTopic) {
        topics.add(topic);
      }
    }

    if (rule.stop) {
      break;
    }
  }

  return Array.from(topics);
}

/**
 * Resolves the realtime topic set for a mutation/read `path`: explicit topic
 * rules first (a matching rule, even non-`stop`, suppresses canonical
 * derivation), canonical `deriveTopicsFromPath` otherwise. This is the exact
 * function BOTH the revalidation broadcast and the http-cache version bump
 * call, so the two layers always compute identical topics (issue #195).
 */
export function resolveTopicsForPath(
  path: string,
  compiledRules: ICompiledTopicRule[],
): string[] {
  const normalizedPath = (path || "").split("?")[0];
  const topicsFromRules = resolveTopicsFromRules(normalizedPath, compiledRules);
  if (topicsFromRules.length) {
    return topicsFromRules;
  }

  return deriveTopicsFromPath(normalizedPath);
}

export { singlepageTopicRules, startupTopicRules };

/**
 * Framework default compiled rule set: the project `startup.ts` layer is
 * evaluated BEFORE the framework `singlepage.ts` defaults (so a project rule
 * with `stop: true` overrides). Consumed by the http-cache version bump (which
 * takes no constructor topic-rule options); the revalidation middleware
 * prepends its own constructor-options rules on top of these same two layers.
 */
export const defaultCompiledTopicRules: ICompiledTopicRule[] =
  compileTopicRules([...startupTopicRules, ...singlepageTopicRules]);
