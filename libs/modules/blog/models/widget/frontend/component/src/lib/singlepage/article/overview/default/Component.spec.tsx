import { renderToStaticMarkup } from "react-dom/server";
const mockArticleFind = jest.fn();
const mockCategoryFind = jest.fn();
const mockProductFind = jest.fn();
const article = { id: "article", title: { en: "Article" } };
const product = { id: "product" };
jest.mock("@sps/shared-frontend-client-utils", () => ({ cn: () => "" }));
jest.mock("@sps/blog/models/article/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      mockArticleFind(props.apiProps);
      return props.children({ data: [article] });
    }
    return <article>{props.children}</article>;
  },
}));
jest.mock("@sps/blog/models/category/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      mockCategoryFind(props.apiProps);
      return props.children({ data: [{ id: "category" }] });
    }
    return <section>Category</section>;
  },
}));
jest.mock(
  "@sps/blog/relations/articles-to-ecommerce-module-products/frontend/component",
  () => ({
    Component: (props: any) =>
      props.children({
        data: [{ id: "link", ecommerceModuleProductId: product.id }],
      }),
  }),
);
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      mockProductFind(props.apiProps);
      return props.children({ data: [product] });
    }
    return <section>Product</section>;
  },
}));
import { Component as Overview } from "./Component";
import { Component as PrivateContent } from "../with-private-content-default/Component";
import { Component as Products } from "../ecommerce-module/product/list/default/Component";
import { Component as Category } from "../../../category/overview/default/Component";
const props = { isServer: true, data: { id: "widget" }, language: "en" };
beforeEach(() => {
  mockArticleFind.mockClear();
  mockCategoryFind.mockClear();
  mockProductFind.mockClear();
});
it.each([Overview, PrivateContent, Products, Category])(
  "does not turn a missing required route value into a collection read",
  (View) => {
    renderToStaticMarkup(
      <View
        {...({ ...props, routeParams: { "unrelated.id": "other" } } as any)}
      />,
    );
    expect(mockArticleFind).not.toHaveBeenCalled();
    expect(mockCategoryFind).not.toHaveBeenCalled();
    expect(mockProductFind).not.toHaveBeenCalled();
  },
);
it.each([Overview, PrivateContent, Products])(
  "selects the article slug unchanged and gives higher-module slots loaded records",
  (View) => {
    const renderPrivateContent = jest.fn(() => <b>Authorized extension</b>);
    const renderProduct = jest.fn(() => <b>Scoped purchase</b>);
    const html = renderToStaticMarkup(
      <View
        {...({
          ...props,
          articleSlug: "a%2Fb",
          renderPrivateContent,
          renderProduct,
        } as any)}
      />,
    );
    expect(mockArticleFind).toHaveBeenCalledWith({
      params: {
        filters: { and: [{ column: "slug", method: "eq", value: "a%2Fb" }] },
      },
    });
    if (View === PrivateContent) {
      expect(renderPrivateContent).toHaveBeenCalledWith({ data: article });
      expect(html).toContain("Authorized extension");
    }
    if (View === Products) {
      expect(renderProduct).toHaveBeenCalledWith({ data: product });
      expect(html).toContain("Scoped purchase");
      expect(mockProductFind).toHaveBeenCalledWith({
        params: {
          filters: { and: [{ column: "id", method: "eq", value: product.id }] },
        },
      });
    }
  },
);
it("uses the category key rather than another module's category slug", () => {
  renderToStaticMarkup(
    <Category
      {...({
        ...props,
        categorySlug: "blog-category",
      } as any)}
    />,
  );
  expect(mockCategoryFind).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "slug", method: "eq", value: "blog-category" }],
      },
    },
  });
});
