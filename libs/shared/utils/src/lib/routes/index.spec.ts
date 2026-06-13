/**
 * BDD Suite: Shared RouteMatcher primitive.
 *
 * Given: a set of route rules (with or without method constraints).
 * When: a request path/method is matched against them.
 * Then: matching is correct, method-aware, and order-independent — the single
 *       tested primitive every middleware route list relies on.
 */

import {
  composeRouteRules,
  createLayeredRouteMatcher,
  RouteMatcher,
  IRouteRule,
} from "./index";

describe("RouteMatcher", () => {
  /**
   * BDD Scenario: Method-less rule matches any method.
   */
  it("matches any method when a rule declares no methods", () => {
    const matcher = new RouteMatcher([{ regexPath: /\/favicon\.ico/ }]);

    expect(matcher.matches("/favicon.ico", "GET")).toBe(true);
    expect(matcher.matches("/favicon.ico", "POST")).toBe(true);
    expect(matcher.matches("/favicon.ico")).toBe(true);
  });

  /**
   * BDD Scenario: Method-constrained rule respects the method.
   */
  it("matches only declared methods, case-insensitively", () => {
    const matcher = new RouteMatcher([
      { regexPath: /\/api\/x\/items/, methods: ["POST", "DELETE"] },
    ]);

    expect(matcher.matches("/api/x/items", "post")).toBe(true);
    expect(matcher.matches("/api/x/items", "DELETE")).toBe(true);
    expect(matcher.matches("/api/x/items", "GET")).toBe(false);
  });

  /**
   * BDD Scenario: Non-matching path returns false.
   */
  it("returns false for an unmatched path", () => {
    const matcher = new RouteMatcher([{ regexPath: /\/api\/x\/items/ }]);

    expect(matcher.matches("/api/y/things", "GET")).toBe(false);
  });

  /**
   * BDD Scenario: Omitting the method ignores method constraints.
   */
  it("ignores method constraints when no method is supplied", () => {
    const matcher = new RouteMatcher([
      { regexPath: /\/api\/x\/items/, methods: ["POST"] },
    ]);

    expect(matcher.matches("/api/x/items")).toBe(true);
  });

  /**
   * BDD Scenario: Empty matcher never matches.
   */
  it("never matches with no rules", () => {
    const matcher = new RouteMatcher();

    expect(matcher.matches("/anything", "GET")).toBe(false);
    expect(matcher.size).toBe(0);
  });

  /**
   * BDD Scenario: A deny rule subtracts a framework default.
   * Given: a broad allow rule (the framework default) plus a narrower deny
   *        rule (the project override).
   * When:  the denied sub-path and a sibling allowed path are matched.
   * Then:  the denied path no longer matches, the sibling still does — a
   *        project can SUBTRACT a default without forking it (issue #195).
   */
  it("lets a deny rule subtract a path the allow rules cover", () => {
    const matcher = new RouteMatcher([
      { regexPath: /^\/api\/x\// },
      { regexPath: /^\/api\/x\/secret$/, deny: true },
    ]);

    expect(matcher.matches("/api/x/public")).toBe(true);
    expect(matcher.matches("/api/x/secret")).toBe(false);
  });

  /**
   * BDD Scenario: Deny wins regardless of rule order.
   * Given: the deny rule declared BEFORE the allow rule it overrides.
   * When:  the overlapping path is matched.
   * Then:  deny still wins — evaluation is order-independent.
   */
  it("honors deny regardless of declaration order", () => {
    const matcher = new RouteMatcher([
      { regexPath: /^\/api\/x\/secret$/, deny: true },
      { regexPath: /^\/api\/x\// },
    ]);

    expect(matcher.matches("/api/x/secret")).toBe(false);
  });

  /**
   * BDD Scenario: A deny rule is method-scoped.
   * Given: a broad allow rule and a deny rule constrained to GET.
   * When:  the path is matched for GET vs POST.
   * Then:  only GET is subtracted; POST still matches (deny honors methods).
   */
  it("applies method constraints to deny rules", () => {
    const matcher = new RouteMatcher([
      { regexPath: /^\/api\/x\/items/ },
      { regexPath: /^\/api\/x\/items/, methods: ["GET"], deny: true },
    ]);

    expect(matcher.matches("/api/x/items", "GET")).toBe(false);
    expect(matcher.matches("/api/x/items", "POST")).toBe(true);
  });

  /**
   * BDD Scenario: A deny rule alone never matches (no allow to subtract from).
   * Given: only a deny rule.
   * When:  its path is matched.
   * Then:  the result is false — `matches` requires a positive allow.
   */
  it("returns false when only a deny rule matches", () => {
    const matcher = new RouteMatcher([
      { regexPath: /^\/api\/x\//, deny: true },
    ]);

    expect(matcher.matches("/api/x/anything")).toBe(false);
  });
});

describe("composeRouteRules", () => {
  /**
   * BDD Scenario: Layers are flattened and undefined layers dropped.
   */
  it("flattens defined layers and drops undefined ones", () => {
    const options: IRouteRule[] = [{ regexPath: /a/ }];
    const startup: IRouteRule[] = [{ regexPath: /b/ }];
    const singlepage: IRouteRule[] = [{ regexPath: /c/ }];

    const composed = composeRouteRules([
      options,
      undefined,
      startup,
      singlepage,
    ]);

    expect(composed).toHaveLength(3);
    expect(composed.map((rule) => rule.regexPath.source)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  /**
   * BDD Scenario: A composed matcher matches a rule from any layer.
   */
  it("produces a matcher that honors every layer", () => {
    const matcher = new RouteMatcher(
      composeRouteRules([
        [{ regexPath: /\/option-route/ }],
        [{ regexPath: /\/startup-route/ }],
        [{ regexPath: /\/default-route/ }],
      ]),
    );

    expect(matcher.matches("/option-route")).toBe(true);
    expect(matcher.matches("/startup-route")).toBe(true);
    expect(matcher.matches("/default-route")).toBe(true);
  });
});

describe("createLayeredRouteMatcher", () => {
  /**
   * BDD Scenario: The shared helper composes the three middleware layers.
   * Given: option, startup, and singlepage rule layers.
   * When:  the helper builds the matcher.
   * Then:  a rule from each layer matches — the single definition every
   *        middleware `routes/index.ts` now delegates to (issue #195 cleanup).
   */
  it("honors options, startup, and singlepage layers", () => {
    const matcher = createLayeredRouteMatcher(
      [{ regexPath: /\/option-route/ }],
      [{ regexPath: /\/startup-route/ }],
      [{ regexPath: /\/default-route/ }],
    );

    expect(matcher.matches("/option-route")).toBe(true);
    expect(matcher.matches("/startup-route")).toBe(true);
    expect(matcher.matches("/default-route")).toBe(true);
    expect(matcher.matches("/unrelated")).toBe(false);
  });

  /**
   * BDD Scenario: Layers default to empty.
   * Given: only the singlepage layer is supplied.
   * When:  the helper builds the matcher.
   * Then:  it works without options/startup arrays (the common framework case).
   */
  it("defaults omitted layers to empty", () => {
    const matcher = createLayeredRouteMatcher(undefined, undefined, [
      { regexPath: /\/default-route/ },
    ]);

    expect(matcher.matches("/default-route")).toBe(true);
  });

  /**
   * BDD Scenario: A startup deny rule subtracts a singlepage default through
   * the shared helper.
   * Given: a singlepage default that allows a path and a startup `deny` rule
   *        for a sub-path.
   * When:  both paths are matched.
   * Then:  the startup layer subtracts the default without forking it.
   */
  it("lets a startup deny rule subtract a singlepage default", () => {
    const matcher = createLayeredRouteMatcher(
      undefined,
      [{ regexPath: /^\/api\/x\/secret$/, deny: true }],
      [{ regexPath: /^\/api\/x\// }],
    );

    expect(matcher.matches("/api/x/public")).toBe(true);
    expect(matcher.matches("/api/x/secret")).toBe(false);
  });
});
