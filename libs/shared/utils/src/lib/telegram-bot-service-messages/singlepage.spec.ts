/**
 * BDD Suite: SinglePageStartup Telegram service messages.
 *
 * Given: the shared Telegram bot message catalog.
 * When: a user must be prompted to subscribe to a configured channel.
 * Then: the message uses neutral SinglePageStartup wording without client-specific branding or fallback links.
 */

import { util } from "./singlepage";

describe("SinglePageStartup Telegram service messages", () => {
  /**
   * BDD Scenario: required-channel subscription prompt.
   *
   * Given: the Agent service requests the shared subscription prompt.
   * When: the Russian message is read.
   * Then: it identifies SinglePageStartup and contains neither Doctor GPT wording nor a hardcoded Telegram URL.
   */
  it("uses neutral SinglePageStartup subscription wording", () => {
    const message = util.openRouterRequiredTelegamChannelSubscriptionError.ru;

    expect(message).toContain("SinglePageStartup");
    expect(message).not.toContain("Doctor GPT");
    expect(message).not.toContain("https://t.me");
  });
});
