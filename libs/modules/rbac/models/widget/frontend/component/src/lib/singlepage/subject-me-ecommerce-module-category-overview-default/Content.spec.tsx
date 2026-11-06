import { renderToStaticMarkup } from "react-dom/server";
const mockSubject = jest.fn();
const mockCategory = jest.fn();
jest.mock("@sps/ecommerce/models/category/frontend/component", () => ({
  Component: (props: any) => {
    mockCategory(props);
    return props.variant === "find" ? (
      props.children({
        data: [{ id: "category", slug: "cat", title: { en: "Category" } }],
      })
    ) : (
      <div>{props.children}</div>
    );
  },
}));
jest.mock(
  "@sps/ecommerce/relations/categories-to-products/frontend/component",
  () => ({
    Component: (props: any) =>
      props.children({ data: [{ id: "category-link", productId: "product" }] }),
  }),
);
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => props.children({ data: [{ id: "product" }] }),
}));
jest.mock(
  "@sps/ecommerce/relations/stores-to-products/frontend/component",
  () => ({
    Component: (props: any) =>
      props.children({ data: [{ id: "store-link", storeId: "store" }] }),
  }),
);
jest.mock("@sps/ecommerce/models/store/frontend/component", () => ({
  Component: (props: any) => props.children({ data: [{ id: "store" }] }),
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    mockSubject(props);
    return <div />;
  },
}));
import { Component } from "./Content";
it("uses the full Product card including quick checkout in a category with its exact Store and browser Subject", () => {
  renderToStaticMarkup(
    <Component
      isServer={true}
      language="en"
      ecommerceModuleCategorySlug="cat"
    />,
  );
  expect(mockCategory).toHaveBeenCalledWith(
    expect.objectContaining({
      variant: "overview-default",
      embedded: true,
      dataSource: "props",
    }),
  );
  expect(mockSubject).toHaveBeenCalledWith(
    expect.objectContaining({
      isServer: false,
      variant: "me-ecommerce-module-product-card-default",
      ecommerceModuleProduct: { id: "product" },
      ecommerceModuleStore: { id: "store" },
    }),
  );
});
it("does not issue an unfiltered category read when the slug is absent", () => {
  mockCategory.mockClear();
  renderToStaticMarkup(<Component isServer={true} language="en" />);
  expect(mockCategory).not.toHaveBeenCalled();
});
