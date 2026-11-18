/** Given an anonymous request, public product content must render before a Subject exists. */
import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Content";
const product = { id: "product-1", title: { en: "Public product" } };
const reads = jest.fn();
const subjectReads = jest.fn();
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      reads(props.apiProps);
      return props.children({ data: [product] });
    }
    return (
      <article>
        <h1>{props.data.title.en}</h1>
        {props.topSlot}
        {props.priceSlot}
        {props.middleSlot}
        {props.children}
      </article>
    );
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  ProductWithOfferPrice: (...args: any[]) =>
    jest
      .requireActual(
        "../../../../../../../subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/ProductWithOfferPrice",
      )
      .ProductWithOfferPrice(...args),
  Component: (props: any) => {
    subjectReads(props);
    return props.variant.startsWith("me-") ? null : (
      <span>{props.variant}</span>
    );
  },
}));
jest.mock("@sps/ecommerce/models/store/frontend/component", () => ({
  Component: ({ product, variant, readOnly }: any) =>
    variant === "product-price-default" &&
    readOnly &&
    product.id === "product-1"
      ? "Quoted unit price"
      : null,
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  CardHeader: ({ children }: any) => children,
  CardContent: ({ children }: any) => children,
}));
it("renders product H1 while session-dependent actions are absent", () => {
  const html = renderToStaticMarkup(
    <Component
      isServer={true}
      language="en"
      ecommerceModuleProductSlug="one"
    />,
  );
  expect(html).toContain("<h1>Public product</h1>");
  expect(html).toContain("Quoted unit price");
  for (const variant of [
    "ecommerce-module-product-category-default",
    "ecommerce-module-product-profile-default",
  ]) {
    expect(subjectReads).toHaveBeenCalledWith(
      expect.objectContaining({
        variant,
        isServer: true,
        ecommerceModuleProductId: "product-1",
        language: "en",
      }),
    );
    expect(html).toContain(variant);
  }
  expect(subjectReads).toHaveBeenCalledWith(
    expect.objectContaining({
      variant: "me-ecommerce-module-product-cart-default",
      isServer: false,
      withOneStepCheckout: true,
    }),
  );
  expect(subjectReads).not.toHaveBeenCalledWith(
    expect.objectContaining({
      variant: "me-ecommerce-module-product-checkout-default",
    }),
  );
  expect(reads).toHaveBeenCalledWith({
    params: {
      filters: { and: [{ column: "slug", method: "eq", value: "one" }] },
    },
  });
});
it("does not read an unfiltered product list for a missing slug", () => {
  reads.mockClear();
  expect(
    renderToStaticMarkup(<Component isServer={true} language="en" />),
  ).toBe("");
  expect(reads).not.toHaveBeenCalled();
});
