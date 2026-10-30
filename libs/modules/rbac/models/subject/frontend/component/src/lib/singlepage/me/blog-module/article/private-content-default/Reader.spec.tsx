/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Component } from "./index";
let mockAuthorized = false;
const mockRelationRead = jest.fn();
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: ({ children, fallback }: any) =>
    mockAuthorized ? children : fallback,
}));
jest.mock("@sps/blog/models/article/frontend/component", () => ({
  Component: () => <div>Subscription required</div>,
}));
jest.mock(
  "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component",
  () => ({
    Component: (props: any) => {
      if (props.variant === "find") {
        mockRelationRead(props.apiProps);
        return props.children({
          data: [
            {
              id: "link",
              variant: "private",
              websiteBuilderModuleWidgetId: "widget",
            },
          ],
        });
      }
      return (
        <div data-testid="article-widget">
          {props.data.websiteBuilderModuleWidgetId}
        </div>
      );
    },
  }),
);
const props = {
  isServer: false,
  variant: "me-blog-module-article-private-content-default",
  language: "ru",
  blogModuleArticle: { id: "article" },
} as const;
beforeEach(() => {
  mockAuthorized = false;
  mockRelationRead.mockClear();
});
it("does not mount widget readers when the client permission check denies access", async () => {
  render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(await screen.findByText("Subscription required")).toBeVisible();
  expect(mockRelationRead).not.toHaveBeenCalled();
  expect(screen.queryByTestId("article-widget")).not.toBeInTheDocument();
});
it("reads the article's relations after client authorization and renders their normal variants", async () => {
  mockAuthorized = true;
  render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(await screen.findByTestId("article-widget")).toHaveTextContent(
    "widget",
  );
  expect(mockRelationRead).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "articleId", method: "eq", value: "article" }],
      },
    },
  });
});
