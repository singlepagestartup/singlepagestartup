/**
 * BDD Suite: Host public Widget composition.
 *
 * Given: a persisted Website Builder Widget and the current Subject.
 * When: Host resolves the external Widget variant.
 * Then: Website Builder owns the content shell and receives the module form through its child slot.
 */
import { renderToStaticMarkup } from "react-dom/server";
const widgets = [{ id: "website-widget", variant: "landing-ai-chat" }];
const widgetReads = jest.fn();
const widgetRenders = jest.fn();
const subjectCalls = jest.fn();
const projectWidgetCalls = jest.fn();
let authenticated = true;
jest.mock("./widget/singlepage/navbar-default", () => ({
  Component: () => null,
}));
jest.mock("@sps/website-builder/models/widget/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      widgetReads(props.apiProps);
      return props.children({ data: widgets });
    }
    widgetRenders(props);
    if (props.variant === "content-ai-chat-help") {
      const { Component: Help } = jest.requireActual(
        "../../../../../../../../../../website-builder/models/widget/frontend/component/src/lib/singlepage/content-ai-chat-help/Component",
      );
      return <Help {...props} />;
    }
    return <main data-variant={props.variant}>{props.children}</main>;
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    subjectCalls(props);
    return props.variant === "authentication-me-default" ? (
      props.children({
        data: { id: "current-subject", variant: "default" },
        authenticated,
      })
    ) : (
      <form aria-label="Subject support form" data-subject-id={props.data.id} />
    );
  },
}));
jest.mock("@sps/rbac/models/widget/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find")
      return props.children({ data: [{ id: "project-widget" }] });
    if (props.variant === "subject-me-social-module-profile-create-ai-chat") {
      projectWidgetCalls(props);
      return <section aria-label="Project chooser" />;
    }
    throw new Error(
      "Public Website Builder content must not render an RBAC Widget wrapper",
    );
  },
}));
jest.mock("@sps/social/models/chat/frontend/component", () => ({
  Component: (props: any) =>
    props.variant === "find" ? (
      props.children({ data: [{ id: "preview-chat" }] })
    ) : (
      <article data-variant={props.variant} data-id={props.data.id}>
        Chat demo
      </article>
    ),
}));
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: () => null,
  EmptyProjectSelect: () => null,
}));
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: (props: any) =>
    props.children({
      data: props.url.includes("/social/profiles/")
        ? props.segment === "social.profiles.id"
          ? "profile-id"
          : "chat-id"
        : undefined,
    }),
}));
jest.mock("@sps/website-builder/models/feature/frontend/component", () => ({
  Component: () => null,
}));
import { Component } from "./Component";
const props: any = {
  isServer: true,
  data: { externalWidgetId: "website-widget" },
  language: "en",
  url: "/en/ai-chat",
  apiProps: {
    params: {
      filters: {
        and: [{ column: "widgetId", method: "eq", value: "host-widget" }],
      },
    },
  },
};
beforeEach(() => {
  authenticated = true;
  widgetReads.mockClear();
  widgetRenders.mockClear();
  subjectCalls.mockClear();
  projectWidgetCalls.mockClear();
});
it.each([
  "content-ai-chat-profile-create",
  "content-ai-chat-help",
  "landing-ai-chat",
])(
  "renders its exact persisted %s without cross-module record discovery",
  (variant) => {
    widgets[0].variant = variant;
    const html = renderToStaticMarkup(<Component {...props} />);
    expect(html).toContain(`data-variant="${variant}"`);
    expect(projectWidgetCalls).not.toHaveBeenCalled();
    expect(subjectCalls).not.toHaveBeenCalled();
    expect(widgetReads).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [{ column: "id", method: "eq", value: "website-widget" }],
        },
      },
    });
  },
);

it.each([
  ["/ai-chat/help", true],
  [
    "/ai-chat/social/profiles/profile-id/chats/chat-id/threads/thread-id",
    false,
  ],
])(
  "passes a presentation flag to the Navbar for %s without exposing the URL",
  (url, helpSelected) => {
    widgets[0].variant = "navbar-ai-chat";
    renderToStaticMarkup(<Component {...props} url={url} />);
    const target = widgetRenders.mock.calls[0][0];
    expect(target).toEqual(
      expect.objectContaining({
        variant: "navbar-ai-chat",
        language: "en",
        helpSelected,
        data: expect.objectContaining({ id: "website-widget" }),
      }),
    );
    expect(target).not.toHaveProperty("url");
    expect(target).not.toHaveProperty("apiProps");
    expect(subjectCalls.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        variant: "authentication-me-default",
        isServer: false,
      }),
    );
    const account = subjectCalls.mock.calls.find(
      ([call]) => call.variant === "me-account-ai-chat",
    )?.[0];
    expect(account).not.toHaveProperty("url");
  },
);

it("shows Sign in for an anonymous default Subject without reading account or project views", () => {
  widgets[0].variant = "navbar-ai-chat";
  authenticated = false;
  const html = renderToStaticMarkup(
    <Component {...props} url="/ai-chat/projects" />,
  );
  expect(html).toContain("Sign in");
  expect(html).not.toContain("Projects unavailable");
  expect(subjectCalls.mock.calls.map(([call]) => call.variant)).toEqual([
    "authentication-me-default",
  ]);
});
