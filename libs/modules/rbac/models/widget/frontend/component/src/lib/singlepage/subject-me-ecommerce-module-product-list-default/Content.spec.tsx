import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Content";

let mockOwners: any[] | undefined;
let mockLinks: any[] | undefined;
let mockProducts: any[] | undefined;
const mockSubject = jest.fn();
const mockCatalog = jest.fn();
const mockOwnerRead = jest.fn();
const mockMembershipRead = jest.fn();
jest.mock(
  "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/frontend/component",
  () => ({
    Component: (props: any) => {
      mockOwnerRead(props);
      return props.children({ data: mockOwners });
    },
  }),
);
jest.mock(
  "@sps/ecommerce/relations/widgets-to-products/frontend/component",
  () => ({
    Component: (props: any) => {
      mockMembershipRead(props);
      return props.children({ data: mockLinks });
    },
  }),
);
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => {
    mockCatalog(props);
    return props.children({ data: mockProducts });
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    mockSubject(props);
    return <span>{props.ecommerceModuleProduct.id}</span>;
  },
}));
jest.mock("./Skeleton", () => ({
  Component: () => <span>Loading catalog</span>,
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockOwners = [
    { id: "owner-link", ecommerceModuleWidgetId: "ecommerce-widget" },
  ];
  mockLinks = [
    { id: "membership-b", productId: "product-b" },
    { id: "membership-a", productId: "product-a" },
  ];
  mockProducts = [
    { id: "product-a" },
    { id: "not-selected" },
    { id: "product-b" },
  ];
});
const render = (isServer = true) =>
  renderToStaticMarkup(
    <Component widgetId="rbac-widget" isServer={isServer} language="en" />,
  );
it("reads the exact owning Ecommerce Widget and only its ordered membership, preserving Subject actions in the browser", () => {
  expect(render()).toContain("product-b</span><span>product-a");
  expect(mockOwnerRead).toHaveBeenCalledWith(
    expect.objectContaining({
      isServer: true,
      variant: "find",
      apiProps: {
        params: {
          filters: {
            and: [
              { column: "widgetId", method: "eq", value: "rbac-widget" },
              { column: "variant", method: "eq", value: "default" },
            ],
          },
        },
      },
    }),
  );
  expect(mockMembershipRead).toHaveBeenCalledWith(
    expect.objectContaining({
      isServer: true,
      apiProps: {
        params: {
          filters: {
            and: [
              { column: "widgetId", method: "eq", value: "ecommerce-widget" },
              { column: "variant", method: "eq", value: "default" },
            ],
          },
          orderBy: {
            and: [
              { column: "orderIndex", method: "asc" },
              { column: "id", method: "asc" },
            ],
          },
        },
      },
    }),
  );
  expect(mockCatalog).toHaveBeenCalledWith(
    expect.objectContaining({
      isServer: true,
      variant: "find",
      apiProps: {
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ["product-b", "product-a"],
              },
            ],
          },
        },
      },
    }),
  );
  expect(
    mockSubject.mock.calls.map(([props]) => props.ecommerceModuleProduct.id),
  ).toEqual(["product-b", "product-a"]);
  expect(mockSubject).toHaveBeenCalledWith(
    expect.objectContaining({
      isServer: false,
      variant: "me-ecommerce-module-product-card-default",
    }),
  );
});
it.each([
  { owners: [] },
  {
    owners: [
      { ecommerceModuleWidgetId: "first" },
      { ecommerceModuleWidgetId: "second" },
    ],
  },
  { owners: [{}] },
])(
  "reports unavailable owners without falling back to Product.find",
  ({ owners }) => {
    mockOwners = owners;
    expect(render()).toContain("currently unavailable");
    expect(mockMembershipRead).not.toHaveBeenCalled();
    expect(mockCatalog).not.toHaveBeenCalled();
  },
);
it("keeps empty curation empty without querying all Products", () => {
  mockLinks = [];
  expect(render()).toContain("No products yet.");
  expect(mockCatalog).not.toHaveBeenCalled();
  expect(mockSubject).not.toHaveBeenCalled();
});
it("does not issue an unfiltered query when the owner or Product reference is missing", () => {
  expect(
    renderToStaticMarkup(
      <Component widgetId="" isServer={true} language="ru" />,
    ),
  ).toContain("недоступен");
  expect(mockOwnerRead).not.toHaveBeenCalled();
  mockLinks = [{ id: "corrupt", productId: null }];
  expect(render()).toContain("currently unavailable");
  expect(mockCatalog).not.toHaveBeenCalled();
});
it.each(["owner", "membership", "products"])(
  "keeps %s pending distinct from an empty selection",
  (stage) => {
    if (stage === "owner") mockOwners = undefined;
    if (stage === "membership") mockLinks = undefined;
    if (stage === "products") mockProducts = undefined;
    expect(render()).toContain("Loading catalog");
    expect(mockSubject).not.toHaveBeenCalled();
  },
);
it("uses client readers in the client path and never presents a missing selected Product as an unrelated one", () => {
  mockProducts = [{ id: "product-a" }, { id: "not-selected" }];
  expect(render(false)).toContain("currently unavailable");
  expect(mockOwnerRead).toHaveBeenCalledWith(
    expect.objectContaining({ isServer: false }),
  );
  expect(mockMembershipRead).toHaveBeenCalledWith(
    expect.objectContaining({ isServer: false }),
  );
  expect(mockCatalog).toHaveBeenCalledWith(
    expect.objectContaining({ isServer: false }),
  );
  expect(
    mockSubject.mock.calls.map(([props]) => props.ecommerceModuleProduct.id),
  ).toEqual(["product-a"]);
});
