/**
 * BDD Suite: thread-scoped AI composer preferences.
 *
 * Given: a social thread stores opaque metadata.
 * When: an OpenRouter model preference is written or read.
 * Then: the RBAC namespace is validated without replacing unrelated metadata.
 */

import {
  parseRbacAiThreadPreferences,
  setRbacAiThreadModelPreference,
} from "./ai-thread-preferences";

describe("Given: thread-scoped AI composer preferences", () => {
  /**
   * BDD Scenario
   * Given: thread metadata already contains another feature namespace.
   * When: a model is selected for the thread.
   * Then: the model preference is stored and the existing metadata remains intact.
   */
  it("When: model preference is written Then: unrelated metadata is preserved", () => {
    const metadata = setRbacAiThreadModelPreference({
      metadata: {
        anotherFeature: {
          enabled: true,
        },
      },
      modelId: "minimax/minimax-m2.5",
    });

    expect(metadata).toEqual({
      anotherFeature: {
        enabled: true,
      },
      rbacAiThreadPreferences: {
        version: 1,
        modelId: "minimax/minimax-m2.5",
      },
    });
    expect(parseRbacAiThreadPreferences(metadata)).toEqual({
      version: 1,
      modelId: "minimax/minimax-m2.5",
    });
  });

  /**
   * BDD Scenario
   * Given: a thread already stores a concrete model.
   * When: the user explicitly selects Auto.
   * Then: Auto replaces the concrete model as the persisted thread preference.
   */
  it("When: Auto is selected Then: it replaces the concrete model", () => {
    const metadata = setRbacAiThreadModelPreference({
      metadata: setRbacAiThreadModelPreference({
        metadata: {},
        modelId: "minimax/minimax-m2.5",
      }),
      modelId: "auto",
    });

    expect(parseRbacAiThreadPreferences(metadata)).toEqual({
      version: 1,
      modelId: "auto",
    });
  });

  /**
   * BDD Scenario
   * Given: legacy or malformed metadata has no valid model preference.
   * When: the preference is read.
   * Then: the parser fails closed so the composer can use Auto.
   */
  it("When: metadata is malformed Then: no model preference is returned", () => {
    expect(
      parseRbacAiThreadPreferences({
        rbacAiThreadPreferences: {
          version: 2,
          modelId: "minimax/minimax-m2.5",
        },
      }),
    ).toBeNull();
    expect(() =>
      setRbacAiThreadModelPreference({ metadata: {}, modelId: "" }),
    ).toThrow("Invalid OpenRouter thread model id");
  });
});
