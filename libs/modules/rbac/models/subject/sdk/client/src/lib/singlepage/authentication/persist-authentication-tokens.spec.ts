/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: persistAuthenticationTokens.
 *
 * Given: browser storage, JWT parsing, and cookie writes are controlled by test doubles.
 * When: authentication tokens are persisted after init or refresh.
 * Then: refresh token is stored in localStorage and JWT cookie receives an expiration derived from token exp.
 */

const cookiesSetMock = jest.fn();
const cookiesRemoveMock = jest.fn();
const parseJwtMock = jest.fn();
const dispatchEventMock = jest.fn();

jest.mock("js-cookie", () => ({
  __esModule: true,
  default: {
    set: (...args: unknown[]) => cookiesSetMock(...args),
    remove: (...args: unknown[]) => cookiesRemoveMock(...args),
  },
}));

jest.mock("@sps/shared-frontend-client-utils", () => ({
  authorization: {
    parseJwt: (...args: unknown[]) => parseJwtMock(...args),
  },
}));

import {
  AUTHENTICATION_STORAGE_EVENT,
  clearAuthenticationTokens,
  persistAuthenticationTokens,
} from "./persist-authentication-tokens";

describe("Given: authentication tokens persistence", () => {
  const originalDispatchEvent = window.dispatchEvent;

  beforeAll(() => {
    window.dispatchEvent = dispatchEventMock as typeof window.dispatchEvent;
  });

  afterAll(() => {
    window.dispatchEvent = originalDispatchEvent;
  });

  beforeEach(() => {
    localStorage.clear();
    cookiesSetMock.mockReset();
    cookiesRemoveMock.mockReset();
    parseJwtMock.mockReset();
    dispatchEventMock.mockReset();
  });

  it("When: JWT contains exp Then: cookie is persisted with matching expiration", () => {
    parseJwtMock.mockReturnValue({
      exp: 1_800_000_000,
    });

    persistAuthenticationTokens({
      jwt: "valid.jwt.token",
      refresh: "refresh-token",
    });

    expect(localStorage.getItem("rbac.subject.refresh")).toBe("refresh-token");
    expect(cookiesSetMock).toHaveBeenCalledWith(
      "rbac.subject.jwt",
      "valid.jwt.token",
      expect.objectContaining({
        path: "/",
        sameSite: "strict",
        expires: new Date(1_800_000_000 * 1000),
      }),
    );
    expect(dispatchEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTHENTICATION_STORAGE_EVENT,
      }),
    );
  });

  it("When: JWT parsing fails Then: cookie is still persisted without expires override", () => {
    parseJwtMock.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    persistAuthenticationTokens({
      jwt: "broken.jwt.token",
      refresh: "refresh-token",
    });

    expect(localStorage.getItem("rbac.subject.refresh")).toBe("refresh-token");
    expect(cookiesSetMock).toHaveBeenCalledWith(
      "rbac.subject.jwt",
      "broken.jwt.token",
      expect.objectContaining({
        path: "/",
        sameSite: "strict",
      }),
    );
    expect(cookiesSetMock.mock.calls[0]?.[2]).not.toHaveProperty("expires");
  });

  it("When: auth state is cleared Then: cookie and refresh token are removed and event is emitted", () => {
    localStorage.setItem("rbac.subject.refresh", "refresh-token");

    clearAuthenticationTokens();

    expect(localStorage.getItem("rbac.subject.refresh")).toBeNull();
    expect(cookiesRemoveMock).toHaveBeenCalledWith("rbac.subject.jwt", {
      path: "/",
    });
    expect(cookiesRemoveMock).toHaveBeenCalledWith("rbac.subject.jwt");
    expect(dispatchEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTHENTICATION_STORAGE_EVENT,
      }),
    );
  });
});
