/**
 * BDD Suite: Social system-message metadata.
 *
 * Given: module-owned messages share the generic Social metadata field.
 * When: a message is marked as internal system traffic.
 * Then: existing metadata is preserved and OpenRouter exclusion is explicit.
 */

import {
  isSocialMessageExcludedFromOpenRouter,
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
  });
});
