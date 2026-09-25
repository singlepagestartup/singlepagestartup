/**
 * BDD Suite: the current subject comes from the database.
 *
 * Given: a subject stored in the database and access tokens that name it.
 * When: the current subject is resolved from a token.
 * Then: the stored row is returned rather than the token claims; a refresh
 * token and a revoked token are refused, and a deleted subject is null.
 */

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "test-jwt-secret",
}));

import * as jwt from "hono/jwt";
import { signJwt } from "@sps/backend-utils";
import { Service } from "./me";

const storedSubject = {
  id: "subject-1",
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  updatedAt: new Date("2026-09-20T00:00:00.000Z"),
  variant: "default",
  slug: "stored-slug",
  tokensValidAfter: null,
};

function signToken(type: "access" | "refresh") {
  return signJwt(
    { subjectId: storedSubject.id, type, lifetimeInSeconds: 600 },
    "test-jwt-secret",
  );
}

describe("Given: a request for the current subject", () => {
  /**
   * BDD Scenario
   * Given: an access token whose subject row has changed since the token was
   * signed.
   * When: the current subject is resolved.
   * Then: the row is read by id and returned as stored.
   */
  it("When: an access token is presented Then: returns the stored row", async () => {
    const findById = jest.fn().mockResolvedValue(storedSubject);
    const service = new Service({ findById });

    await expect(
      service.execute({ token: await signToken("access") }),
    ).resolves.toEqual(storedSubject);
    expect(findById).toHaveBeenCalledWith({ id: storedSubject.id });
  });

  /**
   * BDD Scenario
   * Given: a token signed before token types existed that still embeds a
   * whole, outdated subject row.
   * When: the current subject is resolved.
   * Then: the stored row is returned, not the embedded one.
   */
  it("When: an old token embeds the subject row Then: returns the stored row instead", async () => {
    const findById = jest.fn().mockResolvedValue(storedSubject);
    const service = new Service({ findById });
    const issuedAt = Math.floor(Date.now() / 1000);
    const legacyToken = await jwt.sign(
      {
        exp: issuedAt + 600,
        iat: issuedAt,
        subject: { ...storedSubject, slug: "outdated-slug" },
      },
      "test-jwt-secret",
    );

    const result = await service.execute({ token: legacyToken });

    expect(result?.slug).toBe("stored-slug");
  });

  /**
   * BDD Scenario
   * Given: a valid refresh token.
   * When: the current subject is resolved.
   * Then: it is refused before the database is read.
   */
  it("When: a refresh token is presented Then: refuses it", async () => {
    const findById = jest.fn();
    const service = new Service({ findById });

    await expect(
      service.execute({ token: await signToken("refresh") }),
    ).rejects.toThrow("Authentication error. Invalid token type");
    expect(findById).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: an access token for a subject that was deleted.
   * When: the current subject is resolved.
   * Then: the answer is null.
   */
  it("When: the subject no longer exists Then: returns null", async () => {
    const service = new Service({
      findById: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.execute({ token: await signToken("access") }),
    ).resolves.toBeNull();
  });

  /**
   * BDD Scenario
   * Given: an access token signed a minute before its subject logged out.
   * When: the current subject is resolved.
   * Then: it is refused as revoked.
   */
  it("When: the token was revoked by a logout Then: refuses it", async () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const service = new Service({
      findById: jest.fn().mockResolvedValue({
        ...storedSubject,
        tokensValidAfter: new Date((issuedAt + 30) * 1000),
      }),
    });
    const revokedToken = await jwt.sign(
      {
        exp: issuedAt + 600,
        iat: issuedAt,
        typ: "access",
        subject: { id: storedSubject.id },
      },
      "test-jwt-secret",
    );

    await expect(service.execute({ token: revokedToken })).rejects.toThrow(
      "Authentication error. Token revoked",
    );
  });
});
