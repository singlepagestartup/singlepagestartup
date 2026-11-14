/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: identity password change request credentials.
 *
 * Given: a signed-in browser whose session JWT sits in the rbac.subject.jwt
 *        cookie, and a stubbed fetch.
 * When: the identity client SDK submits a password change.
 * Then: the request carries the session as a bearer Authorization header, so
 *       it authenticates without any cookie the API would have to read.
 */

import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/identity/sdk/client";

const IDENTITY_ID = "identity-id";
const fetchMock = jest.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper(props: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    );
  };
}

function requestHeaders() {
  return new Headers(fetchMock.mock.calls[0][1].headers);
}

describe("Given: a signed-in browser changes an identity password", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: IDENTITY_ID } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    document.cookie = "rbac.subject.jwt=session-jwt; path=/";
  });

  afterEach(() => {
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
  });

  /**
   * BDD Scenario: the session travels in the header.
   *
   * Given: the session cookie holds a JWT.
   * When: the password change is submitted.
   * Then: the PATCH request carries Authorization: Bearer <jwt>.
   */
  it("sends the session JWT as a bearer header", async () => {
    const { result } = renderHook(
      () => api.changePassword({ id: IDENTITY_ID }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({
        id: IDENTITY_ID,
        data: { password: "current-password", newPassword: "next-password" },
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/${IDENTITY_ID}/change-password`,
    );
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
    expect(requestHeaders().get("Authorization")).toBe("Bearer session-jwt");
  });

  /**
   * BDD Scenario: caller headers are kept.
   *
   * Given: the caller passes its own request header.
   * When: the password change is submitted.
   * Then: the request carries both the caller header and the session header.
   */
  it("keeps caller headers next to the session header", async () => {
    const { result } = renderHook(
      () =>
        api.changePassword({
          id: IDENTITY_ID,
          options: { headers: { "X-Request-Id": "request-1" }, next: {} },
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({
        id: IDENTITY_ID,
        data: { password: "current-password", newPassword: "next-password" },
      });
    });

    expect(requestHeaders().get("X-Request-Id")).toBe("request-1");
    expect(requestHeaders().get("Authorization")).toBe("Bearer session-jwt");
  });
});
