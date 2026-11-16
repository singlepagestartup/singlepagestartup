/** @jest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
let availableProfiles: any[] = [];
const ensure = jest.fn();
const invalidateQueries = jest.fn();
jest.mock("./find", () => ({
  action: () => ({
    data: availableProfiles,
    isSuccess: true,
    isPending: false,
  }),
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { socialModuleProfileEnsure: (...args: unknown[]) => ensure(...args) },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  clientHost: "http://localhost:4000",
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({ Authorization: "Bearer guest" }),
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  appendToListQueries: jest.fn(),
  queryClient: {
    invalidateQueries: (...args: unknown[]) => invalidateQueries(...args),
  },
}));
import {
  ensureActiveSocialModuleProfile,
  readSocialModuleProfileSelections,
  selectSocialModuleProfile,
  useActiveSocialModuleProfile,
} from "./active-selection";

beforeEach(() => {
  sessionStorage.clear();
  ensure.mockReset();
  availableProfiles = [
    { id: "assistant", variant: "artificial-intelligence" },
    { id: "personal", variant: "default" },
  ];
});

it("shares selection across cart and menu, survives reload, and isolates accounts", () => {
  const menu = renderHook(() => useActiveSocialModuleProfile("owner"));
  const cart = renderHook(() => useActiveSocialModuleProfile("owner"));
  act(() => menu.result.current.selectProfile("assistant"));
  expect(cart.result.current.socialModuleProfileId).toBe("assistant");
  menu.unmount();
  cart.unmount();
  const restored = renderHook(() => useActiveSocialModuleProfile("owner"));
  const other = renderHook(() => useActiveSocialModuleProfile("other"));
  expect(restored.result.current.socialModuleProfileId).toBe("assistant");
  expect(other.result.current.socialModuleProfileId).toBe("personal");
  expect(readSocialModuleProfileSelections()).toEqual({
    owner: "assistant",
    other: "personal",
  });
});

it("replaces a revoked profile with the accessible personal profile", () => {
  selectSocialModuleProfile("owner", "assistant");
  const hook = renderHook(() => useActiveSocialModuleProfile("owner"));
  availableProfiles = [{ id: "personal", variant: "default" }];
  hook.rerender();
  expect(hook.result.current.socialModuleProfileId).toBe("personal");
  expect(sessionStorage.getItem("sps:active-social-profile:owner")).toBe(
    "personal",
  );
});

it("accepts a named URL profile and does not overwrite a pending menu switch with the old URL", () => {
  const hook = renderHook(
    ({ id }) => useActiveSocialModuleProfile("owner", id),
    { initialProps: { id: "assistant" as string | undefined } },
  );
  expect(hook.result.current.socialModuleProfileId).toBe("assistant");
  act(() => hook.result.current.selectProfile("personal"));
  expect(sessionStorage.getItem("sps:active-social-profile:owner")).toBe(
    "personal",
  );
  hook.rerender({ id: undefined });
  expect(hook.result.current.socialModuleProfileId).toBe("personal");
});

it("ensures one guest personal profile before simultaneous first cart actions", async () => {
  let finish!: (value: any) => void;
  ensure.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const first = ensureActiveSocialModuleProfile("guest");
  const second = ensureActiveSocialModuleProfile("guest");
  expect(ensure).toHaveBeenCalledTimes(1);
  expect(ensure).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "guest",
      options: { headers: { Authorization: "Bearer guest" } },
    }),
  );
  finish({ id: "guest-profile", variant: "default" });
  await expect(first).resolves.toBe("guest-profile");
  await expect(second).resolves.toBe("guest-profile");
});
