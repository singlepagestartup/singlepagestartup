/**
 * BDD Suite: OAuth start stores only an accepted redirect target and a live
 * source subject.
 *
 * Given: a caller begins the Google flow with a redirect target, and for the
 * link flow with the token of the subject to link.
 * When: the start service writes the state action row.
 * Then: the stored redirectTo is same-origin, or the configured default, and
 * never the raw input; only an unrevoked access token supplies the source
 * subject.
 */

const mockActionCreate = jest.fn();
const mockSubjectsToActionsCreate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  API_SERVICE_URL: "https://api.example",
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://host.example",
  RBAC_JWT_SECRET: "test-jwt-secret",
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

import * as jwt from "hono/jwt";
import { signJwt } from "@sps/backend-utils";
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

/**
 * BDD Suite: the link flow requires a live access token.
 *
 * Given: a signed-in caller starts the Google link flow.
 * When: the caller presents an access token, a refresh token, or an access
 * token revoked by a logout.
 * Then: only the unrevoked access token supplies the subject the Google
 * identity will be linked to; the others are refused.
 */
describe("Given: a caller starts the Google link flow", () => {
  const subject = {
    id: "subject-link",
    tokensValidAfter: null as Date | null,
  };

  function createService(storedSubject: typeof subject = subject) {
    return new Service({
      findFirstByField: jest.fn().mockResolvedValue(storedSubject),
    } as any);
  }

  function signToken(type: "access" | "refresh") {
    return signJwt(
      { subjectId: subject.id, type, lifetimeInSeconds: 600 },
      "test-jwt-secret",
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockActionCreate.mockResolvedValue({ id: "action-state" });
  });

  /**
   * BDD Scenario: a live access token.
   *
   * Given: an access token of a subject that has not logged out.
   * When: the link flow starts.
   * Then: the state row names that subject as the source.
   */
  it("stores the subject of a live access token as the source", async () => {
    await createService().execute({
      provider: "google",
      authorization: await signToken("access"),
      data: { flow: "link" },
    });

    expect(
      mockActionCreate.mock.calls[0][0].data.payload.oauth.sourceSubjectId,
    ).toBe(subject.id);
  });

  /**
   * BDD Scenario: a refresh token.
   *
   * Given: a valid refresh token.
   * When: the link flow starts.
   * Then: it is refused as unauthenticated and no state row is written.
   */
  it("refuses a refresh token", async () => {
    await expect(
      createService().execute({
        provider: "google",
        authorization: await signToken("refresh"),
        data: { flow: "link" },
      }),
    ).rejects.toThrow("Link flow requires authenticated subject");
    expect(mockActionCreate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a token revoked by a logout.
   *
   * Given: an unexpired access token signed before its subject logged out.
   * When: the link flow starts.
   * Then: it is refused, so a stolen token cannot link an identity after the
   * owner logged out.
   */
  it("refuses an access token revoked by a logout", async () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const revokedToken = await jwt.sign(
      {
        exp: issuedAt + 600,
        iat: issuedAt,
        typ: "access",
        subject: { id: subject.id },
      },
      "test-jwt-secret",
    );

    await expect(
      createService({
        ...subject,
        tokensValidAfter: new Date((issuedAt + 30) * 1000),
      }).execute({
        provider: "google",
        authorization: revokedToken,
        data: { flow: "link" },
      }),
    ).rejects.toThrow("Link flow requires authenticated subject");
    expect(mockActionCreate).not.toHaveBeenCalled();
  });
});
