/**
 * BDD Suite: global-actions-store.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { useGlobalActionsStore } from "./global-actions-store";

function createSessionStorageMock() {
  const storage = new Map<string, string>();

  return {
    getItem: jest.fn((key: string) => storage.get(key) || null),
    setItem: jest.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      storage.delete(key);
    }),
    clear: jest.fn(() => storage.clear()),
  };
}

describe("global-actions-store", () => {
  beforeEach(() => {
    Object.defineProperty(global, "sessionStorage", {
      value: createSessionStorageMock(),
      configurable: true,
    });
  });

  afterEach(() => {
    useGlobalActionsStore.getState().reset();
  });

  /**
   * BDD Scenario
   * Given: a frontend query action contains a large response payload.
   * When: the action is added to the global actions store.
   * Then: the in-memory action remains complete, but session storage receives a compact snapshot.
   */
  it("compacts large action payloads before persisting to session storage", () => {
    const largeResult = {
      models: Array.from({ length: 200 }, (_, index) => {
        return {
          id: `model-${index}`,
          name: `Model ${index}`,
          description: "x".repeat(100),
        };
      }),
    };

    useGlobalActionsStore.getState().addAction({
      type: "query",
      name: "openrouter-models",
      requestId: "request-large",
      timestamp: 3,
      props: {},
      result: largeResult,
    });

    const actions = useGlobalActionsStore
      .getState()
      .getActionsFromStoreByName("openrouter-models");
    const persistedValue = (global as any).sessionStorage.setItem.mock
      .calls[0][1];
    const persistedSnapshot = JSON.parse(persistedValue);

    expect(actions?.[0].result).toBe(largeResult);
    expect(persistedSnapshot["openrouter-models"].actions[0].result).toEqual(
      expect.objectContaining({
        __truncated: true,
        type: "object",
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: browser session storage is already over quota.
   * When: persisting an action throws from setItem.
   * Then: the action remains available in memory and the stale persisted key is cleared silently.
   */
  it("keeps in-memory actions when session storage quota is exceeded", () => {
    (global as any).sessionStorage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    useGlobalActionsStore.getState().addAction({
      type: "query",
      name: "openrouter-models",
      requestId: "request-quota",
      timestamp: 4,
      props: {},
      result: {
        models: [],
      },
    });

    expect(
      useGlobalActionsStore
        .getState()
        .getActionsFromStoreByName("openrouter-models"),
    ).toHaveLength(1);
    expect((global as any).sessionStorage.removeItem).toHaveBeenCalledWith(
      "global-actions-store",
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("adds actions and returns them by store name", () => {
    useGlobalActionsStore.getState().addAction({
      type: "mutation",
      name: "revalidation",
      requestId: "request-1",
      timestamp: 1,
      props: { key: "value" },
    });

    const actions = useGlobalActionsStore
      .getState()
      .getActionsFromStoreByName("revalidation");

    expect(actions).toHaveLength(1);
    expect(actions?.[0].requestId).toBe("request-1");
    expect((global as any).sessionStorage.setItem).toHaveBeenCalledWith(
      "global-actions-store",
      expect.any(String),
    );
  });

  it("resets actions state and clears session storage", () => {
    useGlobalActionsStore.getState().addAction({
      type: "query",
      name: "revalidation",
      requestId: "request-2",
      timestamp: 2,
      props: {},
    });

    useGlobalActionsStore.getState().reset();

    expect(useGlobalActionsStore.getState().stores).toEqual({});
    expect((global as any).sessionStorage.removeItem).toHaveBeenCalledWith(
      "global-actions-store",
    );
  });
});
