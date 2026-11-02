/**
 * BDD Suite: OAuth start stores only an accepted redirect target.
 *
 * Given: an anonymous caller begins the Google sign-in flow with a redirect target.
 * When: the start service writes the state action row.
 * Then: the stored redirectTo is same-origin, or the configured default, and never the raw input.
 */

const mockActionCreate = jest.fn();
const mockSubjectsToActionsCreate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  API_SERVICE_URL: "https://api.example",
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://host.example",
  RBAC_JWT_SECRET: undefined,
  RBAC_OAUTH_GOOGLE_CLIENT_ID: "test-google-client-id",
  RBAC_OAUTH_GOOGLE_REDIRECT_URI: "",
  RBAC_OAUTH_STATE_LIFETIME_IN_SECONDS: 600,
  RBAC_OAUTH_SUCCESS_REDIRECT_PATH: "/",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/models/action/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockActionCreate(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-actions/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectsToActionsCreate(...args),
  },
}));

import { Service } from "./start";

function getStoredRedirectTo() {
  return mockActionCreate.mock.calls[0][0].data.payload.oauth.redirectTo;
}

describe("Given: a caller starts the Google sign-in flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActionCreate.mockResolvedValue({ id: "action-state" });
  });

  /**
   * BDD Scenario: a path on the host origin.
   *
   * Given: the caller asks to return to a page of the host.
   * When: the state row is written.
   * Then: that path is stored.
   */
  it("stores a same-origin path", async () => {
    const service = new Service({} as any);

    await service.execute({
      provider: "google",
      data: {
        flow: "signin",
        redirectTo: "/account/settings",
      },
    });

    expect(getStoredRedirectTo()).toBe("/account/settings");
  });

  /**
   * BDD Scenario: a target that resolves off the host origin.
   *
   * Given: the caller supplies an authority-relative target.
   * When: the state row is written.
   * Then: the default is stored, so the value never reaches the database.
   */
  it("stores the default when the supplied target is off-origin", async () => {
    const service = new Service({} as any);

    await service.execute({
      provider: "google",
      data: {
        flow: "signin",
        redirectTo: "//evil.example/steal",
      },
    });

    expect(getStoredRedirectTo()).toBe("/");
  });

  /**
   * BDD Scenario: no target at all.
   *
   * Given: the caller supplies no redirect target.
   * When: the state row is written.
   * Then: the configured default is stored.
   */
  it("stores the default when no target is supplied", async () => {
    const service = new Service({} as any);

    await service.execute({
      provider: "google",
      data: {
        flow: "signin",
      },
    });

    expect(getStoredRedirectTo()).toBe("/");
  });
});
