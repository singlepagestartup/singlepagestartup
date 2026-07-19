/**
 * BDD Suite: Social message partial updates.
 *
 * Given: Telegram delivery patches only a message source-system id.
 * When: the Social insert schema validates that partial update payload.
 * Then: JSON defaults are left to Postgres and cannot erase existing interaction or metadata.
 */

import { insertSchema } from "./index";

describe("Given: a partial Social message update", () => {
  /**
   * BDD Scenario
   * Given: an existing system message has durable metadata.
   * When: Telegram delivery validates a source-system-id-only patch.
   * Then: the parsed patch does not inject empty JSON fields.
   */
  it("When: a delivery patch is parsed Then: metadata defaults are not injected", () => {
    expect(
      insertSchema.parse({
        sourceSystemId: "telegram-message-1",
      }),
    ).toEqual({
      sourceSystemId: "telegram-message-1",
    });
  });

  /**
   * BDD Scenario
   * Given: a new system message supplies explicit interaction and metadata.
   * When: the Social insert schema validates its create payload.
   * Then: both JSON contracts are preserved unchanged.
   */
  it("When: explicit metadata is parsed Then: it remains intact", () => {
    const metadata = {
      systemMessage: {
        version: 1,
        source: "rbac.telegram.ai-execution",
        excludeFromOpenRouter: true,
      },
    };
    const interaction = {
      role: "assistant",
      content: "Tool calls",
    };

    expect(
      insertSchema.parse({
        description: "Tool calls",
        interaction,
        metadata,
      }),
    ).toEqual({
      description: "Tool calls",
      interaction,
      metadata,
    });
  });
});
