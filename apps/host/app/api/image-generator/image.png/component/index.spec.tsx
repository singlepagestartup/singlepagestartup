/**
 * BDD Suite: Image generation honors project variants.
 * Given: the public image component and its merged singlepage/startup registry.
 * When: a project overrides the receipt renderer or an unknown variant is requested.
 * Then: the override is selected and unregistered variants render an empty result.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
jest.mock("@sps/shared-utils", () => ({
  NEXT_PUBLIC_API_SERVICE_URL: "http://localhost:4002",
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: { defaultLanguage: { code: "en" } },
}));
function fixture() {
  return {
    variant: "generate-template-ecommerce-order-receipt-default",
    data: {
      fileStorage: { file: { file: "/receipt.png" } },
      ecommerce: {
        order: {
          id: "order-1",
          ordersToProducts: [
            {
              id: "line",
              quantity: 1,
              product: {
                id: "product",
                slug: "work-code",
                title: { en: "Same title", ru: "Same title" },
              },
            },
          ],
          ordersToBillingModuleCurrencies: [
            { billingModuleCurrency: { symbol: "RUB" } },
          ],
          checkoutAttributesByCurrency: { amount: 10000 },
        },
      },
    },
  };
}
/**
 * BDD Scenario: a project overrides the receipt presentation.
 * Given: startup registers a wrapper around the real receipt component.
 * When: the public image component renders the receipt variant.
 * Then: it uses startup's presentation while retaining the real receipt contents.
 */
it("selects a startup receipt override through the public registry", () => {
  let html = "";
  jest.isolateModules(() => {
    const { variants } = jest.requireActual("./startup/variants");
    const Base = jest.requireActual(
      "./singlepage/generate-template-ecommerce-order-receipt-default",
    ).Component;
    variants["generate-template-ecommerce-order-receipt-default"] = (
      props: any,
    ) =>
      React.createElement(Base, {
        ...props,
        data: {
          ...props.data,
          ecommerce: {
            order: { ...props.data.ecommerce.order, id: "PROJECT RECEIPT" },
          },
        },
      });
    const { Component } = jest.requireActual("./index");
    html = renderToStaticMarkup(React.createElement(Component, fixture()));
  });
  expect(html).toContain("PROJECT RECEIPT");
  expect(html).toContain("Same title");
  expect(html).not.toContain("props.data:");
});
/**
 * BDD Scenario: the configured receipt is rendered normally.
 * Given: the standard public variant entrypoint.
 * When: it renders a receipt.
 * Then: order identity and product title remain visible without dumping the payload.
 */
it("preserves receipt contents through the public entrypoint", () => {
  const { Component } = jest.requireActual("./index");
  const html = renderToStaticMarkup(React.createElement(Component, fixture()));
  expect(html).toContain("order-1");
  expect(html).toContain("Same title");
  expect(html).not.toContain("props.data:");
});
/**
 * BDD Scenario: the requested variant is not registered.
 * Given: an arbitrary inherited-object property as variant.
 * When: the public entrypoint receives it.
 * Then: it renders an empty element rather than treating the prototype as a component.
 */
it("rejects unregistered prototype keys", () => {
  const { Component } = jest.requireActual("./index");
  expect(
    renderToStaticMarkup(
      React.createElement(Component, { ...fixture(), variant: "__proto__" }),
    ),
  ).toBe("<div></div>");
});
