import { renderToStaticMarkup } from "react-dom/server";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/ru/ai-chat/projects",
  useSearchParams: () => new URLSearchParams(),
}));

let mockAuthenticated = true;
let mockAuthState = "ready";
let mockProjectsState = "ready";
const mockProjectReads = jest.fn();
const mockAuthenticationProps = jest.fn();
const mockProject = {
  profile: { id: "owned-profile", title: { en: "Owned project" } },
  chat: { id: "owned-chat" },
  thread: { id: "owned-thread" },
};
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "authentication-me-default") {
      mockAuthenticationProps(props);
      if (mockAuthState === "pending") return props.skeleton;
      if (mockAuthState === "error") return props.fallback;
      return props.children({
        data: { id: "owner" },
        authenticated: mockAuthenticated,
      });
    }
    if (props.variant === "me-social-module-profile-list-ai-chat") {
      mockProjectReads();
      if (mockProjectsState === "pending") return props.loading;
      if (mockProjectsState === "error")
        return props.renderError({ retry: jest.fn() });
      return props.renderProjects({ projects: [mockProject] });
    }
    return <div data-subject-variant={props.variant}>Workspace content</div>;
  },
}));
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: (props: any) => <section>{props.children}</section>,
}));
jest.mock("@sps/social/models/chat/frontend/component", () => ({
  Component: (props: any) => <section>{props.children}</section>,
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  ...jest.requireActual("@sps/rbac/models/subject/sdk/model"),
  clientHost: "",
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({}),
}));

import { Component as Thread } from "./ClientComponent";
import { Component as ThreadCreate } from "../subject-me-social-module-profile-id-chat-id-thread-create-ai-chat/ClientComponent";
import { Component as ProjectSettings } from "../subject-me-social-module-profile-id-settings-ai-chat/ClientComponent";
import { Component as ProjectCreate } from "../subject-me-social-module-profile-create-ai-chat/ClientComponent";

const entryPoints = [Thread, ThreadCreate, ProjectSettings, ProjectCreate];
const props = {
  isServer: false,
  data: { id: "widget" },
  language: "ru",
  profileId: "owned-profile",
  chatId: "owned-chat",
};

beforeEach(() => {
  mockAuthenticated = true;
  mockAuthState = "ready";
  mockProjectsState = "ready";
  mockProjectReads.mockClear();
  mockAuthenticationProps.mockClear();
});

it.each(entryPoints)(
  "opens an owner's workspace through the auth guard",
  (View) => {
    const html = renderToStaticMarkup(<View {...(props as any)} />);
    expect(mockProjectReads).toHaveBeenCalledTimes(1);
    expect(html).toContain(
      View === ProjectCreate ? "My projects" : "Workspace content",
    );
    expect(html).not.toContain("Sign in to your workspace");
    expect(mockAuthenticationProps.mock.calls[0][0]).toMatchObject({
      unauthenticatedRedirectHref: "/ru/ai-chat/sign-in",
    });
  },
);

it.each(entryPoints)(
  "does not request private projects for a guest",
  (View) => {
    mockAuthenticated = false;
    const html = renderToStaticMarkup(<View {...(props as any)} />);
    expect(mockProjectReads).not.toHaveBeenCalled();
    expect(html).not.toContain("Workspace content");
  },
);

it.each([Thread, ThreadCreate, ProjectSettings])(
  "keeps the access-denied result for an authenticated foreign-project visitor",
  (View) => {
    const html = renderToStaticMarkup(
      <View {...({ ...props, profileId: "foreign-profile" } as any)} />,
    );
    expect(html).toContain("This project is unavailable in your workspace.");
    expect(html).not.toContain("Workspace content");
    expect(html).not.toContain("Sign in to your workspace");
  },
);

it("shows a session skeleton before reading private projects", () => {
  mockAuthState = "pending";
  const html = renderToStaticMarkup(<Thread {...(props as any)} />);
  expect(html).toContain('data-workspace-state="checking-session"');
  expect(html).toContain('aria-busy="true"');
  expect(mockProjectReads).not.toHaveBeenCalled();
  expect(html).not.toContain("Workspace content");
});
it("shows a project skeleton while the owned project list loads", () => {
  mockProjectsState = "pending";
  const html = renderToStaticMarkup(<Thread {...(props as any)} />);
  expect(html).toContain('data-workspace-state="loading-projects"');
  expect(html).not.toContain("Workspace content");
});
it.each(["session", "projects"])(
  "shows a recoverable %s error without private content",
  (stage) => {
    if (stage === "session") mockAuthState = "error";
    else mockProjectsState = "error";
    const html = renderToStaticMarkup(<Thread {...(props as any)} />);
    expect(html).toContain('data-workspace-state="error"');
    expect(html).toContain("Try again");
    expect(html).not.toContain("Workspace content");
  },
);

it("shows owned project links in the chooser without rendering a creation form", () => {
  const html = renderToStaticMarkup(<ProjectCreate {...(props as any)} />);
  expect(html).toContain("My projects");
  expect(html).toContain(
    'href="/ru/ai-chat/social/profiles/owned-profile/chats/owned-chat/threads/owned-thread"',
  );
  expect(html).not.toContain(
    'data-subject-variant="me-social-module-profile-create-ai-chat"',
  );
});
it.each(["pending", "error"])(
  "keeps the chooser private while projects are %s",
  (state) => {
    mockProjectsState = state;
    const html = renderToStaticMarkup(<ProjectCreate {...(props as any)} />);
    expect(html).not.toContain("Owned project");
    expect(html).not.toContain("owned-thread");
    expect(html).toContain(
      state === "pending" ? 'aria-busy="true"' : "Try again",
    );
  },
);
