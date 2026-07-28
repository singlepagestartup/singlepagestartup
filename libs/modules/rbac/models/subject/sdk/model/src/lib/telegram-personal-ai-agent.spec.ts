/**
 * BDD Suite: Telegram personal AI agent identity.
 *
 * Given: each Telegram user is represented by an owner rbac.subject.
 * When: the personal AI agent identifier is created or inspected.
 * Then: it is deterministic, owner-specific, and distinguishable from global AI profiles.
 */

import {
  getTelegramPersonalAiAgentSlug,
  isTelegramPersonalAiAgentSlug,
} from "./telegram-personal-ai-agent";

describe("Given: Telegram personal AI agent identity", () => {
  /**
   * BDD Scenario
   * Given: two distinct owner subjects.
   * When: their agent slugs are generated.
   * Then: each owner receives one stable and different identifier.
   */
  it("When: owner ids differ Then: generated agent slugs are stable and isolated", () => {
    expect(getTelegramPersonalAiAgentSlug("owner-1")).toBe(
      "telegram-personal-ai-agent-owner-1",
    );
    expect(getTelegramPersonalAiAgentSlug("owner-2")).toBe(
      "telegram-personal-ai-agent-owner-2",
    );
    expect(
      isTelegramPersonalAiAgentSlug(getTelegramPersonalAiAgentSlug("owner-1")),
    ).toBe(true);
    expect(isTelegramPersonalAiAgentSlug("open-router")).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: an empty owner id.
   * When: an agent slug is requested.
   * Then: creation fails before any subject or profile can be provisioned.
   */
  it("When: owner id is empty Then: slug creation fails closed", () => {
    expect(() => getTelegramPersonalAiAgentSlug(" ")).toThrow(
      "owner rbac.subject id is required",
    );
  });
});
