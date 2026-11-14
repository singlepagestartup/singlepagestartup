/**
 * BDD Suite: OAuth exchange code is single use.
 *
 * Given: an unconsumed oauth-exchange action row inside its lifetime.
 * When: the code is redeemed twice.
 * Then: the first redemption issues tokens and the second is rejected as consumed.
 */

const mockActionFindById = jest.fn();
const mockActionConsume = jest.fn();
const mockSubjectFindById = jest.fn();
const mockJwtSign = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS: 86400,
  RBAC_JWT_SECRET: "test-jwt-secret",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/models/action/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) => mockActionFindById(...args),
    consume: (...args: unknown[]) => mockActionConsume(...args),
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) => mockSubjectFindById(...args),
  },
}));

jest.mock("hono/jwt", () => ({
  sign: (...args: unknown[]) => mockJwtSign(...args),
}));

import { Service } from "./exchange";

function createExchangeAction(props?: {
  consumedAt?: string | null;
  expiresAt?: string;
}) {
  return {
    id: "action-exchange",
    expiresAt: props?.expiresAt ?? new Date(Date.now() + 60_000).toISOString(),
    consumedAt: null,
    payload: {
      type: "oauth-exchange",
      oauth: {
        provider: "google",
        subjectId: "subject-1",
        consumedAt: props?.consumedAt ?? null,
      },
    },
  };
}

async function redeem() {
  const service = new Service({} as any);

  return service.execute({ code: "action-exchange" });
}

describe("Given: an oauth exchange code is redeemed", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockActionFindById.mockResolvedValue(createExchangeAction());
    mockActionConsume.mockImplementation(async (props: any) => ({
      id: props.id,
    }));
    mockSubjectFindById.mockResolvedValue({ id: "subject-1", name: "person" });
    mockJwtSign.mockResolvedValue("signed-token");
  });

  /**
   * BDD Scenario: the first redemption.
   *
   * Given: the row is unconsumed and inside its lifetime.
   * When: the code is redeemed.
   * Then: an access token and a refresh token are issued, each naming its
   * type and the subject id alone, not the subject row.
   */
  it("issues tokens for an unconsumed code", async () => {
    const result = await redeem();

    expect(result).toEqual({ jwt: "signed-token", refresh: "signed-token" });
    expect(mockJwtSign).toHaveBeenCalledTimes(2);

    const [accessPayload] = mockJwtSign.mock.calls[0];
    const [refreshPayload] = mockJwtSign.mock.calls[1];

    expect(accessPayload).toMatchObject({ typ: "access" });
    expect(refreshPayload).toMatchObject({ typ: "refresh" });
    expect(accessPayload.subject).toEqual({ id: "subject-1" });
    expect(refreshPayload.subject).toEqual({ id: "subject-1" });
  });

  /**
   * BDD Scenario: a second redemption of the same code.
   *
   * Given: another request claimed the row first, so the conditional consume
   * matches nothing.
   * When: the code is redeemed again.
   * Then: it is refused as consumed and no token is signed.
   */
  it("rejects a second redemption with an authentication error", async () => {
    mockActionConsume.mockResolvedValue(undefined);

    await expect(redeem()).rejects.toThrow(
      "Authentication error. OAuth exchange code is consumed",
    );
    expect(mockJwtSign).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a row marked by the previous implementation.
   *
   * Given: the mark lives only in the payload, not in the column.
   * When: the code is redeemed.
   * Then: it is refused without attempting a claim.
   */
  it("rejects a code whose payload already carries the consumed mark", async () => {
    mockActionFindById.mockResolvedValue(
      createExchangeAction({ consumedAt: new Date().toISOString() }),
    );

    await expect(redeem()).rejects.toThrow(
      "Authentication error. OAuth exchange code is consumed",
    );
    expect(mockActionConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: ordering of the claim against the signature.
   *
   * Given: the row is claimed by a conditional write.
   * When: the redemption succeeds.
   * Then: the claim happened before any token was signed, so a lost race cannot
   * end with two sessions.
   */
  it("consumes the row before the tokens are signed", async () => {
    await redeem();

    expect(mockActionConsume.mock.invocationCallOrder[0]).toBeLessThan(
      mockJwtSign.mock.invocationCallOrder[0],
    );
  });

  /**
   * BDD Scenario: a code past its lifetime.
   *
   * Given: the row expired.
   * When: the code is redeemed.
   * Then: it is refused and nothing is claimed.
   */
  it("rejects an expired code", async () => {
    mockActionFindById.mockResolvedValue(
      createExchangeAction({
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
      }),
    );

    await expect(redeem()).rejects.toThrow(
      "Authentication error. OAuth exchange code is expired",
    );
    expect(mockActionConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the claim is conditional.
   *
   * Given: the row is unconsumed.
   * When: it is claimed.
   * Then: the claim carries the "not consumed yet" predicate and marks both the
   * column and the payload.
   */
  it("claims the exchange row with a not-yet-consumed predicate", async () => {
    await redeem();

    const [claim] = mockActionConsume.mock.calls[0];

    expect(claim.id).toBe("action-exchange");
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
