/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac authentication me-default behavior.
 *
 * Given: JWT and cookie dependencies are controlled via deterministic doubles.
 * When: token is missing/expired or contains a valid subject.
 * Then: skeleton fallback is rendered for unauthorized state and subject is passed to children/set callback for authorized state.
 */

import { render, screen, waitFor } from "@testing-library/react";

const useCookiesMock = jest.fn();
const useJwtMock = jest.fn();

jest.mock("react-cookie", () => ({
  useCookies: (...args: unknown[]) => useCookiesMock(...args),
}));

jest.mock("react-jwt", () => ({
  useJwt: (...args: unknown[]) => useJwtMock(...args),
}));

jest.mock("./Skeleton", () => ({
  Skeleton: () => <div data-testid="auth-skeleton">loading</div>,
}));

import Client from "./client";

describe("Given: authentication me-default client", () => {
  beforeEach(() => {
    useCookiesMock.mockReset();
    useJwtMock.mockReset();
  });

  it("When: token is expired Then: skeleton fallback is rendered", () => {
    useCookiesMock.mockReturnValue([
      {
        "rbac.subject.jwt": "expired-token",
      },
    ]);

    useJwtMock.mockReturnValue({
      decodedToken: {
        subject: {
          id: "subject-1",
        },
      },
      isExpired: true,
    });

    render(
      (<Client variant="authentication-me-default" isServer={false} />) as any,
    );

    expect(screen.queryByTestId("auth-skeleton")).not.toBeNull();
  });

  it("When: token is valid Then: subject is sent to children and set callback", async () => {
    const setMock = jest.fn();

    useCookiesMock.mockReturnValue([
      {
        "rbac.subject.jwt": "valid-token",
      },
    ]);

    useJwtMock.mockReturnValue({
      decodedToken: {
        subject: {
          id: "subject-1",
          variant: "default",
        },
      },
      isExpired: false,
    });

    render(
      <Client
        variant="authentication-me-default"
        isServer={false}
        set={setMock}
      >
        {({ data }: any) => <div data-testid="subject-id">{data.id}</div>}
      </Client>,
    );

    expect(screen.queryByTestId("subject-id")?.textContent).toBe("subject-1");

    await waitFor(() => {
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "subject-1",
        }),
      );
    });
  });
});
