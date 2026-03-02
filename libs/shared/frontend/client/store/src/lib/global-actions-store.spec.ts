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
