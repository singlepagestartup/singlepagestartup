/**
 * BDD Suite: products-to-attributes startup sdk.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import {
  api as startupApi,
  queryClient as startupQueryClient,
  Provider as StartupProvider,
} from "./index";
import {
  api as singlepageApi,
  queryClient as singlepageQueryClient,
  Provider as SinglepageProvider,
} from "../singlepage";

describe("products-to-attributes startup sdk", () => {
  it("reuses singlepage api and provider contracts", () => {
    expect(startupApi).toBe(singlepageApi);
    expect(startupQueryClient).toBe(singlepageQueryClient);
    expect(StartupProvider).toBe(SinglepageProvider);
  });
});
