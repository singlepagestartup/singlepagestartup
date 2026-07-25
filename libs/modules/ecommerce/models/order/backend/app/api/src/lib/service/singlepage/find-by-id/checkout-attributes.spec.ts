/**
 * BDD Suite: ecommerce order checkout intervals.
 *
 * Given: subscription products can define supported billing intervals.
 * When: checkout validates an hourly or unknown interval.
 * Then: hourly billing is accepted and unknown values remain rejected.
 */

import {
  isSupportedOrderInterval,
  isSupportedOrderType,
} from "./checkout-attributes";

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

  /**
   * BDD Scenario: a one-off product reaches checkout.
   *
   * Given: ecommerce products persist the canonical one_off type.
   * When: checkout validates the product type.
   * Then: the product is accepted for a one-off payment intent.
   */
  it("accepts the canonical one_off product type", () => {
    expect(isSupportedOrderType("one_off")).toBe(true);
  });

  /**
   * BDD Scenario: a legacy one-time product type reaches checkout.
   *
   * Given: one-time is not part of the product or payment-intent contracts.
   * When: checkout validates the product type.
   * Then: the legacy value remains unsupported.
   */
  it("rejects the legacy one-time product type", () => {
    expect(isSupportedOrderType("one-time")).toBe(false);
  });
});
