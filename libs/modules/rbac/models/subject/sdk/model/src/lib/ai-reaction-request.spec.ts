/**
 * BDD Suite: persisted RBAC AI reaction request metadata.
 *
 * Given: social messages store an optional RBAC-owned reaction envelope.
 * When: backend consumers parse or normalize that envelope.
 * Then: absence remains compatible while present intent is bounded and fail-closed.
 */

import {
  RBAC_AI_REACTION_REQUEST_METADATA_KEY,
  normalizeRbacAiReactionRequestMetadata,
  parseRbacAiReactionRequestMetadata,
} from "./ai-reaction-request";

describe("Given: persisted RBAC AI reaction request metadata", () => {
  /**
   * BDD Scenario
   * Given: a message has a complete envelope with duplicate skill ids and padded values.
   * When: the envelope is normalized.
   * Then: stable answer intent is persisted in canonical form without dropping other metadata.
   */
  it("When: valid intent is normalized Then: it preserves canonical bounded values", () => {
    expect(
      normalizeRbacAiReactionRequestMetadata({
        custom: true,
        [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: {
          version: 1,
          modelId: " openai/gpt-5.2 ",
          reasoning: "high",
          skillIds: [" skill-1 ", "skill-1", "skill-2"],
          useKnowledgeSearch: true,
        },
      }),
    ).toEqual({
      custom: true,
      [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: {
        version: 1,
        modelId: "openai/gpt-5.2",
        reasoning: "high",
        skillIds: ["skill-1", "skill-2"],
        useKnowledgeSearch: true,
      },
    });
  });

  /**
   * BDD Scenario
   * Given: Telegram or legacy message metadata has no RBAC reaction envelope.
   * When: the metadata is parsed.
   * Then: the parser returns null so backend automatic selection remains available.
   */
  it("When: the envelope is absent Then: legacy automatic mode remains explicit", () => {
    expect(
      parseRbacAiReactionRequestMetadata({ source: "telegram" }),
    ).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: an older message stores reply-profile routing fields.
   * When: the envelope is normalized.
   * Then: obsolete routing is removed while execution settings remain intact.
   */
  it("When: legacy profile routing is normalized Then: it is removed", () => {
    expect(
      normalizeRbacAiReactionRequestMetadata({
        [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: {
          version: 1,
          replyProfileId: "assistant-profile",
          replySocialProfileId: "another-assistant-profile",
          modelId: "auto",
          reasoning: "auto",
          skillIds: [],
          useKnowledgeSearch: false,
        },
      }),
    ).toEqual({
      [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: {
        version: 1,
        modelId: "auto",
        reasoning: "auto",
        skillIds: [],
        useKnowledgeSearch: false,
      },
    });
  });

  /**
   * BDD Scenario
   * Given: a caller stores an unsupported reasoning value in the envelope.
   * When: backend parsing runs.
   * Then: it rejects the message intent instead of silently changing execution.
   */
  it("When: a present envelope is malformed Then: parsing fails closed", () => {
    expect(() =>
      parseRbacAiReactionRequestMetadata({
        [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: {
          version: 1,
          modelId: "auto",
          reasoning: "unbounded",
          skillIds: [],
          useKnowledgeSearch: false,
        },
      }),
    ).toThrow("Unsupported rbacAiReactionRequest.reasoning");
  });
});
