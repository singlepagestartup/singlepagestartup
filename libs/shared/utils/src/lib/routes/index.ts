/**
 * Shared, dependency-free route-matching primitive (issue #195 DX follow-up).
 *
 * Lives in `@sps/shared-utils` so any layer can match a request path without
 * pulling middleware code: every SPS middleware that gates behavior on the
 * request path (skip auth, bypass cache, log actions, bill route, revalidate,
 * …) declares its route list in a `routes/singlepage.ts` (framework defaults) +
 * `routes/startup.ts` (per-project extension) pair and composes them through
 * this matcher. The matcher is pure, so route configuration is unit-testable in
 * isolation — without instantiating the middleware class, which often pulls
 * heavy server SDKs.
 *
 * Layering mirrors `libs/modules/startup`: framework code ships sane defaults
 * in `singlepage`, projects extend in `startup`, and programmatic callers may
 * pass extra rules through the middleware constructor options.
 */

/**
 * A single route-matching rule. `methods` omitted or empty means "any HTTP
 * method"; otherwise the request method must be one of them (case-insensitive).
 *
 * `deny` makes the rule SUBTRACTIVE (issue #195 follow-up): a matching deny
 * rule overrides every allow (non-deny) rule, so a project `startup.ts` can
 * remove a framework default without forking `singlepage.ts` — e.g. lock down
 * an is-authorized public route, or re-enable caching of a default-excluded
 * read. Without any `deny` rule the matcher is purely additive (boolean-OR),
 * so this field is backward-compatible: existing rule sets behave unchanged.
 */
export interface IRouteRule {
  regexPath: RegExp;
  methods?: string[];
  deny?: boolean;
}

/**
 * Returns the canonical pathname used by SPS route matchers and persisted
 * action payloads. Accepts both a request pathname and a legacy absolute URL so
 * callers remain independent of internal, public, and reverse-proxy origins.
 */
export function normalizeRoutePath(value?: string | null): string {
  const route = value?.trim() || "";

  if (!route) {
    return "";
  }

  if (route.startsWith("/")) {
    return route.split(/[?#]/, 1)[0];
  }

  try {
    return new URL(route).pathname;
  } catch {
    return route.split(/[?#]/, 1)[0];
  }
}

interface ICompiledRouteRule {
  regexPath: RegExp;
  methods: Set<string> | null;
  deny: boolean;
}

export class RouteMatcher {
  private rules: ICompiledRouteRule[];

  constructor(rules: IRouteRule[] = []) {
    this.rules = rules.map(({ regexPath, methods, deny }) => {
      return {
        regexPath,
        methods:
          methods && methods.length
            ? new Set(methods.map((method) => method.toUpperCase()))
            : null,
        deny: Boolean(deny),
      };
    });
  }

  private ruleMatches(
    { regexPath, methods }: ICompiledRouteRule,
    path: string,
    normalizedMethod?: string,
  ): boolean {
    if (!regexPath.test(path)) {
      return false;
    }

    if (!methods || !normalizedMethod) {
      return true;
    }

    return methods.has(normalizedMethod);
  }

  /**
   * Returns true when `path` matches at least one allow (non-`deny`) rule AND
   * no `deny` rule matches — deny wins (issue #195 subtractive override). A
   * rule with declared methods only matches when `method` is one of them; a
   * method-less rule matches any method. When `method` is omitted, method
   * constraints are ignored. With no `deny` rules present this collapses to a
   * plain boolean-OR over the allow rules (backward-compatible).
   */
  matches(path: string, method?: string): boolean {
    const normalizedMethod = method?.toUpperCase();

    let allowed = false;

    for (const rule of this.rules) {
      if (!this.ruleMatches(rule, path, normalizedMethod)) {
        continue;
      }

      if (rule.deny) {
        return false;
      }

      allowed = true;
    }

    return allowed;
  }

  get size(): number {
    return this.rules.length;
  }
}

/**
 * Flattens the standard middleware route layers into one list, dropping
 * undefined layers. Convention: pass `[optionRules, startupRules,
 * singlepageRules]` — constructor options first (highest intent), then the
 * project startup layer, then the framework singlepage defaults. Order is
 * irrelevant for boolean matching but kept consistent for readability.
 */
export function composeRouteRules(
  layers: Array<IRouteRule[] | undefined>,
): IRouteRule[] {
  return layers
    .filter((layer): layer is IRouteRule[] => Array.isArray(layer))
    .flat();
}

/**
 * Builds the standard three-layer middleware matcher (issue #195 cleanup):
 * **constructor options → project `startup.ts` → framework `singlepage.ts`**.
 *
 * Every SPS path-gating middleware (`http-cache`, `is-authorized`, `observer`,
 * `revalidation`, `actions-logger`, `bill-route`) composed the identical
 * `new RouteMatcher(composeRouteRules([optionRoutes, startup, singlepage]))`
 * in its own `routes/index.ts`; this is the single shared definition each one
 * now delegates to (keeping its own named factory export). Deny rules from any
 * layer flow through `composeRouteRules` and are honored by the matcher.
 */
export function createLayeredRouteMatcher(
  optionRoutes: IRouteRule[] = [],
  startupRoutes: IRouteRule[] = [],
  singlepageRoutes: IRouteRule[] = [],
): RouteMatcher {
  return new RouteMatcher(
    composeRouteRules([optionRoutes, startupRoutes, singlepageRoutes]),
  );
}
