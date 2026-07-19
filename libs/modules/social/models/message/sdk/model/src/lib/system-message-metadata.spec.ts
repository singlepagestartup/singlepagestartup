/**
 * BDD Suite: Social system-message metadata.
 *
 * Given: module-owned messages share the generic Social metadata field.
 * When: a message is marked as internal system traffic.
 * Then: existing metadata is preserved and OpenRouter exclusion is explicit.
 */

import {
  isSocialMessageExcludedFromOpenRouter,
  shouldAwaitSocialMessageNotification,
  withSocialMessageSystemMetadata,
} from "./system-message-metadata";

describe("Given: Social system-message metadata", () => {
  /**
   * BDD Scenario
   * Given: a message already has transport metadata.
   * When: Agent marks it as Telegram system traffic.
   * Then: both metadata contracts remain available and OpenRouter excludes it.
   */
  it("When: a system marker is added Then: existing metadata remains intact", () => {
    const metadata = withSocialMessageSystemMetadata({
      metadata: {
        telegram: {
          sourceMessageIds: [101],
        },
      },
      source: "agent.telegram.assistant-conversation",
    });

    expect(metadata).toEqual({
      telegram: {
        sourceMessageIds: [101],
      },
      systemMessage: {
        version: 1,
        source: "agent.telegram.assistant-conversation",
        excludeFromOpenRouter: true,
      },
    });
    expect(isSocialMessageExcludedFromOpenRouter(metadata)).toBe(true);
    expect(
      isSocialMessageExcludedFromOpenRouter({
        systemMessage: {
          excludeFromOpenRouter: false,
        },
      }),
    ).toBe(false);
    expect(shouldAwaitSocialMessageNotification(metadata)).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: a system message must be delivered before a dependent reply.
   * When: its metadata requests awaited notification delivery.
   * Then: the delivery marker is explicit without changing OpenRouter exclusion.
   */
  it("When: awaited delivery is requested Then: notification marker is explicit", () => {
    const metadata = withSocialMessageSystemMetadata({
      source: "rbac.telegram.ai-execution",
      awaitNotification: true,
    });

    expect(metadata).toEqual({
      systemMessage: {
        version: 1,
        source: "rbac.telegram.ai-execution",
        excludeFromOpenRouter: true,
        awaitNotification: true,
      },
    });
    expect(isSocialMessageExcludedFromOpenRouter(metadata)).toBe(true);
    expect(shouldAwaitSocialMessageNotification(metadata)).toBe(true);
  });
});
