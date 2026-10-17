/** @jest-environment jsdom */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Cookies, CookiesProvider } from "react-cookie";

const mockRouter = { push: jest.fn(), refresh: jest.fn(), replace: jest.fn() };
let mockPathname = "/en/ai-chat/create-account";
let mockAuthenticated = false;
let mockIssuedJwt = "account-token";
const mockMe = jest.fn(async (..._args: unknown[]) => ({
  id: "visitor",
  variant: "default",
  authenticated: mockAuthenticated,
}));
const mockAuthenticate = jest.fn(async (..._args: unknown[]) => {
  mockAuthenticated = true;
  return { jwt: mockIssuedJwt, refresh: "account-refresh" };
});

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock("react-jwt", () => ({
  useJwt: (token?: string) => ({
    decodedToken: token
      ? { subject: { id: "visitor", variant: "default" } }
      : null,
    isExpired: false,
  }),
}));
jest.mock("@sps/shared-utils", () => ({ STALE_TIME: 60_000 }));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  getLocalizedHref: jest.requireActual("@sps/shared-frontend-client-utils")
    .getLocalizedHref,
  saturateHeaders: () => ({}),
  authorization: { parseJwt: () => ({ exp: 1_900_000_000 }) },
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction: jest.fn() }) },
}));
jest.mock("@sps/shared-frontend-client-api", () => {
  const { QueryClient } = jest.requireActual("@tanstack/react-query");
  return {
    subscription: () => () => {},
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    }),
  };
});
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "https://api.example.com",
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    authenticationMe: (...args: any[]) => mockMe(...args),
    authenticationEmailAndPasswordRegistration: (...args: any[]) =>
      mockAuthenticate(...args),
    authenticationEmailAndPasswordAuthentication: (...args: any[]) =>
      mockAuthenticate(...args),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: {
    authenticationMe: jest.requireActual(
      "../../../../../../../../sdk/client/src/lib/singlepage/authentication/me",
    ).action,
    authenticationEmailAndPasswordRegistration: jest.requireActual(
      "../../../../../../../../sdk/client/src/lib/singlepage/authentication/email-and-password/registration",
    ).action,
    authenticationEmailAndPasswordAuthentication: jest.requireActual(
      "../../../../../../../../sdk/client/src/lib/singlepage/authentication/email-and-password/authentication",
    ).action,
    authenticationEmailAndPasswordForgotPassword: () => ({}),
    authenticationEmailAndPasswordResetPassword: () => ({}),
  },
}));
jest.mock("../../me-default/Skeleton", () => ({
  Skeleton: () => <span>Loading session</span>,
}));

import { queryClient } from "@sps/shared-frontend-client-api";
import Client from "../../me-default/client";
import { Component as SubjectClient } from "@sps/shared-frontend-components/singlepage/subject-default/client";
import { Component } from "./Component";
import { Component as PublicForm } from "./index";

const mockRecordApi = {
  findById: () => ({ data: undefined, isLoading: false, refetch: jest.fn() }),
};

beforeAll(() => {
  Object.defineProperty(window, "cookieStore", {
    configurable: true,
    value: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
  });
});

afterAll(() => {
  Reflect.deleteProperty(window, "cookieStore");
});

beforeEach(() => {
  mockPathname = "/en/ai-chat/create-account";
  queryClient.clear();
  jest.clearAllMocks();
  mockAuthenticated = false;
  mockIssuedJwt = "account-token";
  document.cookie = "rbac.subject.jwt=visitor-token; path=/";
});

it.each([
  "authentication",
  "registration",
  "forgot-password",
  "reset-password",
] as const)("retains Russian in %s secondary navigation", (mode) => {
  mockPathname = "/ru/ai-chat/sign-in";
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CookiesProvider cookies={new Cookies({})}>
        <Component
          variant="authentication-email-and-password-form-ai-chat"
          mode={mode}
        />
      </CookiesProvider>
    </QueryClientProvider>,
  );
  const hrefs = [...view.container.querySelectorAll("a[href]")].map(
    (link) => link.getAttribute("href")!,
  );
  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs.every((href) => href.startsWith("/ru/"))).toBe(true);
});

afterEach(() => {
  queryClient.clear();
  localStorage.clear();
});

it("renders the registered form entrypoint in its explicitly selected mode", () => {
  render(
    <QueryClientProvider client={queryClient}>
      <PublicForm
        isServer={false}
        variant="authentication-email-and-password-form-ai-chat"
        mode="forgot-password"
      />
    </QueryClientProvider>,
  );
  expect(
    screen.getByRole("heading", { name: "Reset your password" }),
  ).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Email" })).toBeTruthy();
  expect(screen.queryByLabelText("Password")).toBeNull();
});

it.each([
  ["registration", "visitor-token"],
  ["registration", "account-token"],
  ["authentication", "account-token"],
] as const)(
  "updates mounted account and project readers after %s with %s without a reload",
  async (mode, issuedJwt) => {
    mockIssuedJwt = issuedJwt;
    render(
      <QueryClientProvider client={queryClient}>
        <CookiesProvider cookies={new Cookies({})}>
          <Client isServer={false} variant="authentication-me-default">
            {({ data, authenticated }) =>
              authenticated ? (
                <SubjectClient
                  isServer={false}
                  variant="default"
                  data={data}
                  api={mockRecordApi as any}
                  Component={() => <span>Account menu</span>}
                />
              ) : (
                <span>Guest menu</span>
              )
            }
          </Client>
          <Client isServer={false} variant="authentication-me-default">
            {({ data, authenticated }) =>
              authenticated ? (
                <SubjectClient
                  isServer={false}
                  variant="default"
                  data={data}
                  api={mockRecordApi as any}
                  Component={() => <input aria-label="Project name" />}
                />
              ) : null
            }
          </Client>
          <Component
            variant="authentication-email-and-password-form-ai-chat"
            mode={mode}
          />
        </CookiesProvider>
      </QueryClientProvider>,
    );
    await screen.findByText("Guest menu");
    expect(screen.queryByLabelText("Project name")).toBeNull();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/), {
      target: { value: "test-password" },
    });
    if (mode === "registration") {
      fireEvent.change(screen.getByLabelText("Confirm password"), {
        target: { value: "test-password" },
      });
      fireEvent.click(screen.getByRole("checkbox"));
    }
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: mode === "registration" ? "Create an account" : "Sign in",
        }),
      );
    });

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith("/en/ai-chat/projects"),
    );
    await screen.findByText("Account menu");
    expect(screen.getByLabelText("Project name")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  },
);
