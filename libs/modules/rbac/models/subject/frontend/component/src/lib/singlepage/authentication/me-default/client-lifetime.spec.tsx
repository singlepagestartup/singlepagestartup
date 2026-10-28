/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import Client from "./client";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    authenticationMe: ({ subjectId }: any) => ({
      data: subjectId ? { id: subjectId, authenticated: true } : undefined,
      isPending: false,
      isFetching: false,
      error: undefined,
    }),
  },
}));
jest.mock("./Skeleton", () => ({
  Skeleton: () => <span>Loading session</span>,
}));
function token(exp: number) {
  return `${btoa("{}")}.${btoa(JSON.stringify({ exp, subject: { id: "subject-a" } }))}.signature`;
}
function View() {
  return (
    <Client
      isServer={false}
      variant="authentication-me-default"
      fallback={<span>Session unavailable</span>}
    >
      {({ data }) => <span>Private session {data?.id}</span>}
    </Client>
  );
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-23T00:00:00Z"));
  document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
});
afterEach(() => {
  jest.useRealTimers();
  document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
});
it("unmounts authenticated children at JWT expiry without a token change or browser event", async () => {
  document.cookie = `rbac.subject.jwt=${token(Math.floor(Date.now() / 1000) + 1)}; path=/`;
  render(<View />);
  expect(screen.getByText("Private session subject-a")).toBeVisible();
  await act(async () => {
    jest.advanceTimersByTime(1001);
  });
  expect(screen.queryByText("Private session subject-a")).toBeNull();
  expect(screen.getByText("Session unavailable")).toBeVisible();
});
it("refresh before the old deadline retains the refreshed session and observes its new expiry", async () => {
  const now = Math.floor(Date.now() / 1000);
  document.cookie = `rbac.subject.jwt=${token(now + 1)}; path=/`;
  render(<View />);
  await act(async () => {
    jest.advanceTimersByTime(500);
    document.cookie = `rbac.subject.jwt=${token(now + 10)}; path=/`;
    window.dispatchEvent(new Event("sps-rbac-auth-storage-change"));
  });
  await act(async () => {
    jest.advanceTimersByTime(1001);
  });
  expect(screen.getByText("Private session subject-a")).toBeVisible();
  await act(async () => {
    jest.advanceTimersByTime(9000);
  });
  expect(screen.queryByText("Private session subject-a")).toBeNull();
  expect(screen.getByText("Session unavailable")).toBeVisible();
});

it("closes children when the browser expires the JWT cookie at its deadline without dispatching an event", async () => {
  document.cookie = `rbac.subject.jwt=${token(Math.floor(Date.now() / 1000) + 1)}; path=/`;
  render(<View />);
  expect(screen.getByText("Private session subject-a")).toBeVisible();
  await act(async () => {
    document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
    jest.advanceTimersByTime(1001);
  });
  expect(screen.queryByText("Private session subject-a")).toBeNull();
  expect(screen.getByText("Session unavailable")).toBeVisible();
});
