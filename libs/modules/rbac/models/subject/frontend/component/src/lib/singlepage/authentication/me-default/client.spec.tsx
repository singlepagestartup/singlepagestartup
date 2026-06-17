/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac authentication me-default behavior.
 *
 * Given: JWT decoding is controlled and the browser cookie can change after render.
 * When: token is missing/expired or contains a valid subject.
 * Then: skeleton fallback is rendered for unauthorized state, valid subjects render, and auth storage events refresh the visible subject.
 */

import { act, render, screen, waitFor } from "@testing-library/react";

const useJwtMock = jest.fn();

jest.mock("react-jwt", () => ({
  useJwt: (...args: unknown[]) => useJwtMock(...args),
}));

jest.mock("./Skeleton", () => ({
  Skeleton: () => <div data-testid="auth-skeleton">loading</div>,
}));

import Client from "./client";

describe("Given: authentication me-default client", () => {
  beforeEach(() => {
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
    useJwtMock.mockReset();
  });

  it("When: token is expired Then: skeleton fallback is rendered", () => {
    document.cookie = "rbac.subject.jwt=expired-token; path=/";

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

    document.cookie = "rbac.subject.jwt=valid-token; path=/";

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

  it("When: auth storage changes after render Then: cookie is re-read and subject appears", async () => {
    useJwtMock.mockImplementation((token: string) => {
      if (token === "valid-token") {
        return {
          decodedToken: {
            subject: {
              id: "subject-2",
              variant: "default",
            },
          },
          isExpired: false,
        };
      }

      return {
        decodedToken: null,
        isExpired: false,
      };
    });

    render(
      <Client variant="authentication-me-default" isServer={false}>
        {({ data }: any) => <div data-testid="subject-id">{data.id}</div>}
      </Client>,
    );

    expect(screen.queryByTestId("auth-skeleton")).not.toBeNull();

    act(() => {
      document.cookie = "rbac.subject.jwt=valid-token; path=/";
      window.dispatchEvent(new Event("sps-rbac-auth-storage-change"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("subject-id")?.textContent).toBe("subject-2");
    });
  });
});
