/**
 * BDD Suite: OAuth exchange controller reads the code out of band.
 *
 * Given: the callback handed the exchange code over as an HttpOnly cookie.
 * When: the landing page redeems it.
 * Then: the cookie is the source, the body is read only under the compatibility flag, and the cookie is cleared either way.
 */

const mockEnvs = {
  RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY: false,
};
const mockJwtVerify = jest.fn();
const mockGetCookie = jest.fn();
const mockSetCookie = jest.fn();
const mockDeleteCookie = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "test-jwt-secret",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
  RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS: 120,
  get RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY() {
    return mockEnvs.RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY;
  },
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("hono/jwt", () => ({
  verify: (...args: unknown[]) => mockJwtVerify(...args),
}));

jest.mock("hono/cookie", () => ({
  getCookie: (...args: unknown[]) => mockGetCookie(...args),
  setCookie: (...args: unknown[]) => mockSetCookie(...args),
  deleteCookie: (...args: unknown[]) => mockDeleteCookie(...args),
}));

import { Handler } from "./exchange";

function createContext(body?: Record<string, string>) {
  return {
    req: {
      parseBody: jest.fn().mockResolvedValue(body ?? {}),
    },
    json: jest.fn((payload: unknown, status: number) => ({ payload, status })),
  } as any;
}

function createService(props?: { fail?: boolean }) {
  return {
    authenticationOAuthExchange: jest.fn(async () => {
      if (props?.fail) {
        throw new Error(
          "Authentication error. OAuth exchange code is consumed",
        );
      }

      return { jwt: "session-jwt", refresh: "refresh-jwt" };
    }),
  } as any;
}

describe("Given: the exchange controller redeems an OAuth code", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockEnvs.RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY = false;
    mockJwtVerify.mockResolvedValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    mockGetCookie.mockReturnValue(undefined);
  });

  /**
   * BDD Scenario: the supported handoff.
   *
   * Given: the cookie carries the code and the body is empty.
   * When: the code is redeemed.
   * Then: the service receives the code from the cookie.
   */
  it("reads the code from the cookie when the query flag is off", async () => {
    mockGetCookie.mockReturnValue("action-exchange");

    const service = createService();
    const handler = new Handler(service);

    await handler.execute(createContext(), undefined);

    expect(service.authenticationOAuthExchange).toHaveBeenCalledWith({
      code: "action-exchange",
    });
  });

  /**
   * BDD Scenario: a code offered in the request body by default.
   *
   * Given: no cookie is present and the compatibility flag is off.
   * When: the body carries a code.
   * Then: it is refused, so the code cannot be replayed from a URL.
   */
  it("refuses a body code while the compatibility flag is off", async () => {
    const service = createService();
    const handler = new Handler(service);

    await expect(
      handler.execute(
        createContext({ data: JSON.stringify({ code: "action-exchange" }) }),
        undefined,
      ),
    ).rejects.toThrow("Validation error. OAuth exchange code is required");
    expect(service.authenticationOAuthExchange).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the one-release escape hatch.
   *
   * Given: the API and the host are not on the same site, so the flag is on.
   * When: the body carries a code and no cookie arrived.
   * Then: the body is accepted.
   */
  it("reads the code from the body when the compatibility flag is on", async () => {
    mockEnvs.RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY = true;

    const service = createService();
    const handler = new Handler(service);

    await handler.execute(
      createContext({ data: JSON.stringify({ code: "action-exchange" }) }),
      undefined,
    );

    expect(service.authenticationOAuthExchange).toHaveBeenCalledWith({
      code: "action-exchange",
    });
  });

  /**
   * BDD Scenario: the cookie after a successful redemption.
   *
   * Given: the code was redeemed.
   * When: the session cookie is written.
   * Then: the exchange cookie is cleared, because the code is spent.
   */
  it("clears the exchange cookie after a successful redemption", async () => {
    mockGetCookie.mockReturnValue("action-exchange");

    const handler = new Handler(createService());

    await handler.execute(createContext(), undefined);

    expect(mockDeleteCookie).toHaveBeenCalledWith(
      expect.anything(),
      "rbac.oauth.exchange-code",
      { path: "/" },
    );
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      "rbac.subject.jwt",
      "session-jwt",
      expect.objectContaining({ sameSite: "Strict" }),
    );
  });

  /**
   * BDD Scenario: the cookie after a refused redemption.
   *
   * Given: the service refused the code as already consumed.
   * When: the controller answers.
   * Then: the exchange cookie is cleared as well, so it cannot be retried.
   */
  it("clears the exchange cookie when the redemption is refused", async () => {
    mockGetCookie.mockReturnValue("action-exchange");

    const handler = new Handler(createService({ fail: true }));

    await expect(handler.execute(createContext(), undefined)).rejects.toThrow(
      "Authentication error. OAuth exchange code is consumed",
    );
    expect(mockDeleteCookie).toHaveBeenCalledWith(
      expect.anything(),
      "rbac.oauth.exchange-code",
      { path: "/" },
    );
  });
});
