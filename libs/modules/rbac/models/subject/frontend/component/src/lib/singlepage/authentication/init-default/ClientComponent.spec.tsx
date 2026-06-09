/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac authentication init bootstrap.
 *
 * Given: persisted JWT cookies and refresh tokens are read during the first client render.
 * When: the authentication bootstrap decides whether to init or refresh a session.
 * Then: it waits for persisted state before creating a new anonymous session.
 */

import { render } from "@testing-library/react";
import { Component } from "./ClientComponent";

const authenticationRefreshMock = jest.fn();
const authenticationInitMock = jest.fn();
const clearAuthenticationTokensMock = jest.fn();
const decodeTokenMock = jest.fn();
const initRefetchMock = jest.fn();
const refreshMutateMock = jest.fn();
const useLocalStorageMock = jest.fn();

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  AUTHENTICATION_STORAGE_EVENT: "sps-rbac-auth-storage-change",
  api: {
    authenticationRefresh: (...args: unknown[]) =>
      authenticationRefreshMock(...args),
    authenticationInit: (...args: unknown[]) => authenticationInitMock(...args),
  },
  clearAuthenticationTokens: (...args: unknown[]) =>
    clearAuthenticationTokensMock(...args),
}));

jest.mock("@sps/shared-frontend-client-hooks", () => ({
  useLocalStorage: (...args: unknown[]) => useLocalStorageMock(...args),
}));

jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("react-jwt", () => ({
  decodeToken: (...args: unknown[]) => decodeTokenMock(...args),
}));

describe("Given: authentication init bootstrap", () => {
  beforeEach(() => {
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
    authenticationRefreshMock.mockReset();
    authenticationInitMock.mockReset();
    clearAuthenticationTokensMock.mockReset();
    decodeTokenMock.mockReset();
    initRefetchMock.mockReset();
    refreshMutateMock.mockReset();
    useLocalStorageMock.mockReset();

    authenticationRefreshMock.mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      isSuccess: false,
      mutate: refreshMutateMock,
    });
    authenticationInitMock.mockReturnValue({
      isFetching: false,
      isSuccess: false,
      refetch: initRefetchMock,
    });
  });

  /**
   * BDD Scenario: localStorage hydration guard.
   *
   * Given: refresh token storage has not been read yet.
   * When: the bootstrap renders without a decoded JWT.
   * Then: it does not call init or refresh.
   */
  it("When: refresh token storage is hydrating Then: no auth request is started", () => {
    useLocalStorageMock.mockReturnValue("");

    render(
      <Component variant="authentication-init-default" isServer={false} />,
    );

    expect(initRefetchMock).not.toHaveBeenCalled();
    expect(refreshMutateMock).not.toHaveBeenCalled();
    expect(clearAuthenticationTokensMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: valid JWT cookie preservation.
   *
   * Given: a valid JWT cookie already exists.
   * When: refresh token storage is still hydrating.
   * Then: the bootstrap keeps the current session and does not call init.
   */
  it("When: a valid JWT cookie exists Then: init is not called during storage hydration", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    document.cookie = "rbac.subject.jwt=valid-jwt; path=/";
    useLocalStorageMock.mockReturnValue("");
    decodeTokenMock.mockImplementation((token: string) => {
      if (token === "valid-jwt") {
        return {
          exp: futureExp,
          subject: {
            id: "subject-1",
          },
        };
      }

      return null;
    });

    render(
      <Component variant="authentication-init-default" isServer={false} />,
    );

    expect(initRefetchMock).not.toHaveBeenCalled();
    expect(refreshMutateMock).not.toHaveBeenCalled();
    expect(clearAuthenticationTokensMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: missing JWT recovery.
   *
   * Given: the JWT cookie is missing but a valid refresh token exists.
   * When: the bootstrap evaluates persisted auth state.
   * Then: it refreshes the JWT instead of creating a new session.
   */
  it("When: JWT is missing and refresh token is valid Then: refresh is called instead of init", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    useLocalStorageMock.mockReturnValue("valid-refresh");
    decodeTokenMock.mockImplementation((token: string) => {
      if (token === "valid-refresh") {
        return {
          exp: futureExp,
        };
      }

      return null;
    });

    render(
      <Component variant="authentication-init-default" isServer={false} />,
    );

    expect(refreshMutateMock).toHaveBeenCalledWith({
      data: {
        refresh: "valid-refresh",
      },
    });
    expect(initRefetchMock).not.toHaveBeenCalled();
    expect(clearAuthenticationTokensMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: anonymous session creation.
   *
   * Given: no JWT cookie and no refresh token exist.
   * When: the bootstrap evaluates persisted auth state after hydration.
   * Then: it creates a new anonymous session through init.
   */
  it("When: no persisted auth exists Then: init is called", () => {
    useLocalStorageMock.mockReturnValue(undefined);

    render(
      <Component variant="authentication-init-default" isServer={false} />,
    );

    expect(initRefetchMock).toHaveBeenCalledTimes(1);
    expect(refreshMutateMock).not.toHaveBeenCalled();
    expect(clearAuthenticationTokensMock).not.toHaveBeenCalled();
  });
});
