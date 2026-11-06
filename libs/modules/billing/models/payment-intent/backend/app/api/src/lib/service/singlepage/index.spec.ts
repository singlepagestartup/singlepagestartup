/**
 * BDD Suite: payment-intent allowed providers.
 *
 * Given: ALLOWED_BILLING_SERVICE_PROVIDERS names the payment providers a deployment accepts.
 * When: the payment-intent service is asked whether a provider is allowed.
 * Then: it allows only a provider that is an exact entry of that list.
 */

const mockEnvs = {
  ALLOWED_BILLING_SERVICE_PROVIDERS: "stripe,payselection,dummy",
};

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    get ALLOWED_BILLING_SERVICE_PROVIDERS() {
      return mockEnvs.ALLOWED_BILLING_SERVICE_PROVIDERS;
    },
  };
});

import { Service } from "./index";

describe("Given: the payment-intent service", () => {
  function createService() {
    return new Service({} as any, {} as any);
  }

  afterEach(() => {
    mockEnvs.ALLOWED_BILLING_SERVICE_PROVIDERS = "stripe,payselection,dummy";
  });

  /**
   * BDD Scenario
   *
   * Given: the list names stripe, payselection and dummy.
   * When: the service checks each of them.
   * Then: it allows every listed provider.
   */
  it("Then: allows a provider the list names", () => {
    const service = createService();

    expect(service.isProviderAllowed({ provider: "stripe" })).toBe(true);
    expect(service.isProviderAllowed({ provider: "payselection" })).toBe(true);
    expect(service.isProviderAllowed({ provider: "dummy" })).toBe(true);
  });

  /**
   * BDD Scenario
   *
   * Given: the list names stripe and payselection-international.
   * When: the service checks payselection and payselection-international-rub.
   * Then: it refuses both, because an entry must match the whole name.
   */
  it("Then: refuses a provider that only partly matches a listed entry", () => {
    mockEnvs.ALLOWED_BILLING_SERVICE_PROVIDERS =
      "stripe,payselection-international";
    const service = createService();

    expect(service.isProviderAllowed({ provider: "payselection" })).toBe(false);
    expect(
      service.isProviderAllowed({
        provider: "payselection-international-rub",
      }),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   *
   * Given: the list names stripe only.
   * When: the service checks dummy.
   * Then: it refuses dummy.
   */
  it("Then: refuses dummy when the list leaves it out", () => {
    mockEnvs.ALLOWED_BILLING_SERVICE_PROVIDERS = "stripe";
    const service = createService();

    expect(service.isProviderAllowed({ provider: "dummy" })).toBe(false);
  });
});
