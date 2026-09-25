/**
 * BDD Suite: signJwt — one claim set for every RBAC subject token.
 *
 * Given: the shared signer and the real Hono JWT implementation.
 * When: an access or a refresh token is signed for a subject.
 * Then: the token carries its type, a unique id, its issue and expiry times
 * and the subject id alone, and verifies with the same secret.
 */

import * as jwt from "hono/jwt";
import { util } from ".";

const secret = "test-jwt-secret";

describe("signJwt — one claim set for every RBAC subject token", () => {
  /**
   * BDD Scenario
   * Given: a subject id, a type and a lifetime.
   * When: a token is signed.
   * Then: the payload holds exactly exp, iat, jti, typ and subject.id, and exp
   * is iat plus the lifetime.
   */
  it("When: an access token is signed Then: it names the type and the subject id only", async () => {
    const token = await util(
      { subjectId: "subject-1", type: "access", lifetimeInSeconds: 3600 },
      secret,
    );

    const payload = await jwt.verify(token, secret);

    expect(Object.keys(payload).sort()).toEqual(
      ["exp", "iat", "jti", "subject", "typ"].sort(),
    );
    expect(payload).toMatchObject({
      typ: "access",
      subject: { id: "subject-1" },
    });
    expect(payload.subject).toEqual({ id: "subject-1" });
    expect(Number(payload.exp) - Number(payload.iat)).toBe(3600);
  });

  /**
   * BDD Scenario
   * Given: the same subject, type and second.
   * When: two refresh tokens are signed.
   * Then: both are refresh tokens and their jti values differ, so no two
   * tokens are the same string.
   */
  it("When: two tokens are signed in the same second Then: each has its own jti", async () => {
    const first = await util(
      { subjectId: "subject-1", type: "refresh", lifetimeInSeconds: 86400 },
      secret,
    );
    const second = await util(
      { subjectId: "subject-1", type: "refresh", lifetimeInSeconds: 86400 },
      secret,
    );

    const firstPayload = await jwt.verify(first, secret);
    const secondPayload = await jwt.verify(second, secret);

    expect(firstPayload.typ).toBe("refresh");
    expect(secondPayload.typ).toBe("refresh");
    expect(typeof firstPayload.jti).toBe("string");
    expect(firstPayload.jti).not.toBe(secondPayload.jti);
    expect(first).not.toBe(second);
  });
});
