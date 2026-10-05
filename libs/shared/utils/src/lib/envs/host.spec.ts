/**
 * BDD Suite: default payment provider list.
 *
 * Given: an environment may leave ALLOWED_BILLING_SERVICE_PROVIDERS unset.
 * When: the host environment module is loaded.
 * Then: the default list leaves the dummy provider out, and a configured value replaces the default.
 */

describe("Given: the host environment module", () => {
  const configuredProviders = process.env["ALLOWED_BILLING_SERVICE_PROVIDERS"];

  async function importHostEnvs() {
    jest.resetModules();

    return import("./host");
  }

  afterEach(() => {
    if (configuredProviders === undefined) {
      delete process.env["ALLOWED_BILLING_SERVICE_PROVIDERS"];
    } else {
      process.env["ALLOWED_BILLING_SERVICE_PROVIDERS"] = configuredProviders;
    }
  });

  /**
   * BDD Scenario
   *
   * Given: ALLOWED_BILLING_SERVICE_PROVIDERS is unset.
   * When: the module is loaded.
   * Then: the list names the real payment providers and leaves dummy out.
   */
  it("Then: leaves dummy out of the default list", async () => {
    delete process.env["ALLOWED_BILLING_SERVICE_PROVIDERS"];

    const { ALLOWED_BILLING_SERVICE_PROVIDERS } = await importHostEnvs();

    expect(ALLOWED_BILLING_SERVICE_PROVIDERS.split(",")).toEqual([
      "stripe",
      "0xprocessing",
      "payselection",
      "cloudpayments",
      "tiptoppay",
    ]);
  });

  /**
   * BDD Scenario
   *
   * Given: ALLOWED_BILLING_SERVICE_PROVIDERS lists stripe and dummy.
   * When: the module is loaded.
   * Then: the list is the configured value, dummy included.
   */
  it("Then: uses the configured list when the variable is set", async () => {
    process.env["ALLOWED_BILLING_SERVICE_PROVIDERS"] = "stripe,dummy";

    const { ALLOWED_BILLING_SERVICE_PROVIDERS } = await importHostEnvs();

    expect(ALLOWED_BILLING_SERVICE_PROVIDERS).toBe("stripe,dummy");
  });
});
