/**
 * BDD Suite: Page-owned Layout Widget composition.
 *
 * Given: persisted Page, Layout and Widget relation records and a current Page URL.
 * When: the Page composes its Layout slots.
 * Then: route data stays in Host Page/Widget composition and Layout receives ready nodes.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Component as Layout } from "@sps/host/models/layout/frontend/component";

const layoutProps = jest.fn();
const layoutLinkProps = jest.fn();
const layoutWidgetProps = jest.fn();
const slotReads = jest.fn();
const widgetProps = jest.fn();
const links = {
  default: [
    { id: "header-link", layoutId: "layout-id", widgetId: "header-widget" },
  ],
  additional: [
    { id: "footer-link", layoutId: "layout-id", widgetId: "footer-widget" },
  ],
};

jest.mock("../variants", () => ({
  variants: { default: jest.requireActual("./Component").Component },
}));
jest.mock("@sps/host/relations/pages-to-layouts/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find")
      return props.children({
        data: [{ id: "page-layout-link", layoutId: "layout-id" }],
      });
    layoutLinkProps(props);
    const { Component } = jest.requireActual(
      "../../../../../../../../relations/pages-to-layouts/frontend/component/src/lib/singlepage/default/Component",
    );
    return <Component {...props} />;
  },
}));
jest.mock("@sps/host/models/layout/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find")
      return props.children({
        data: [{ id: "layout-id", variant: "default" }],
      });
    layoutProps(props);
    const { Component } = jest.requireActual(
      "../../../../../../../layout/frontend/component/src/lib/singlepage/default/Component",
    );
    return <Component {...props} />;
  },
}));
jest.mock("@sps/host/relations/layouts-to-widgets/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      slotReads(props);
      const slot = props.apiProps.params.filters.and.find(
        (filter: any) => filter.column === "variant",
      ).value;
      return props.children({ data: links[slot as keyof typeof links] });
    }
    layoutWidgetProps(props);
    const { Component } = jest.requireActual(
      "../../../../../../../../relations/layouts-to-widgets/frontend/component/src/lib/singlepage/default/Component",
    );
    return <Component {...props} />;
  },
}));
jest.mock("@sps/host/models/widget/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      const id = props.apiProps.params.filters.and.find(
        (filter: any) => filter.column === "id",
      ).value;
      return props.children({ data: [{ id, variant: "default" }] });
    }
    widgetProps(props);
    return <span data-widget={props.data.id}>{props.data.id}</span>;
  },
}));
jest.mock("@sps/host/relations/pages-to-widgets/frontend/component", () => ({
  Component: (props: any) =>
    props.variant === "find" ? (
      props.children({ data: [{ id: "content-link", variant: "default" }] })
    ) : (
      <article>Page content</article>
    ),
}));

beforeEach(() => {
  for (const spy of [
    layoutProps,
    layoutLinkProps,
    layoutWidgetProps,
    slotReads,
    widgetProps,
  ])
    spy.mockClear();
});

it.each([true, false])(
  "composes persisted slots without giving Layout the URL (isServer=%s)",
  (isServer) => {
    const url =
      "/ai-chat/social/profiles/profile-id/chats/chat-id/threads/thread-id";
    const html = renderToStaticMarkup(
      <Page
        {...({
          isServer,
          variant: "default",
          data: { id: "page-id" },
          language: "ru",
          url,
        } as any)}
      />,
    );
    expect(html.indexOf("header-widget")).toBeLessThan(
      html.indexOf("Page content"),
    );
    expect(html.indexOf("Page content")).toBeLessThan(
      html.indexOf("footer-widget"),
    );
    expect(html.match(/data-widget="header-widget"/g)).toHaveLength(1);
    expect(html.match(/data-widget="footer-widget"/g)).toHaveLength(1);
    expect(slotReads).toHaveBeenCalledTimes(2);
    for (const [call] of [
      ...layoutProps.mock.calls,
      ...layoutLinkProps.mock.calls,
      ...layoutWidgetProps.mock.calls,
    ])
      expect(call).not.toHaveProperty("url");
    for (const [call] of widgetProps.mock.calls)
      expect(call).toEqual(
        expect.objectContaining({ url, language: "ru", isServer }),
      );
    expect(
      slotReads.mock.calls.map(([call]) => call.apiProps.params.filters.and),
    ).toEqual([
      [
        { column: "layoutId", method: "eq", value: "layout-id" },
        { column: "variant", method: "eq", value: "default" },
      ],
      [
        { column: "layoutId", method: "eq", value: "layout-id" },
        { column: "variant", method: "eq", value: "additional" },
      ],
    ]);
  },
);

it("keeps the ordinary Layout relation fallback when Page slots are not supplied", () => {
  const html = renderToStaticMarkup(
    <Layout
      {...({
        isServer: true,
        variant: "default",
        data: { id: "layout-id" },
        language: "en",
      } as any)}
    >
      Standalone content
    </Layout>,
  );
  expect(html).toContain("header-widget");
  expect(html).toContain("Standalone content");
  expect(html).toContain("footer-widget");
  expect(slotReads).toHaveBeenCalledTimes(2);
  for (const [call] of layoutWidgetProps.mock.calls)
    expect(call).not.toHaveProperty("url");
  for (const [call] of widgetProps.mock.calls)
    expect(call).not.toHaveProperty("url");
});
