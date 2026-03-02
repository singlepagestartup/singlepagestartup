/**
 * BDD Suite: RegexCreator.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { RegexCreator } from "./RegexCreator";

class ExportRoute extends RegexCreator {
  constructor({
    route,
    asPropertyModelName,
  }: {
    route: string;
    asPropertyModelName: string;
  }) {
    const place = `export const routes = {`;
    const placeRegex = new RegExp(`export const routes = {`);
    const content = `"${route}": ${asPropertyModelName},`;
    const contentRegex = new RegExp(
      `"${route}":([\\s]+?)${asPropertyModelName},`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

describe("RegexCreator", () => {
  describe(`ExportRoute`, () => {
    const route = "/wide-slide-route";
    const asPropertyModelName = "wideSlideRoute";

    const exportRoute = new ExportRoute({ route, asPropertyModelName });

    it(`should match the regex 1`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `import { app as layouts } from "@sps/website-builder-models-layout-backend-app";
  
        export const routes = {
          "/pages": pages,
          "/wide-slide-route": wideSlideRoute,
          "/layouts": layouts,
        };`;

      expect(string).toMatch(regex);
    });

    it(`should match the regex 2`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `import { app as layouts } from "@sps/website-builder-models-layout-backend-app";
  
        export const routes = {
          "/pages": pages,
          "/wide-slide-route":
            wideSlideRoute,
          "/layouts": layouts,
        };`;

      expect(string).toMatch(regex);
    });
  });
});
