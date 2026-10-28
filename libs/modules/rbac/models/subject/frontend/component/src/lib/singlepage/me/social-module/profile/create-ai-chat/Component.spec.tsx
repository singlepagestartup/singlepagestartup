/** @jest-environment jsdom */
/**
 * BDD Suite: AI Chat creation navigation.
 * Given: a signed-in account viewing project and thread forms in Russian.
 * When: creation succeeds or opening a created project needs a retry.
 * Then: navigation retains Russian and retries reuse the saved Profile.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const push = jest.fn();
const createProfile = jest.fn();
const createThread = jest.fn();
const projectsRead = jest.fn();
const project = {
  profile: { id: "profile" },
  chat: { id: "chat" },
  thread: { id: "thread" },
};
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/ru/ai-chat/projects",
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a {...props} href={href}>
      {children}
    </a>
  ),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  queryClient: new (jest.requireActual("@tanstack/react-query").QueryClient)(),
  api: {
    socialModuleProfileCreate: () => ({ mutateAsync: createProfile }),
    socialModuleChatFindByIdThreadCreate: () => ({ mutateAsync: createThread }),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    socialModuleProfileProjects: (...args: any[]) => projectsRead(...args),
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) =>
    props.variant === "me-social-module-profile-create-ai-chat"
      ? jest.requireActual("./Component").Component(props)
      : jest
          .requireActual("../id/chat/id/thread/create-ai-chat/Component")
          .Component(props),
}));
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
beforeEach(() => {
  jest.clearAllMocks();
  createProfile.mockResolvedValue(project.profile);
  createThread.mockResolvedValue({ id: "new-thread" });
  projectsRead.mockResolvedValue([project]);
});

it("opens a newly created project and its back link in the current locale", async () => {
  render(
    <Subject
      {...({
        isServer: false,
        variant: "me-social-module-profile-create-ai-chat",
        data: { id: "subject" },
      } as any)}
    />,
  );
  expect(
    screen.getByRole("link", { name: "К проектам" }).getAttribute("href"),
  ).toBe("/ru/ai-chat/projects");
  fireEvent.change(screen.getByLabelText("Название проекта"), {
    target: { value: "New project" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Создать проект" }));
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith(
      "/ru/ai-chat/social/profiles/profile/chats/chat/threads/thread",
    ),
  );
});

it("retries opening a saved project without creating another Profile", async () => {
  projectsRead.mockRejectedValueOnce(
    new Error("Workspace temporarily unavailable"),
  );
  render(
    <Subject
      {...({
        isServer: false,
        variant: "me-social-module-profile-create-ai-chat",
        data: { id: "subject" },
      } as any)}
    />,
  );
  fireEvent.change(screen.getByLabelText("Название проекта"), {
    target: { value: "New project" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Создать проект" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Открыть проект" }));
  await waitFor(() => expect(push).toHaveBeenCalled());
  expect(createProfile).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledWith(
    "/ru/ai-chat/social/profiles/profile/chats/chat/threads/thread",
  );
});

it("opens a new thread and its cancel destination in the current locale", async () => {
  render(
    <Subject
      {...({
        isServer: false,
        variant: "me-social-module-profile-id-chat-id-thread-create-ai-chat",
        data: { id: "subject" },
        project,
      } as any)}
    />,
  );
  expect(
    screen.getByRole("link", { name: "Отмена" }).getAttribute("href"),
  ).toBe("/ru/ai-chat/social/profiles/profile/chats/chat/threads/thread");
  fireEvent.change(screen.getByLabelText("Название обсуждения"), {
    target: { value: "New topic" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Создать обсуждение" }));
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith(
      "/ru/ai-chat/social/profiles/profile/chats/chat/threads/new-thread",
    ),
  );
});
