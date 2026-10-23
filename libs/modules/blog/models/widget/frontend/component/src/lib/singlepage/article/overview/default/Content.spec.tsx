import { renderToStaticMarkup } from "react-dom/server";
import { Component as PublicContent } from "./Content";
import { Component as PrivateContent } from "../with-private-content-default/Content";
import { Component as CategoryContent } from "../../../category/overview/default/Content";
let mockData: any[] | undefined;
const mockRead = jest.fn();
const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
});
jest.mock("next/navigation", () => ({ notFound: () => mockNotFound() }));
jest.mock("@sps/blog/models/article/frontend/component", () => ({
  Component: (props: any) => {
    mockRead(props);
    return props.variant === "find" ? (
      props.children({ data: mockData })
    ) : (
      <article>
        {props.author}
        {props.children}
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
      expect(html).toContain("article:sm:true");
      const view = mockRead.mock.calls
        .map(([props]) => props)
        .findLast((props) => props.variant !== "find");
      expect(view.author).toBeDefined();
      expect(view.renderAuthor).toBeUndefined();
      expect(view.dataSource).toBe("props");
    }
  },
);
