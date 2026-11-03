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

const mockQueryClient = { invalidateQueries: jest.fn() };
const mockRouter = { replace: jest.fn() };
let mockAuthenticated = true;
let mockSessionPending = false;
let mockSessionFetching = false;
let mockSessionError: Error | undefined;
jest.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    authenticationMe: (props: any) => ({
      data: props.subjectId
        ? {
            id: props.subjectId,
            variant: "default",
            authenticated: mockAuthenticated,
          }
        : undefined,
      isPending: mockSessionPending,
      isFetching: mockSessionFetching,
      error: mockSessionError,
    }),
  },
}));

import Client from "./client";

describe("Given: authentication me-default client", () => {
  beforeEach(() => {
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
    useJwtMock.mockReset();
    mockAuthenticated = true;
    mockSessionPending = false;
    mockSessionFetching = false;
    mockSessionError = undefined;
    mockRouter.replace.mockClear();
    mockQueryClient.invalidateQueries.mockClear();
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

  /**
   * BDD Scenario: authentication event subscription race.
   *
   * Given: the anonymous JWT is persisted while the consumer effect subscribes.
   * When: the storage event can occur before the listener is attached.
   * Then: the post-subscription cookie synchronization still renders the subject.
   */
  it("When: JWT is persisted during subscription Then: the subject still appears", async () => {
    useJwtMock.mockImplementation((token: string) => {
      if (token === "valid-token") {
        return {
          decodedToken: {
            subject: {
              id: "subject-3",
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

    const addEventListener = window.addEventListener.bind(window);
    let tokenPersisted = false;

    jest
      .spyOn(window, "addEventListener")
      .mockImplementation((type, listener, options) => {
        if (type === "sps-rbac-auth-storage-change" && !tokenPersisted) {
          tokenPersisted = true;
          document.cookie = "rbac.subject.jwt=valid-token; path=/";
        }

        addEventListener(type, listener, options);
      });

    render(
      <Client variant="authentication-me-default" isServer={false}>
        {({ data }: any) => <div data-testid="subject-id">{data.id}</div>}
      </Client>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("subject-id")?.textContent).toBe("subject-3");
    });
  });
  it("refreshes account status when registration replaces the token for the same Subject", async () => {
    document.cookie = "rbac.subject.jwt=visitor-token; path=/";
    mockAuthenticated = false;
    useJwtMock.mockReturnValue({
      decodedToken: { subject: { id: "visitor", variant: "default" } },
      isExpired: false,
    });
    render(
      <Client variant="authentication-me-default" isServer={false}>
        {({ authenticated }) => (
          <span>{authenticated ? "Account" : "Sign in"}</span>
        )}
      </Client>,
    );
    expect(screen.getByText("Sign in")).toBeTruthy();
    act(() => {
      mockAuthenticated = true;
      document.cookie = "rbac.subject.jwt=account-token; path=/";
      window.dispatchEvent(new Event("sps-rbac-auth-storage-change"));
    });
    await waitFor(() => expect(screen.getByText("Account")).toBeTruthy());
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["/api/rbac/subjects/authentication/me"],
    });
  });

  it("keeps a valid default visitor Subject separate from an authenticated account", () => {
    document.cookie = "rbac.subject.jwt=visitor-token; path=/";
    mockAuthenticated = false;
    useJwtMock.mockReturnValue({
      decodedToken: { subject: { id: "visitor", variant: "default" } },
      isExpired: false,
    });
    const child = jest.fn(({ authenticated }) => (
      <span>{authenticated ? "Account" : "Sign in"}</span>
    ));
    render(
      <Client variant="authentication-me-default" isServer={false}>
        {child}
      </Client>,
    );
    expect(screen.getByText("Sign in")).toBeTruthy();
    expect(child).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id: "visitor" }),
        authenticated: false,
      }),
    );
  });

  describe("protected entry points", () => {
    beforeEach(() => {
      document.cookie = "rbac.subject.jwt=valid-token; path=/";
      useJwtMock.mockReturnValue({
        decodedToken: { subject: { id: "subject-1", variant: "default" } },
        isExpired: false,
      });
    });

    function protectedView() {
      return (
        <Client
          variant="authentication-me-default"
          isServer={false}
          unauthenticatedRedirectHref="/ru/ai-chat/sign-in"
          fallback={<span>Sign in to your workspace.</span>}
        >
          {() => <span>Private workspace</span>}
        </Client>
      );
    }

    it("redirects a verified visitor to the supplied localized sign-in page", () => {
      mockAuthenticated = false;
      render(protectedView());
      expect(mockRouter.replace).toHaveBeenCalledWith("/ru/ai-chat/sign-in");
      expect(screen.queryByText("Private workspace")).toBeNull();
      expect(screen.queryByText("Sign in to your workspace.")).toBeNull();
    });

    it.each(["pending", "refetching", "error"])(
      "does not redirect while the session is %s",
      (status) => {
        mockAuthenticated = false;
        mockSessionPending = status === "pending";
        mockSessionFetching = status === "refetching";
        mockSessionError =
          status === "error" ? new Error("Unavailable") : undefined;
        render(protectedView());
        expect(mockRouter.replace).not.toHaveBeenCalled();
        expect(screen.queryByText("Private workspace")).toBeNull();
      },
    );

    it("renders the workspace for an authenticated account", () => {
      render(protectedView());
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(screen.getByText("Private workspace")).toBeTruthy();
    });

    it("waits for token restoration before deciding whether to redirect", () => {
      useJwtMock.mockReturnValue({ decodedToken: null, isExpired: false });
      const view = render(protectedView());
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(screen.getByTestId("auth-skeleton")).toBeTruthy();
      expect(screen.queryByText("Sign in to your workspace.")).toBeNull();
      useJwtMock.mockReturnValue({
        decodedToken: { subject: { id: "subject-1", variant: "default" } },
        isExpired: false,
      });
      view.rerender(protectedView());
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(screen.getByText("Private workspace")).toBeTruthy();
    });
  });
});
