/**
 * BDD Suite: logout revokes the subject's tokens on the server.
 *
 * Given: a stored subject and the tokens a caller may present at logout.
 * When: logout runs with a valid access token, no token, a refresh token, an
 * invalid token or an already revoked one.
 * Then: only a valid, unrevoked access token writes the revocation mark,
 * drops the cached one and reports the subject; every other case revokes
 * nothing.
 */

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "test-jwt-secret",
}));

import * as jwt from "hono/jwt";
import { signJwt } from "@sps/backend-utils";
import { Service as Me } from "./me";
import { Service } from "./logout";

const storedSubject = {
  id: "subject-1",
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  updatedAt: new Date("2026-09-01T00:00:00.000Z"),
  variant: "default",
  slug: "subject-1",
  tokensValidAfter: null as Date | null,
};

function createService(subject: typeof storedSubject | null = storedSubject) {
  const findById = jest.fn().mockResolvedValue(subject);
  const update = jest.fn().mockResolvedValue(subject);
  const invalidateSubjectRevocationCache = jest.fn();
  const service = new Service({
    me: (props) => new Me({ findById }).execute(props),
    update,
    invalidateSubjectRevocationCache,
  });

  return { service, update, invalidateSubjectRevocationCache };
}

function signToken(type: "access" | "refresh") {
  return signJwt(
    { subjectId: storedSubject.id, type, lifetimeInSeconds: 600 },
    "test-jwt-secret",
  );
}

describe("Given: a logout request", () => {
  /**
   * BDD Scenario
   * Given: a valid access token.
   * When: logout runs.
   * Then: the subject's revocation mark is set to the current time, the
   * cached mark is dropped, and the revoked subject is reported.
   */
  it("When: a valid access token is presented Then: writes the revocation mark", async () => {
    const { service, update, invalidateSubjectRevocationCache } =
      createService();
    const before = Date.now();

    await expect(
      service.execute({ token: await signToken("access") }),
    ).resolves.toEqual({ subject: storedSubject });

    expect(update).toHaveBeenCalledTimes(1);

    const [{ id, data }] = update.mock.calls[0];

    expect(id).toBe(storedSubject.id);
    expect(data.tokensValidAfter).toBeInstanceOf(Date);
    expect(data.tokensValidAfter.getTime()).toBeGreaterThanOrEqual(before);
    expect(invalidateSubjectRevocationCache).toHaveBeenCalledWith(
      storedSubject.id,
    );
  });

  /**
   * BDD Scenario
   * Given: no token, a refresh token, or a value that is not a token.
   * When: logout runs.
   * Then: nothing is written and no subject is reported.
   */
  it("When: no usable access token is presented Then: writes nothing", async () => {
    const { service, update, invalidateSubjectRevocationCache } =
      createService();

    await expect(service.execute({})).resolves.toEqual({ subject: null });
    await expect(
      service.execute({ token: await signToken("refresh") }),
    ).resolves.toEqual({ subject: null });
    await expect(service.execute({ token: "not-a-token" })).resolves.toEqual({
      subject: null,
    });

    expect(update).not.toHaveBeenCalled();
    expect(invalidateSubjectRevocationCache).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: an access token signed before the subject's last logout.
   * When: it is presented at logout again.
   * Then: the mark is not moved, so a replayed old token cannot end the
   * sessions started after that logout.
   */
  it("When: an already revoked token is presented Then: leaves the mark in place", async () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const { service, update } = createService({
      ...storedSubject,
      tokensValidAfter: new Date((issuedAt + 30) * 1000),
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

    await expect(service.execute({ token: revokedToken })).resolves.toEqual({
      subject: null,
    });
    expect(update).not.toHaveBeenCalled();
  });
});
