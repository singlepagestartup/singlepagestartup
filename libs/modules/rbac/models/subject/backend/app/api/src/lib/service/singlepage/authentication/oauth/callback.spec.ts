/**
 * BDD Suite: OAuth callback redirect and exchange-code handling.
 *
 * Given: a valid, unconsumed OAuth state row exists for a completed Google sign-in.
 * When: the callback service builds its result.
 * Then: the redirect URL stays on the host origin and carries no exchange code.
 */

const mockActionFindById = jest.fn();
const mockActionCreate = jest.fn();
const mockActionConsume = jest.fn();
const mockSubjectsToActionsCreate = jest.fn();
const mockSubjectCreate = jest.fn();
const mockIdentityFind = jest.fn();
const mockIdentityCreate = jest.fn();
const mockSubjectsToIdentitiesFind = jest.fn();
const mockSubjectsToIdentitiesCreate = jest.fn();
const mockRoleFind = jest.fn();
const mockSubjectsToRolesFind = jest.fn();
const mockSubjectsToRolesCreate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  API_SERVICE_URL: "https://api.example",
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://host.example",
  RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY: false,
  RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS: 120,
  RBAC_OAUTH_GOOGLE_CLIENT_ID: "test-google-client-id",
  RBAC_OAUTH_GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  RBAC_OAUTH_GOOGLE_REDIRECT_URI: "",
  RBAC_OAUTH_SUCCESS_REDIRECT_PATH: "/",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/models/action/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) => mockActionFindById(...args),
    create: (...args: unknown[]) => mockActionCreate(...args),
    consume: (...args: unknown[]) => mockActionConsume(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-actions/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectsToActionsCreate(...args),
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectCreate(...args),
  },
}));

jest.mock("@sps/rbac/models/identity/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => mockIdentityFind(...args),
    create: (...args: unknown[]) => mockIdentityCreate(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-identities/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => mockSubjectsToIdentitiesFind(...args),
    create: (...args: unknown[]) => mockSubjectsToIdentitiesCreate(...args),
  },
}));

jest.mock("@sps/rbac/models/role/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => mockRoleFind(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-roles/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => mockSubjectsToRolesFind(...args),
    create: (...args: unknown[]) => mockSubjectsToRolesCreate(...args),
  },
}));

import { Service } from "./callback";

const exchangeActionId = "action-exchange";

function createStateAction(props?: {
  redirectTo?: string | null;
  consumedAt?: string | null;
}) {
  return {
    id: "action-state",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    consumedAt: null,
    payload: {
      type: "oauth-state",
      oauth: {
        provider: "google",
        flow: "signin",
        sourceSubjectId: null,
        redirectTo: props?.redirectTo ?? "/landing",
        consumedAt: props?.consumedAt ?? null,
      },
    },
  };
}

function mockGoogleProfileResponses() {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "google-access-token" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: "google-account-id",
        email: "person@example.com",
        email_verified: true,
        name: "Person",
      }),
    });
}

async function executeCallback() {
  const service = new Service({} as any);

  return service.execute({
    provider: "google",
    state: "action-state",
    code: "google-authorization-code",
  });
}

