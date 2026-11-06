import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Component";
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  BylineSkeleton: () => <div data-variant="byline-loading" />,
}));
const mockSocialReads = jest.fn();
const mockWidgetReads = jest.fn();
let mockLinks: any[];
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: (props: any) =>
    props.children({
      data: {
        "blog.articles.slug": "article-a",
        "blog.categories.slug": "category-a",
      },
    }),
}));
jest.mock("@sps/blog/models/widget/frontend/component", () => ({
  Component: (props: any) => {
    mockWidgetReads(props);
    return props.variant === "find" ? (
      props.children({
        data: [{ id: "widget-a", variant: "article-list-default" }],
      })
    ) : (
      <section>
        {props.renderAuthor({ data: { id: "article-a" }, size: "xs" })}
        {props.renderContent({ data: { id: "article-a" } })}
      </section>
    );
  },
}));
jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/frontend/component",
  () => ({
    Component: (props: any) => {
      mockSocialReads(props);
      return props.variant === "find" ? (
        props.children({ data: mockLinks })
      ) : (
        <span>
          {props.data.profileId}:{props.size}:{String(props.isServer)}
        </span>
      );
    },
  }),
);
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => (
    <span>Scoped article:{props.blogModuleArticle.id}</span>
  ),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockLinks = [
    {
      id: "author-link",
      blogModuleArticleId: "article-a",
      profileId: "profile-a",
    },
  ];
});
it.each([true, false])(
  "composes actual Social author links by loaded article ID in runtime %s without changing the scoped content slot",
  (isServer) => {
    const html = renderToStaticMarkup(
      <Component
        isServer={isServer}
        language="ru"
        url="/blog"
        data={{ externalWidgetId: "widget-a" } as any}
      />,
    );
    expect(html).toContain(`profile-a:xs:${String(isServer)}`);
    expect(html).toContain("Scoped article:article-a");
    expect(
      mockSocialReads.mock.calls[0][0].apiProps.params.filters.and,
    ).toEqual([
      { column: "blogModuleArticleId", method: "eq", value: "article-a" },
    ]);
    expect(
      mockSocialReads.mock.calls[0][0].apiProps.params.orderBy.and,
    ).toEqual([{ column: "orderIndex", method: "asc" }]);
    const loaded = mockSocialReads.mock.calls[1][0];
    expect(loaded.dataSource).toBe("props");
    expect(loaded.variant).toBe("author-default");
    expect(loaded.language).toBe("ru");
    expect(mockWidgetReads.mock.calls[1][0].dataSource).toBe("props");
  },
);
it("renders no invented author when the actual article has no Social link", () => {
  mockLinks = [];
  const html = renderToStaticMarkup(
    <Component
      isServer={true}
      language="en"
      url="/blog"
      data={{ externalWidgetId: "widget-a" } as any}
    />,
  );
  expect(mockSocialReads).toHaveBeenCalledTimes(1);
  expect(html).not.toContain("profile-a");
  expect(html).toContain("Scoped article:article-a");
});
