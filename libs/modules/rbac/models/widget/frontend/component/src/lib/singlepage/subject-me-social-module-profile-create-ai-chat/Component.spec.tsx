/** @jest-environment jsdom */
/**
 * BDD Suite: project selection preserves the original creation card.
 * Given: an authenticated Subject, connected projects and the Host content Widget.
 * When: the Subject opens project creation and returns to the chooser.
 * Then: creation has its original photograph, copy and form; the chooser retains its project links.
 */
import { fireEvent, render, screen } from "@testing-library/react";
let mockSearch = "";
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/ru/ai-chat/projects",
  useSearchParams: () => new URLSearchParams(mockSearch),
  useRouter: () => ({ push: mockPush }),
}));
beforeEach(() => {
  mockSearch = "";
  jest.clearAllMocks();
});
const contentRead = jest.fn();
const mockSavedCopy = {
  title: { ru: "Начните с названия.", en: "Start with a name." },
  subtitle: { ru: "Назовите проект", en: "Name your project" },
  description: {
    ru: "Ваши файлы. Ваш проект.",
    en: "Your files. Your project.",
  },
};
const relationRead = jest.fn();
const link = {
  id: "project-link",
  widgetId: "rbac-widget",
  websiteBuilderModuleWidgetId: "creation-content-widget",
  variant: "default",
};
const project = {
  profile: { id: "profile", title: { en: "Existing project" } },
  chat: { id: "chat" },
  thread: { id: "thread" },
};
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/rbac/models/widget/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    findById: (props: any) => ({ data: { id: props.id }, isLoading: false }),
  },
}));
jest.mock("@sps/rbac/models/widget/sdk/server", () => ({ api: {} }));
jest.mock("@sps/website-builder/models/widget/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    find: (props: any) => {
      contentRead(props);
      return {
        data: [
          {
            id: "creation-content-widget",
            variant: "content-ai-chat-profile-create",
            ...mockSavedCopy,
          },
        ],
        isLoading: false,
      };
    },
    findById: (props: any) => {
      contentRead(props);
      return {
        data: {
          id: props.id,
          variant: "content-ai-chat-profile-create",
          ...mockSavedCopy,
        },
        isLoading: false,
      };
    },
  },
}));
jest.mock("@sps/website-builder/models/widget/sdk/server", () => ({ api: {} }));
jest.mock(
  "@sps/rbac/relations/widgets-to-website-builder-module-widgets/sdk/client",
  () => ({
    Provider: ({ children }: any) => <>{children}</>,
    api: {
      find: (props: any) => {
        relationRead(props);
        return { data: [link], isLoading: false };
      },
      findById: () => ({ data: link, isLoading: false }),
    },
  }),
);
jest.mock(
  "@sps/rbac/relations/widgets-to-website-builder-module-widgets/sdk/server",
  () => ({ api: {} }),
);
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  projectHref: () =>
    "/ai-chat/social/profiles/profile/chats/chat/threads/thread",
  Component: (props: any) => {
    if (props.variant === "authentication-me-default")
      return props.children({ data: { id: "subject" }, authenticated: true });
    if (props.variant === "me-social-module-profile-list-ai-chat")
      return props.renderProjects({ projects: [project] });
    return (
      <form aria-label="Create project">
        <label>
          Project name
          <input />
        </label>
      </form>
    );
  },
}));
jest.mock(
  "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component",
  () => ({
    Component: (props: any) =>
      props.variant === "find" ? (
        props.children({
          data: [
            {
              id: "photo-link",
              widgetId: props.apiProps.params.filters.and[0].value,
            },
          ],
        })
      ) : (
        <img
          src="/images/ai-chat/singlepagestartup-photography-project-start-v1-square.png"
          alt={
            props.language === "ru"
              ? "Человек за работой над проектом"
              : "A person working on their project at a desk"
          }
        />
      ),
  }),
);
import { Component as Widget } from "@sps/rbac/models/widget/frontend/component";
jest.mock("@sps/rbac/models/widget/frontend/component", () => ({
  Component: (props: any) => jest.requireActual("./index").Component(props),
}));
it("opens the original photo card without replacing the project chooser", () => {
  const props = {
    isServer: false,
    variant: "subject-me-social-module-profile-create-ai-chat",
    language: "ru",
    data: { id: "rbac-widget" },
  } as any;
  const view = render(<Widget {...props} />);
  expect(screen.getByRole("heading", { name: "Мои проекты" })).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Открыть Existing project" })
      .getAttribute("href"),
  ).toBe("/ru/ai-chat/social/profiles/profile/chats/chat/threads/thread");
  expect(screen.queryByRole("form")).toBeNull();
  expect(contentRead).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Создать проект" }));
  expect(mockPush).toHaveBeenCalledWith("/ru/ai-chat/projects?create=1", {
    scroll: false,
  });
  mockSearch = "create=1";
  view.rerender(<Widget {...props} />);
  expect(
    screen.getByRole("heading", { name: "Начните с названия." }),
  ).toBeTruthy();
  expect(
    screen
      .getByRole("img", { name: "Человек за работой над проектом" })
      .getAttribute("src"),
  ).toBe(
    "/images/ai-chat/singlepagestartup-photography-project-start-v1-square.png",
  );
  expect(screen.getByText("Ваши файлы. Ваш проект.")).toBeTruthy();
  expect(screen.getByRole("form", { name: "Create project" })).toBeTruthy();
  expect(
    screen.queryByRole("heading", { name: "Create a project" }),
  ).toBeNull();
  expect(relationRead).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({
        filters: {
          and: [{ column: "widgetId", method: "eq", value: "rbac-widget" }],
        },
      }),
    }),
  );
  expect(contentRead).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        filters: {
          and: [
            { column: "id", method: "eq", value: "creation-content-widget" },
          ],
        },
      },
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "К проектам" }));
  expect(mockPush).toHaveBeenLastCalledWith("/ru/ai-chat/projects", {
    scroll: false,
  });
  mockSearch = "";
  view.rerender(<Widget {...props} />);
  expect(screen.getByRole("heading", { name: "Мои проекты" })).toBeTruthy();
  expect(screen.queryByRole("form")).toBeNull();
});

it("opens creation from the URL and follows back/forward query changes", () => {
  mockSearch = "create=1&source=header";
  const props = {
    isServer: false,
    variant: "subject-me-social-module-profile-create-ai-chat",
    language: "ru",
    data: { id: "rbac-widget" },
  } as any;
  const view = render(<Widget {...props} />);
  expect(screen.getByRole("form", { name: "Create project" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "К проектам" }));
  expect(mockPush).toHaveBeenLastCalledWith(
    "/ru/ai-chat/projects?source=header",
    { scroll: false },
  );
  mockSearch = "source=header";
  view.rerender(<Widget {...props} />);
  expect(screen.getByRole("heading", { name: "Мои проекты" })).toBeTruthy();
  mockSearch = "create=1&source=header";
  view.rerender(<Widget {...props} />);
  expect(screen.getByRole("form", { name: "Create project" })).toBeTruthy();
});
