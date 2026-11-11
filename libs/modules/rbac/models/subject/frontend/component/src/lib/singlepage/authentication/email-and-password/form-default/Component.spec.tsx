/** @jest-environment jsdom */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { QueryClientProvider } from "@tanstack/react-query";
import { Cookies, CookiesProvider } from "react-cookie";

const mockRouter = { push: jest.fn(), refresh: jest.fn(), replace: jest.fn() };
let mockPathname =
  "/en/rbac/subject/authentication/email-and-password/registration";
let mockSearch = "";
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
  useSearchParams: () => new URLSearchParams(mockSearch),
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
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  STALE_TIME: 60_000,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: jest.requireActual("@sps/shared-frontend-client-utils").cn,
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
  mockSearch = "";
  mockPathname =
    "/en/rbac/subject/authentication/email-and-password/registration";
  queryClient.clear();
  jest.clearAllMocks();
  mockAuthenticated = false;
  mockIssuedJwt = "account-token";
  document.cookie = "rbac.subject.jwt=visitor-token; path=/";
});

it("enables the login form only after React can handle its submission", () => {
  const form = (
    <QueryClientProvider client={queryClient}>
      <CookiesProvider cookies={new Cookies({})}>
        <Component
          isServer={false}
          language="en"
          variant="authentication-email-and-password-form-default"
          mode="authentication"
        />
      </CookiesProvider>
    </QueryClientProvider>
  );
  const container = document.createElement("div");
  document.body.appendChild(container);
  container.innerHTML = renderToString(form);
  const email = container.querySelector<HTMLInputElement>(
    'input[type="email"]',
  )!;
  const password = container.querySelector<HTMLInputElement>(
    'input[type="password"]',
  )!;
  const submit = container.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  )!;
  expect([email.disabled, password.disabled, submit.disabled]).toEqual([
    true,
    true,
    true,
  ]);

  render(form, { container, hydrate: true });
  expect([email.disabled, password.disabled, submit.disabled]).toEqual([
    false,
    false,
    false,
  ]);
});

it.each([
  "authentication",
  "registration",
  "forgot-password",
  "reset-password",
] as const)("retains Russian in %s secondary navigation", (mode) => {
  mockPathname = "/ru/rbac/subject/authentication/email-and-password";
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CookiesProvider cookies={new Cookies({})}>
        <Component
          isServer={false}
          language="ru"
          variant="authentication-email-and-password-form-default"
          mode={mode}
        />
      </CookiesProvider>
    </QueryClientProvider>,
  );
  const hrefs = [...view.container.querySelectorAll("a[href]")].map((link) =>
    link.getAttribute("href")!,
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
        language="en"
        isServer={false}
        variant="authentication-email-and-password-form-default"
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
  ["authentication", "account-token", "", "/en/"],
  ["registration", "visitor-token", "", "/en/"],
  [
    "registration",
    "account-token",
    "returnTo=/ai-chat/projects",
    "/en/ai-chat/projects",
  ],
  ["authentication", "account-token", "returnTo=//attacker.example", "/en/"],
  [
    "authentication",
    "account-token",
    "returnTo=https://attacker.example",
    "/en/",
  ],
] as const)(
  "updates mounted account and project readers after %s with %s without a reload",
  async (mode, issuedJwt, search, destination) => {
    mockSearch = search;
    mockPathname =
      "/en/rbac/subject/authentication/email-and-password" +
      (mode === "registration" ? "/registration" : "");
    mockIssuedJwt = issuedJwt;
    render(
      <QueryClientProvider client={queryClient}>
        <CookiesProvider cookies={new Cookies({})}>
          <Client isServer={false} variant="authentication-me-default">
            {({ data, authenticated }) =>
              authenticated && data ? (
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
              authenticated && data ? (
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
            isServer={false}
            language="en"
            variant="authentication-email-and-password-form-default"
            mode={mode}
            successHref="/ai-chat/projects"
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
      expect(mockRouter.push).toHaveBeenCalledWith(destination),
    );
    await screen.findByText("Account menu");
    expect(screen.getByLabelText("Project name")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  },
);
