/**
 * BDD Suite: external widget registry coverage.
 *
 * Given: the app-local host runtime explicitly whitelists supported external modules.
 * When: the external widget registry is evaluated.
 * Then: supported site modules are present and unsupported backlog modules stay excluded.
 */

import { externalWidgetRegistry } from "./external-widget";

describe("externalWidgetRegistry", () => {
  it("covers the supported site modules and excludes unsupported backlog modules", () => {
    expect(Object.keys(externalWidgetRegistry).sort()).toEqual([
      "analytic",
      "billing",
      "blog",
      "crm",
      "ecommerce",
      "file-storage",
      "notification",
      "rbac",
      "social",
      "startup",
      "website-builder",
    ]);

    expect(externalWidgetRegistry.agent).toBeUndefined();
    expect(externalWidgetRegistry.broadcast).toBeUndefined();
  });
});
