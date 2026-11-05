import { renderToStaticMarkup } from "react-dom/server";
const mockDispatch = jest.fn();
let mockParams: Readonly<Record<string, string | undefined>> | undefined;
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: (props: any) => props.children({ data: mockParams }),
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: any[]) => values.filter(Boolean).join(" "),
}));
jest.mock("./analytic/Component", () => ({
  Component: (props: any) => {
    mockDispatch("analytic", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./billing/Component", () => ({
  Component: (props: any) => {
    mockDispatch("billing", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./blog/Component", () => ({
  Component: (props: any) => {
    mockDispatch("blog", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./crm/Component", () => ({
  Component: (props: any) => {
    mockDispatch("crm", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./ecommerce/Component", () => ({
  Component: (props: any) => {
    mockDispatch("ecommerce", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./file-storage/Component", () => ({
  Component: (props: any) => {
    mockDispatch("file-storage", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./notification/Component", () => ({
  Component: (props: any) => {
    mockDispatch("notification", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./rbac/Component", () => ({
  Component: (props: any) => {
    mockDispatch("rbac", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./social/Component", () => ({
  Component: (props: any) => {
    mockDispatch("social", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./startup/Component", () => ({
  Component: (props: any) => {
    mockDispatch("startup", props);
    return <span>Widget slot</span>;
  },
}));
jest.mock("./website-builder/Component", () => ({
  Component: (props: any) => {
    mockDispatch("website-builder", props);
    return <span>Widget slot</span>;
  },
}));
import { Component } from "./Component";
beforeEach(() => mockDispatch.mockClear());
it.each([
  "analytic",
  "billing",
  "blog",
  "crm",
  "ecommerce",
  "file-storage",
  "notification",
  "rbac",
  "social",
  "startup",
  "website-builder",
])("leaves URL resolution in the %s leaf composition", (externalModule) => {
  mockParams = Object.freeze({
    "unknown.module.id": "future",
    "social.chats.id": "chat",
  });
  renderToStaticMarkup(
    <Component
      {...({
        isServer: true,
        variant: "default",
        data: { id: "link", externalModule, externalWidgetId: "widget" },
        url: "/chat",
        language: "en",
      } as any)}
    />,
  );
  expect(mockDispatch).toHaveBeenCalledTimes(1);
  expect(mockDispatch.mock.calls[0][0]).toBe(externalModule);
  expect(mockDispatch.mock.calls[0][1]).not.toHaveProperty("routeParams");
});
it.each([{}, undefined])(
  "preserves static and unresolved Page context without inventing IDs",
  (params) => {
    mockParams = params;
    renderToStaticMarkup(
      <Component
        {...({
          isServer: true,
          variant: "default",
          data: {
            id: "link",
            externalModule: "rbac",
            externalWidgetId: "widget",
          },
          url: "/",
          language: "en",
        } as any)}
      />,
    );
    expect(mockDispatch.mock.calls[0][1]).not.toHaveProperty("routeParams");
  },
);
