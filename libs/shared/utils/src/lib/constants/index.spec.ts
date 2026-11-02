/**
 * BDD Suite: the providers whose email counts as proven.
 *
 * Given: registration refuses an address one of these providers already holds.
 * When: the list is read.
 * Then: it names only providers that establish ownership, and cannot be edited in place.
 */

import { ADDRESS_VERIFYING_PROVIDERS } from ".";

describe("Given: the address-verifying provider list", () => {
  /**
   * BDD Scenario
   * Given: Google reports a verified address over a server-to-server channel.
   * When: the list is read.
   * Then: it names that provider, so a registration on such an address is refused.
   */
  it("When: the list is read Then: it names the provider that proves an address", () => {
    expect(ADDRESS_VERIFYING_PROVIDERS).toContain("oauth_google");
  });

  /**
   * BDD Scenario
   * Given: telegram and the legacy email provider can carry an address without proving it.
   * When: the list is read.
   * Then: neither appears, so neither blocks a registration.
   */
  it("When: a provider only carries an address Then: it is absent from the list", () => {
    expect(ADDRESS_VERIFYING_PROVIDERS).not.toContain("telegram");
    expect(ADDRESS_VERIFYING_PROVIDERS).not.toContain("email");
    expect(ADDRESS_VERIFYING_PROVIDERS).not.toContain("email_and_password");
    expect(ADDRESS_VERIFYING_PROVIDERS).not.toContain(
      "ethereum_virtual_machine",
    );
  });

  /**
   * BDD Scenario
   * Given: the list is spread into a filter the registration query sends.
   * When: it is used.
   * Then: it is frozen and non-empty, so the filter cannot match everything or be mutated.
   */
  it("When: the list is used as a filter value Then: it is frozen and non-empty", () => {
    expect(ADDRESS_VERIFYING_PROVIDERS.length).toBeGreaterThan(0);
    expect(Object.isFrozen(ADDRESS_VERIFYING_PROVIDERS)).toBe(true);
  });
});
