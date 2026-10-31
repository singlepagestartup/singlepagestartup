/** @jest-environment jsdom */
import { render, screen, cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api as socialProfileClientApi } from "@sps/social/models/profile/sdk/client";
import { api as socialProfileServerApi } from "@sps/social/models/profile/sdk/server";
import ProfileServer from "./server";
const categoryReads = jest.fn();
const categoryLookups = jest.fn();
jest.mock("server-only", () => ({}));
jest.mock(
  "@sps/rbac/models/subject/frontend/component/src/lib/variants",
  () => ({
    variants: {
      "ecommerce-module-product-category-default": jest.requireActual(
        "../category-default",
      ).Component,
      "ecommerce-module-product-profile-default":
        jest.requireActual("./index").Component,
    },
  }),
);
jest.mock("@sps/social/models/profile/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: {
    authorFind: jest.fn(),
    find: jest.fn(() => {
      throw Error("Private Profile read");
    }),
  },
}));
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: {
    authorFind: jest.fn(),
    find: jest.fn(() => {
      throw Error("Private Profile read");
    }),
  },
}));
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: ({ data }: any) => <span>{data.title.en}</span>,
}));
jest.mock(
  "@sps/ecommerce/relations/categories-to-products/frontend/component",
  () => ({
    Component: (props: any) => {
      categoryReads(props.apiProps);
      return props.children({
        data: [{ id: "association", categoryId: "category" }],
      });
    },
  }),
);
jest.mock("@sps/ecommerce/models/category/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      categoryLookups(props.apiProps);
      return props.children({
        data: [{ id: "category", title: { en: "Framework tools" } }],
      });
    }
    return <span>{props.data.title.en}</span>;
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(socialProfileClientApi.authorFind).mockReturnValue({
    data: [{ id: "public-author", title: { en: "Framework team" } }],
    isError: false,
  } as any);
});
afterEach(cleanup);
it("dispatches public Product categories through Subject without a session or an unfiltered relation read", () => {
  render(
    <Subject
      isServer={false}
      variant="ecommerce-module-product-category-default"
      ecommerceModuleProductId="product"
      language="en"
    />,
  );
  expect(screen.getByText("Framework tools")).toBeTruthy();
  expect(categoryReads).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "productId", method: "eq", value: "product" }],
      },
    },
  });
  expect(categoryLookups).toHaveBeenCalledWith({
    params: {
      filters: { and: [{ column: "id", method: "eq", value: "category" }] },
    },
  });
});
it("dispatches public Product authors through Subject and the allowlisted client SDK", () => {
  render(
    <Subject
      isServer={false}
      variant="ecommerce-module-product-profile-default"
      ecommerceModuleProductId="product"
      language="en"
    />,
  );
  expect(screen.getByText("Framework team")).toBeTruthy();
  expect(socialProfileClientApi.authorFind).toHaveBeenCalledWith({
    params: { ecommerceModuleProductId: "product" },
    reactQueryOptions: { enabled: true },
  });
  expect(socialProfileClientApi.find).not.toHaveBeenCalled();
});
it("renders the same public author DTO through the server SDK", async () => {
  jest
    .mocked(socialProfileServerApi.authorFind)
    .mockResolvedValue([
      { id: "author", title: { en: "Public seller" } },
    ] as any);
  const html = renderToStaticMarkup(
    await ProfileServer({
      isServer: true,
      variant: "ecommerce-module-product-profile-default",
      ecommerceModuleProductId: "product",
      language: "en",
    }),
  );
  expect(html).toContain("Public seller");
  expect(socialProfileServerApi.authorFind).toHaveBeenCalledWith({
    params: { ecommerceModuleProductId: "product" },
  });
  expect(socialProfileServerApi.find).not.toHaveBeenCalled();
});
it.each([
  "ecommerce-module-product-category-default",
  "ecommerce-module-product-profile-default",
] as const)("does not start %s readers without a Product ID", (variant) => {
  const view = render(
    <Subject
      isServer={false}
      variant={variant}
      ecommerceModuleProductId=""
      language="en"
    />,
  );
  expect(view.container.innerHTML).toBe("");
  expect(categoryReads).not.toHaveBeenCalled();
  expect(socialProfileClientApi.authorFind).not.toHaveBeenCalled();
});
