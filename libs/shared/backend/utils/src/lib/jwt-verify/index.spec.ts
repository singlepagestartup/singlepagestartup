/**
 * BDD Suite: verifyJwt — token-free JWT verification failures.
 *
 * Given: tokens signed with the real Hono JWT implementation, whose failure
 * messages embed the token.
 * When: a token is verified through the shared helper, with or without an
 * expected token type.
 * Then: a credential failure becomes a fixed authentication message that
 * carries no token, a token of another type is refused, a token without a type
 * passes during the transition, and any other failure is rethrown unchanged.
 */

import * as jwt from "hono/jwt";
import { util } from ".";
import { util as signJwt } from "../jwt-sign";

const secret = "test-jwt-secret";
const otherSecret = "another-jwt-secret";

function signedAt(offsetInSeconds: number) {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + offsetInSeconds,
      subject: { id: "subject-1" },
    },
    secret,
  );
}

describe("verifyJwt — token-free JWT verification failures", () => {
  /**
   * BDD Scenario
   * Given: a token whose exp is in the past.
   * When: it is verified.
   * Then: the rejection states the token expired and repeats no part of it.
   */
  it("When: the token is expired Then: reports it without the token", async () => {
    const token = await signedAt(-60);

    await expect(util(token, secret)).rejects.toThrow(
      "Authentication error. Token expired",
    );
    await expect(util(token, secret)).rejects.not.toThrow(token);
  });

  /**
   * BDD Scenario
   * Given: a value that is not a JWT.
   * When: it is verified.
   * Then: the rejection states the token is invalid and repeats no part of it.
   */
  it("When: the token is malformed Then: reports an invalid token without the value", async () => {
    await expect(util("not-a-jwt", secret)).rejects.toThrow(
      "Authentication error. Invalid token",
    );
    await expect(util("not-a-jwt", secret)).rejects.not.toThrow("not-a-jwt");
  });

  /**
   * BDD Scenario
   * Given: a token signed with a different secret.
   * When: it is verified.
   * Then: the rejection states the token is invalid and repeats no part of it.
   */
  it("When: the signature does not match Then: reports an invalid token without the token", async () => {
    const token = await jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 600,
        subject: { id: "subject-1" },
      },
      otherSecret,
    );

    await expect(util(token, secret)).rejects.toThrow(
      "Authentication error. Invalid token",
    );
    await expect(util(token, secret)).rejects.not.toThrow(token);
  });

  /**
   * BDD Scenario
   * Given: a valid token.
   * When: it is verified.
   * Then: its payload is returned.
   */
  it("When: the token is valid Then: returns the payload", async () => {
    const token = await signedAt(600);

    await expect(util(token, secret)).resolves.toMatchObject({
      subject: { id: "subject-1" },
    });
  });

  /**
   * BDD Scenario
   * Given: a secret that the runtime cannot use as a key.
   * When: a valid token is verified with it.
   * Then: the runtime failure is rethrown unchanged, so it keeps mapping to 500.
   */
  it("When: the secret is unusable Then: rethrows the runtime failure unchanged", async () => {
    const token = await signedAt(600);

    await expect(util(token, "")).rejects.toThrow(
      "Zero-length key is not supported",
    );
    await expect(util(token, undefined as any)).rejects.toThrow(TypeError);
  });

  /**
   * BDD Scenario
   * Given: an access token and a refresh token from the shared signer.
   * When: each is verified with its own type expected.
   * Then: both payloads are returned.
   */
  it("When: the token has the expected type Then: returns the payload", async () => {
    const access = await signJwt(
      { subjectId: "subject-1", type: "access", lifetimeInSeconds: 600 },
      secret,
    );
    const refresh = await signJwt(
      { subjectId: "subject-1", type: "refresh", lifetimeInSeconds: 600 },
      secret,
    );

    await expect(
      util(access, secret, { type: "access" }),
    ).resolves.toMatchObject({ typ: "access", subject: { id: "subject-1" } });
    await expect(
      util(refresh, secret, { type: "refresh" }),
    ).resolves.toMatchObject({ typ: "refresh", subject: { id: "subject-1" } });
  });

  /**
   * BDD Scenario
   * Given: a refresh token and an access token.
   * When: each is verified where the other type is expected.
   * Then: both are refused with a fixed authentication message.
   */
  it("When: the token has the other type Then: refuses it", async () => {
    const access = await signJwt(
      { subjectId: "subject-1", type: "access", lifetimeInSeconds: 600 },
      secret,
    );
    const refresh = await signJwt(
      { subjectId: "subject-1", type: "refresh", lifetimeInSeconds: 600 },
      secret,
    );

    await expect(util(refresh, secret, { type: "access" })).rejects.toThrow(
      "Authentication error. Invalid token type",
    );
    await expect(util(access, secret, { type: "refresh" })).rejects.toThrow(
      "Authentication error. Invalid token type",
    );
  });

  /**
   * BDD Scenario
   * Given: a token signed before token types existed, with no typ claim.
   * When: it is verified as an access token and as a refresh token.
   * Then: both succeed, so sessions issued before the change keep working
   * until they expire.
   */
  it("When: the token predates token types Then: accepts it as either type", async () => {
    const token = await signedAt(600);

    await expect(
      util(token, secret, { type: "access" }),
    ).resolves.toMatchObject({ subject: { id: "subject-1" } });
    await expect(
      util(token, secret, { type: "refresh" }),
    ).resolves.toMatchObject({ subject: { id: "subject-1" } });
  });

  /**
   * BDD Scenario
   * Given: a refresh token.
   * When: it is verified without an expected type.
   * Then: the payload is returned, as it was before types existed.
   */
  it("When: no type is expected Then: accepts a token of any type", async () => {
    const refresh = await signJwt(
      { subjectId: "subject-1", type: "refresh", lifetimeInSeconds: 600 },
      secret,
    );

    await expect(util(refresh, secret)).resolves.toMatchObject({
      typ: "refresh",
    });
  });
});
