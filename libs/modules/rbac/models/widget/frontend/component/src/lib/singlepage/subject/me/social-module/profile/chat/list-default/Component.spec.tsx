jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("client-only", () => ({}), { virtual: true });
import { renderToStaticMarkup } from "react-dom/server";
const subjectRender = jest.fn();
const relationRead = jest.fn();
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    subjectRender(props);
    return <p>Authorized content</p>;
  },
}));
jest.mock(
  "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component",
  () => ({
    Component: (props: any) => {
      if (props.variant === "find") {
        relationRead(props.apiProps);
        return props.children({
          data: [{ id: "exact-link", websiteBuilderModuleWidgetId: "frame" }],
        });
      }
      return <section data-link={props.data.id}>{props.children}</section>;
    },
  }),
);
import { Component as Widget } from "@sps/rbac/models/widget/frontend/component";

beforeEach(() => {
  subjectRender.mockClear();
  relationRead.mockClear();
});

it.each([true, false])(
  "renders both public saved Widget variants with client session readers (isServer=%s)",
  (isServer) => {
    for (const kind of ["list", "overview"]) {
      const variant = `subject-me-social-module-profile-chat-${kind}-default`;
      const html = renderToStaticMarkup(
        <Widget
          {...({
            isServer,
            variant,
            dataSource: "props",
            data: { id: "widget", variant },
            language: "ru",
            socialModuleChatId: "chat",
            socialModuleThreadId: "thread",
          } as any)}
        />,
      );
      expect(html).toContain('data-link="exact-link"');
      expect(html).toContain("Authorized content");
      const input = subjectRender.mock.calls.at(-1)![0];
      expect(input).toEqual({
        isServer: false,
        variant: `me-social-module-profile-chat-${kind}-default`,
        language: "ru",
        socialModuleChatId: "chat",
        socialModuleThreadId: "thread",
      });
      expect(relationRead.mock.calls.at(-1)![0].params.filters.and).toEqual([
        { column: "widgetId", method: "eq", value: "widget" },
      ]);
    }
  },
);

it("does not mount a chat reader when the route has no required Chat ID", () => {
  const html = renderToStaticMarkup(
    <Widget
      {...({
        isServer: true,
        variant: "subject-me-social-module-profile-chat-overview-default",
        dataSource: "props",
        data: { id: "widget" },
        socialModuleThreadId: "thread",
      } as any)}
    />,
  );
  expect(html).toContain("Choose a chat");
  expect(subjectRender).not.toHaveBeenCalled();
});