describe("Given: a completed Google sign-in returns to the callback", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn();
    mockGoogleProfileResponses();

    mockActionFindById.mockResolvedValue(createStateAction());
    mockActionConsume.mockImplementation(async (props: any) => ({
      id: props.id,
    }));
    mockActionCreate.mockResolvedValue({ id: exchangeActionId });
    mockSubjectsToActionsCreate.mockResolvedValue({ id: "subject-action" });
    mockSubjectCreate.mockResolvedValue({ id: "subject-new" });
    mockIdentityFind.mockResolvedValue([]);
    mockIdentityCreate.mockResolvedValue({ id: "identity-google" });
    // The link exists only once it has been created, so the two lookups the
    // service makes around linking answer differently.
    mockSubjectsToIdentitiesFind.mockImplementation(async () =>
      mockSubjectsToIdentitiesCreate.mock.calls.length
        ? [
            {
              id: "subject-identity",
              subjectId: "subject-new",
              identityId: "identity-google",
            },
          ]
        : [],
    );
    mockSubjectsToIdentitiesCreate.mockResolvedValue({
      id: "subject-identity",
    });
    mockRoleFind.mockResolvedValue([]);
    mockSubjectsToRolesFind.mockResolvedValue([]);
  });

  /**
   * BDD Scenario: the stored target is a path on the host.
   *
   * Given: the state row carries a same-origin path.
   * When: the callback builds its result.
   * Then: the browser is sent to that path on the host origin.
   */
  it("builds a redirect on the host origin", async () => {
    const result = await executeCallback();

    expect(new URL(result.redirectUrl).origin).toBe("https://host.example");
    expect(new URL(result.redirectUrl).pathname).toBe("/landing");
    expect(result.redirectPath).toBe("/landing");
  });

  /**
   * BDD Scenario: the redirect URL is not a credential carrier.
   *
   * Given: an exchange code was created for the signed-in subject.
   * When: the redirect URL is built.
   * Then: the code appears nowhere in it.
   */
  it("does not put the exchange code in the redirect URL", async () => {
    const result = await executeCallback();

    expect(new URL(result.redirectUrl).searchParams.get("code")).toBeNull();
    expect(result.redirectUrl).not.toContain(exchangeActionId);
  });

  /**
   * BDD Scenario: the code reaches the controller out of band.
   *
   * Given: the callback created an exchange action.
   * When: the result is returned.
   * Then: the code is a separate field, and the landing page is marked so it
   * knows a code is waiting.
   */
  it("returns the exchange code as a separate field", async () => {
    const result = await executeCallback();

    expect(result.exchangeCode).toBe(exchangeActionId);
    expect(new URL(result.redirectUrl).searchParams.get("oauthExchange")).toBe(
      "google",
    );
  });

  /**
   * BDD Scenario: a row written before redirect validation existed.
   *
   * Given: the state row carries an authority-relative target.
   * When: the callback builds its result.
   * Then: the browser goes to the default on the host origin instead.
   */
  it("redirects to the default when the stored target is off-origin", async () => {
    mockActionFindById.mockResolvedValue(
      createStateAction({ redirectTo: "//evil.example/steal" }),
    );

    const result = await executeCallback();

    expect(new URL(result.redirectUrl).origin).toBe("https://host.example");
    expect(result.redirectPath).toBe("/");
  });

  /**
   * BDD Scenario: the state was already used.
   *
   * Given: the state row carries the mark left by the previous implementation.
   * When: the callback runs.
   * Then: it answers with the consumed error and issues no code.
   */
  it("returns the consumed error result when the state row is already consumed", async () => {
    mockActionFindById.mockResolvedValue(
      createStateAction({ consumedAt: new Date().toISOString() }),
    );

    const result = await executeCallback();

    expect(new URL(result.redirectUrl).searchParams.get("oauthError")).toBe(
      "oauth_state_consumed",
    );
    expect(result.exchangeCode).toBeUndefined();
    expect(mockActionConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: two callbacks race on one state.
   *
   * Given: the conditional consume finds no unconsumed row, because the other
   * request claimed it first.
   * When: the callback runs.
   * Then: it answers with the consumed error and never fetches the profile.
   */
  it("returns the consumed error result when the conditional consume claims nothing", async () => {
    mockActionConsume.mockResolvedValue(undefined);

    const result = await executeCallback();

    expect(new URL(result.redirectUrl).searchParams.get("oauthError")).toBe(
      "oauth_state_consumed",
    );
    expect(result.exchangeCode).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the consume is conditional, not a read followed by a write.
   *
   * Given: the state row is unconsumed.
   * When: the callback claims it.
   * Then: the claim carries the "not consumed yet" predicate and marks both the
   * column and the payload, so an instance on the previous release agrees.
   */
  it("claims the state row with a not-yet-consumed predicate", async () => {
    await executeCallback();

    const [claim] = mockActionConsume.mock.calls[0];

    expect(claim.id).toBe("action-state");
    expect(claim.filters).toEqual({
      and: [
        {
          column: "consumedAt",
          method: "isNull",
        },
      ],
    });
    expect(claim.data.consumedAt).toEqual(expect.any(String));
    expect(claim.data.payload.oauth.consumedAt).toEqual(expect.any(String));
  });
});
