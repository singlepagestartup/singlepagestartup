/** Given an anonymous request, public product content must render before a Subject exists. */
import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Content";
const product = { id: "product-1", title: { en: "Public product" } };
const reads = jest.fn();
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      reads(props.apiProps);
      return props.children({ data: [product] });
    }
    return (
      <article>
        <h1>{props.data.title.en}</h1>
        {props.children}
      </article>
    );
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  CardHeader: ({ children }: any) => children,
  CardContent: ({ children }: any) => children,
}));
jest.mock(
  "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/Category",
  () => ({ Component: () => null }),
);
jest.mock(
  "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/Profile",
  () => ({ Component: () => null }),
);
it("renders product H1 while session-dependent actions are absent", () => {
  const html = renderToStaticMarkup(
    <Component
      isServer={true}
      language="en"
      ecommerceModuleProductSlug="one"
    />,
  );
  expect(html).toContain("<h1>Public product</h1>");
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
