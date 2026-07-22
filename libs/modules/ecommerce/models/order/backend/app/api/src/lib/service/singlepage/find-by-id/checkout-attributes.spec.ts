/**
 * BDD Suite: ecommerce order checkout intervals.
 *
 * Given: subscription products can define supported billing intervals.
 * When: checkout validates an hourly or unknown interval.
 * Then: hourly billing is accepted and unknown values remain rejected.
 */

import { isSupportedOrderInterval } from "./checkout-attributes";

describe("ecommerce order checkout intervals", () => {
  /**
   * BDD Scenario: an hourly subscription reaches checkout.
   *
   * Given: a subscription product uses the hour interval.
   * When: checkout validates its interval attribute.
   * Then: the interval is accepted for payment-intent and invoice creation.
   */
  it("accepts the hour subscription interval", () => {
    expect(isSupportedOrderInterval("hour")).toBe(true);
  });

  /**
   * BDD Scenario: an unsupported interval reaches checkout.
   *
   * Given: a subscription product uses an unknown interval.
   * When: checkout validates its interval attribute.
   * Then: the interval remains unsupported.
   */
  it("rejects unknown subscription intervals", () => {
    expect(isSupportedOrderInterval("fortnight")).toBe(false);
  });
});
