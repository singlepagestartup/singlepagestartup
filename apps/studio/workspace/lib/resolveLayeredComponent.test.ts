/**
 * BDD Suite: Layered React presentation resolution
 * Given singlepage is the base and startup is the higher-priority optional override
 * When Studio resolves the component used by default
 * Then a startup default component wins and an empty startup module inherits singlepage
 */

import { describe, expect, test } from "bun:test";

import { resolveLayeredComponent } from "./resolveLayeredComponent";

describe("resolveLayeredComponent", () => {
  /**
   * BDD Scenario: Inherit the base component
   * Given the tracked startup module has no default component
   * When default is resolved
   * Then default uses the singlepage component
   */
  test("inherits singlepage when startup has no component", () => {
    const singlepage = () => "singlepage";

    expect(
      resolveLayeredComponent({
        basePath: "singlepage",
        modules: { singlepage: { default: singlepage }, startup: {} },
        overridePath: "startup",
      }),
    ).toBe(singlepage);
  });

  /**
   * BDD Scenario: Prefer the downstream component
   * Given both singlepage and startup components exist
   * When default is resolved
   * Then default uses the startup component
   */
  test("prefers startup when its override exists", () => {
    const singlepage = () => "singlepage";
    const startup = () => "startup";

    expect(
      resolveLayeredComponent({
        basePath: "singlepage",
        modules: {
          singlepage: { default: singlepage },
          startup: { default: startup },
        },
        overridePath: "startup",
      }),
    ).toBe(startup);
  });

  /**
   * BDD Scenario: Reject a missing base
   * Given neither a startup override nor the required singlepage base exists
   * When default is resolved
   * Then Studio reports the missing base instead of rendering an arbitrary fallback
   */
  test("rejects a missing singlepage base", () => {
    expect(() =>
      resolveLayeredComponent({
        basePath: "singlepage",
        modules: { startup: {} },
        overridePath: "startup",
      }),
    ).toThrow("Layered component base is missing: singlepage");
  });
});
