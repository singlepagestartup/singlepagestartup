/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
const mockCreate = jest.fn();
const mockPush = jest.fn();
const subject = { id: "owner", slug: "owner" };
jest.mock("react-cookie", () => ({
  useCookies: () => [{ "rbac.subject.jwt": "jwt" }, null, null, jest.fn()],
}));
jest.mock("react-jwt", () => ({
  useJwt: () => ({ decodedToken: { subject } }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/ru/ai-chat/projects",
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: {
    findById: () => ({ isLoading: false }),
    socialModuleChatFindByIdThreadCreate: () => ({
      mutateAsync: mockCreate,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
import { Component } from "./index";
const project = {
  profile: { id: "profile" },
  chat: { id: "chat" },
  thread: { id: "initial" },
};
const props = {
  isServer: false,
  variant: "me-social-module-profile-id-chat-id-thread-create-ai-chat",
  data: subject,
  project,
} as any;
beforeEach(() => {
  mockCreate.mockReset();
  mockPush.mockReset();
});
it("rejects blank names and guards a double submit before the mutation hook rerenders", async () => {
  let resolve: (value: unknown) => void = () => undefined;
  mockCreate.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  render(<Component {...props} />);
  const input = screen.getByLabelText("Thread name");
  const form = input.closest("form")!;
  fireEvent.change(input, { target: { value: "   " } });
  fireEvent.submit(form);
  expect(mockCreate).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: " A new topic " } });
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(mockCreate).toHaveBeenCalledWith({
    id: "owner",
    socialModuleChatId: "chat",
    data: { title: "A new topic", variant: "ai-chat" },
  });
  await act(async () => resolve({ id: "created-thread" }));
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith(
      "/ru/ai-chat/social/profiles/profile/chats/chat/threads/created-thread",
    ),
  );
});
it("retains the failed draft, permits retry and resets it when the project changes", async () => {
  mockCreate.mockRejectedValue(new Error("Create failed"));
  const { rerender } = render(<Component {...props} />);
  fireEvent.change(screen.getByLabelText("Thread name"), {
    target: { value: "Draft" },
  });
  fireEvent.submit(screen.getByLabelText("Thread name").closest("form")!);
  await screen.findByRole("alert");
  expect(screen.getByRole("alert").textContent).toBe("Create failed");
  expect((screen.getByLabelText("Thread name") as HTMLInputElement).value).toBe(
    "Draft",
  );
  mockCreate.mockResolvedValue({ id: "retry-thread" });
  fireEvent.submit(screen.getByLabelText("Thread name").closest("form")!);
  await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  rerender(
    <Component
      {...props}
      project={{
        ...project,
        profile: { id: "other" },
        chat: { id: "other-chat" },
      }}
    />,
  );
  expect((screen.getByLabelText("Thread name") as HTMLInputElement).value).toBe(
    "",
  );
  expect(screen.queryByRole("alert")).toBeNull();
});
