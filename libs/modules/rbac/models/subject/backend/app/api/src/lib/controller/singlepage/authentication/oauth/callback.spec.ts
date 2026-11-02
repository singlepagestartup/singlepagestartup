/**
 * BDD Suite: OAuth callback controller logging and code handoff.
 *
 * Given: the callback service returns a redirect URL and an exchange code.
 * When: the controller answers the browser.
 * Then: the code is set as an HttpOnly cookie and never appears in any log record.
 */

const mockLoggerInfo = jest.fn();
const mockSetCookie = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS: 120,
}));

jest.mock("@sps/backend-utils", () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("hono/cookie", () => ({
  setCookie: (...args: unknown[]) => mockSetCookie(...args),
}));

import { Handler } from "./callback";

const exchangeCode = "action-exchange";
const redirectUrl = "https://host.example/landing?oauthExchange=google";

function createContext(query: Record<string, string | undefined>) {
  return {
    req: {
      param: () => "google",
      query: (name: string) => query[name],
    },
    redirect: jest.fn((url: string, status: number) => ({ url, status })),
  } as any;
}

function createService(result?: Record<string, unknown>) {
  return {
    authenticationOAuthCallback: jest.fn().mockResolvedValue({
      redirectUrl,
      redirectPath: "/landing",
      exchangeCode,
      ...result,
    }),
  } as any;
}

describe("Given: the callback controller answers a returning browser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: the code handoff.
   *
   * Given: the service returned an exchange code.
   * When: the controller answers.
   * Then: the code is written as an HttpOnly, SameSite=Lax cookie.
   */
  it("sets the exchange code as an HttpOnly, SameSite=Lax cookie", async () => {
    const handler = new Handler(createService());

    await handler.execute(
      createContext({ state: "action-state", code: "google-code" }),
      undefined,
    );

    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      "rbac.oauth.exchange-code",
      exchangeCode,
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 120,
      }),
    );
  });

  /**
   * BDD Scenario: what the log record carries.
   *
   * Given: the callback was handled.
   * When: the controller logs it.
   * Then: the record names the provider, the state and the normalised path.
   */
  it("logs the provider, state and redirect path only", async () => {
    const handler = new Handler(createService());

    await handler.execute(
      createContext({ state: "action-state", code: "google-code" }),
      undefined,
    );

    expect(mockLoggerInfo).toHaveBeenCalledWith("oauth/callback handled", {
      provider: "google",
      state: "action-state",
      hasCode: true,
      error: undefined,
      redirectPath: "/landing",
    });
  });

  /**
   * BDD Scenario: the log is not a credential store.
   *
   * Given: the callback issued an exchange code.
   * When: the controller logs it.
   * Then: neither the code nor the built URL appears anywhere in the record.
   */
  it("never logs the exchange code or the built URL", async () => {
    const handler = new Handler(createService());

    await handler.execute(
      createContext({ state: "action-state", code: "google-code" }),
      undefined,
    );

    const serialized = JSON.stringify(mockLoggerInfo.mock.calls);

    expect(serialized).not.toContain(exchangeCode);
    expect(serialized).not.toContain(redirectUrl);
    expect(serialized).not.toContain("google-code");
  });

  /**
   * BDD Scenario: the redirect itself.
   *
   * Given: the service built a URL on the host origin.
   * When: the controller answers.
   * Then: the browser is sent there with a 302.
   */
  it("redirects with 302 to the normalised URL", async () => {
    const context = createContext({
      state: "action-state",
      code: "google-code",
    });
    const handler = new Handler(createService());

    await handler.execute(context, undefined);

    expect(context.redirect).toHaveBeenCalledWith(redirectUrl, 302);
  });

  /**
   * BDD Scenario: an outcome with no code.
   *
   * Given: the service answered with an error redirect.
   * When: the controller answers.
   * Then: no cookie is written.
   */
  it("writes no cookie when the service issued no exchange code", async () => {
    const handler = new Handler(createService({ exchangeCode: undefined }));

    await handler.execute(createContext({ state: "action-state" }), undefined);

    expect(mockSetCookie).not.toHaveBeenCalled();
  });
});
