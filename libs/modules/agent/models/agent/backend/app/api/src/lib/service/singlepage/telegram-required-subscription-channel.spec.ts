/**
 * BDD Suite: Telegram required subscription channel configuration.
 *
 * Given: optional Telegram channel environment values.
 * When: the Agent service resolves the subscription-channel configuration.
 * Then: subscription enforcement is enabled only for a complete configuration.
 */

import { resolveTelegramRequiredSubscriptionChannelConfiguration } from "./telegram-required-subscription-channel";

describe("Telegram required subscription channel configuration", () => {
  /**
   * BDD Scenario: no subscription channel is configured.
   *
   * Given: all channel values are absent.
   * When: the configuration is resolved.
   * Then: subscription enforcement is disabled without a configuration error.
   */
  it("disables subscription enforcement when all channel values are absent", () => {
    expect(resolveTelegramRequiredSubscriptionChannelConfiguration({})).toEqual(
      {
        id: "",
        name: "",
        link: "",
        isConfigured: false,
        isPartiallyConfigured: false,
      },
    );
  });

  /**
   * BDD Scenario: the subscription channel is fully configured.
   *
   * Given: channel id, name, and link are present.
   * When: the configuration is resolved.
   * Then: subscription enforcement is enabled.
   */
  it("enables subscription enforcement for a complete configuration", () => {
    expect(
      resolveTelegramRequiredSubscriptionChannelConfiguration({
        id: "-100123",
        name: "SinglePageStartup",
        link: "https://t.me/singlepagestartup",
      }),
    ).toEqual({
      id: "-100123",
      name: "SinglePageStartup",
      link: "https://t.me/singlepagestartup",
      isConfigured: true,
      isPartiallyConfigured: false,
    });
  });

  /**
   * BDD Scenario: the subscription channel is partially configured.
   *
   * Given: only some channel values are present.
   * When: the configuration is resolved.
   * Then: it is marked incomplete and subscription enforcement remains disabled.
   */
  it("marks a partial configuration as invalid", () => {
    expect(
      resolveTelegramRequiredSubscriptionChannelConfiguration({
        name: "SinglePageStartup",
      }),
    ).toEqual({
      id: "",
      name: "SinglePageStartup",
      link: "",
      isConfigured: false,
      isPartiallyConfigured: true,
    });
  });
});
