import { renderToStaticMarkup } from "react-dom/server";
import { Component as PublicContent } from "./Content";
import { Component as PrivateContent } from "../with-private-content-default/Content";
import { Component as CategoryContent } from "../../../category/overview/default/Content";
let mockData: any[] | undefined;
let mockFindData: ((props: any) => any[] | undefined) | undefined;
const mockRead = jest.fn();
const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
});
jest.mock("next/navigation", () => ({ notFound: () => mockNotFound() }));
jest.mock("@sps/blog/models/article/frontend/component", () => ({
  Component: (props: any) => {
    mockRead(props);
    return props.variant === "find" ? (
      props.children({ data: mockFindData ? mockFindData(props) : mockData })
    ) : (
      <article>
        {props.author}
        {props.authorCard}
        {props.children}
        {props.commentsContent}
        {props.navigation}
      </article>
    );
  },
}));
jest.mock("@sps/blog/models/category/frontend/component", () => ({
  Component: (props: any) => {
    mockRead(props);
    return props.variant === "find" ? (
      props.children({ data: mockData })
    ) : (
      <section>{props.children}</section>
    );
  },
}));
beforeEach(() => {
  mockData = [];
  mockFindData = undefined;
  mockRead.mockClear();
  mockNotFound.mockClear();
});
it.each([PublicContent, PrivateContent, CategoryContent])(
  "returns a real not-found error for a completed empty entity lookup",
  (View) => {
    expect(() =>
      renderToStaticMarkup(
        <View
          isServer={true}
          language="en"
          articleSlug="missing"
          categorySlug="missing"
        />,
      ),
    ).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  },
);
it("does not issue an unfiltered read for a missing slug or treat pending undefined data as a 404", () => {
  renderToStaticMarkup(<PublicContent isServer={true} language="en" />);
  expect(mockRead).not.toHaveBeenCalled();
  mockData = undefined;
  renderToStaticMarkup(
    <PublicContent isServer={true} language="en" articleSlug="existing" />,
  );
  expect(mockNotFound).not.toHaveBeenCalled();
});
it("supplies the same scoped content slot to both article compositions", () => {
  mockData = [{ id: "article" }];
  const slot = () => <div>Scoped ordered stream</div>;
  for (const View of [PublicContent, PrivateContent]) {
    const html = renderToStaticMarkup(
      <View
        isServer={true}
        language="en"
        articleSlug="existing"
        renderContent={slot}
      />,
    );
    expect(html).toContain("Scoped ordered stream");
  }
});
it.each([true, false])(
  "resolves author metadata to JSX before the Article view in runtime %s",
  (isServer) => {
    mockData = [{ id: "article" }];
    for (const View of [PublicContent, PrivateContent]) {
      const html = renderToStaticMarkup(
        <View
          isServer={isServer}
          language="en"
          articleSlug="existing"
          renderAuthor={({ data, size, inverse }) => (
            <span>
              {data.id}:{size}:{String(inverse)}
            </span>
          )}
        />,
      );
      expect(html).toContain("article:sm:false");
      const view = mockRead.mock.calls
        .map(([props]) => props)
        .findLast((props) => props.variant !== "find");
      expect(view.author).toBeDefined();
      expect(view.renderAuthor).toBeUndefined();
      expect(view.dataSource).toBe("props");
    }
  },
);

it.each([PublicContent, PrivateContent])(
  "browses distinct persisted IDs with two bounded reads without timestamp cursors",
  (View) => {
    const currentId = "22222222-2222-4222-8222-222222222222";
    const current = {
      id: currentId,
      slug: "current",
      // An API Date cannot retain the database's fractional microseconds.
      createdAt: new Date("2026-10-23T12:00:00.123Z"),
    };
    mockFindData = (props) => {
      const filters = props.apiProps.params.filters.and;
      if (filters.some((filter: any) => filter.column === "slug")) {
        return [current];
      }
      const previous = filters.some((filter: any) => filter.method === "lt");
      return [
        {
          id: previous
            ? "11111111-1111-4111-8111-111111111111"
            : "33333333-3333-4333-8333-333333333333",
          slug: previous ? "previous" : "next",
          title: { en: previous ? "Previous real guide" : "Next real guide" },
          createdAt: current.createdAt,
        },
      ];
    };
    const html = renderToStaticMarkup(
      <View isServer={true} language="en" articleSlug="current" />,
    );
    expect(html).toContain("/en/blog/articles/previous");
    expect(html).toContain("Previous real guide");
    expect(html).toContain("/en/blog/articles/next");
    expect(html).toContain("Next real guide");
    expect(html).not.toContain("/en/blog/articles/current");

    const reads = mockRead.mock.calls
      .map(([props]) => props)
      .filter((props) => props.variant === "find");
    expect(reads).toHaveLength(3);
    const neighborReads = reads.filter(
      (props) =>
        !props.apiProps.params.filters.and.some(
          (filter: any) => filter.column === "slug",
        ),
    );
    expect(neighborReads.map((props) => props.apiProps.params)).toEqual([
      {
        filters: { and: [{ column: "id", method: "lt", value: currentId }] },
        orderBy: { and: [{ column: "id", method: "desc" }] },
        limit: 1,
      },
      {
        filters: { and: [{ column: "id", method: "gt", value: currentId }] },
        orderBy: { and: [{ column: "id", method: "asc" }] },
        limit: 1,
      },
    ]);
  },
);

it("never links an Article to itself if a neighbor reader returns the current record", () => {
  mockData = [{ id: "current-id", slug: "current" }];
  const html = renderToStaticMarkup(
    <PublicContent isServer={true} language="en" articleSlug="current" />,
  );
  expect(html).not.toContain("/blog/articles/current");
  expect(html).not.toContain("Previous article");
  expect(html).not.toContain("Next article");
});

it.each([PublicContent, PrivateContent])(
  "forwards supplied author, comments and navigation JSX without neighbor reads",
  (View) => {
    mockData = [{ id: "article" }];
    const html = renderToStaticMarkup(
      <View
        isServer={true}
        language="en"
        articleSlug="existing"
        renderAuthorCard={() => <aside>Saved author card</aside>}
        renderCommentsContent={() => <section>Supplied comments</section>}
        renderNavigation={() => <nav>Supplied navigation</nav>}
      />,
    );
    expect(html).toContain("Saved author card");
    expect(html).toContain("Supplied comments");
    expect(html).toContain("Supplied navigation");
    expect(
      mockRead.mock.calls.filter(([props]) => props.variant === "find"),
    ).toHaveLength(1);
  },
);
