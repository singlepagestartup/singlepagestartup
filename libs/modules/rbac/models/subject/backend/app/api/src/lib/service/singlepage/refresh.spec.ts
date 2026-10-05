/**
 * BDD Suite: token refresh accepts only refresh tokens.
 *
 * Given: a subject stored with or without a logout mark, and tokens signed
 * for it as access tokens, refresh tokens, or before token types existed.
 * When: a token is exchanged at the refresh route.
 * Then: an unrevoked refresh token, or a token without a type, yields a new
 * typed pair; an access token and a revoked refresh token are refused.
 */

const mockSubjectFindById = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
  RBAC_JWT_SECRET: "test-jwt-secret",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS: 86400,
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) => mockSubjectFindById(...args),
  },
}));

import * as jwt from "hono/jwt";
import { signJwt } from "@sps/backend-utils";
import { Service } from "./refresh";

const subject = {
  id: "subject-1",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  variant: "default",
  slug: "subject-1",
  tokensValidAfter: null as string | null,
};

function signToken(type: "access" | "refresh") {
  return signJwt(
    { subjectId: subject.id, type, lifetimeInSeconds: 600 },
    "test-jwt-secret",
  );
}

function createService() {
  const recordActivity = jest.fn().mockResolvedValue(true);
  const service = new Service({
    repository: {} as any,
    recordActivity,
  });

  return { service, recordActivity };
}

describe("Given: a token presented to the refresh route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubjectFindById.mockResolvedValue({ ...subject });
  });

  /**
   * BDD Scenario
   * Given: an unrevoked refresh token.
   * When: it is exchanged.
   * Then: a new access and refresh pair is issued, each naming its type and
   * the subject id alone, and activity is recorded.
   */
  it("When: a refresh token is presented Then: issues a typed pair", async () => {
    const { service, recordActivity } = createService();

    const result = await service.execute({
      refresh: await signToken("refresh"),
    });

    const access = await jwt.verify(result.jwt, "test-jwt-secret");
    const refresh = await jwt.verify(result.refresh, "test-jwt-secret");

    expect(access).toMatchObject({ typ: "access" });
    expect(refresh).toMatchObject({ typ: "refresh" });
    expect(access.subject).toEqual({ id: subject.id });
    expect(refresh.subject).toEqual({ id: subject.id });
    expect(recordActivity).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: a valid access token.
   * When: it is exchanged.
   * Then: it is refused before the subject is read, so an access token
   * cannot extend its own session.
   */
  it("When: an access token is presented Then: refuses it", async () => {
    const { service, recordActivity } = createService();

    await expect(
      service.execute({ refresh: await signToken("access") }),
    ).rejects.toThrow("Authentication error. Invalid token type");
    expect(mockSubjectFindById).not.toHaveBeenCalled();
    expect(recordActivity).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a refresh token signed before token types existed.
   * When: it is exchanged.
   * Then: a typed pair is issued, so sessions from before the change renew.
   */
  it("When: an untyped token from before the change is presented Then: issues a typed pair", async () => {
    const { service } = createService();
    const issuedAt = Math.floor(Date.now() / 1000);
    const legacyToken = await jwt.sign(
      {
        exp: issuedAt + 600,
        iat: issuedAt,
        subject: { id: subject.id },
      },
      "test-jwt-secret",
    );

    const result = await service.execute({ refresh: legacyToken });

    await expect(
      jwt.verify(result.refresh, "test-jwt-secret"),
    ).resolves.toMatchObject({ typ: "refresh" });
  });

  /**
   * BDD Scenario
   * Given: a refresh token signed a minute before its subject logged out.
   * When: it is exchanged.
   * Then: it is refused as revoked and no activity is recorded.
   */
  it("When: the refresh token was revoked by a logout Then: refuses it", async () => {
    const { service, recordActivity } = createService();
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const revokedToken = await jwt.sign(
      {
        exp: issuedAt + 600,
        iat: issuedAt,
        typ: "refresh",
        subject: { id: subject.id },
      },
      "test-jwt-secret",
    );

    mockSubjectFindById.mockResolvedValue({
      ...subject,
      tokensValidAfter: new Date((issuedAt + 30) * 1000).toISOString(),
    });

    await expect(service.execute({ refresh: revokedToken })).rejects.toThrow(
      "Authentication error. Token revoked",
    );
    expect(recordActivity).not.toHaveBeenCalled();
  });
});
