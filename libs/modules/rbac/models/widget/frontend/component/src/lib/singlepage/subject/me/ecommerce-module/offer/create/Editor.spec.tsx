/** @jest-environment jsdom */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import type { ICatalogContext } from "@sps/rbac/models/subject/sdk/model";

const updateOffer = jest.fn();
const updateProduct = jest.fn();
const setAttribute = jest.fn();
const deleteAttribute = jest.fn();
const createLink = jest.fn();
const deleteLink = jest.fn();
let nextBox = 0;
jest.mock("@paralleldrive/cuid2", () => ({
  createId: () => `box-${++nextBox}`,
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleCatalogAttributeSet: () => ({
      mutateAsync: setAttribute,
      isPending: false,
    }),
    ecommerceModuleCatalogMutation: () => ({
      isPending: false,
      mutateAsync: (props: any) => {
        if (props.data.entity === "products") {
          return updateProduct(props);
        }
        const action =
          props.data.entity === "stores-to-products"
            ? updateOffer
            : props.data.entity === "attributes"
              ? deleteAttribute
              : props.data.method === "POST"
                ? createLink
                : deleteLink;
        return action(props);
      },
    }),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  catalogCreateOfferSchema: {
    shape: { settings: { parse: (value: unknown) => value } },
  },
}));
import { Editor } from "./Editor";

const context = {
  stores: [{ id: "store", title: { en: "Store" } }],
  products: [
    {
      id: "product",
      title: { en: "Wardrobe" },
      kind: "physical",
      singleUnitPerOrder: false,
    },
    {
      id: "delivery-product",
      title: { en: "Delivery" },
      kind: "service",
      type: "one_off",
    },
  ],
  currencies: [{ id: "rub", title: "RUB", minorUnitDigits: 2 }],
  offers: [
    {
      id: "offer",
      sku: "WARDROBE",
      storeId: "store",
      productId: "product",
      variant: "default",
      configurationKey: "oak",
      settings: {
        packages: [
          {
            count: 1,
            length_cm: "180",
            width_cm: "60",
            height_cm: "20",
            weight_kg: "30",
          },
        ],
      },
    },
    {
      id: "delivery",
      sku: "DELIVERY",
      storeId: "contractor",
      productId: "delivery-product",
      variant: "default",
      settings: {},
    },
  ],
  links: [],
  ownedProductIds: [],
  attributes: [
    {
      id: "price",
      relationId: "price-link",
      owner: { type: "offer", id: "offer" },
      key: "price",
      type: "price",
      field: "number",
      number: "5000",
      text: "",
      currencyId: "rub",
    },
    {
      id: "stock",
      relationId: "stock-link",
      owner: { type: "offer", id: "offer" },
      key: "stock_quantity",
      type: "feature",
      field: "number",
      number: "3",
      text: "",
    },
  ],
} as unknown as ICatalogContext;

beforeEach(() => {
  jest.clearAllMocks();
  for (const action of [
    updateOffer,
    updateProduct,
    setAttribute,
    deleteAttribute,
    createLink,
    deleteLink,
  ]) {
    action.mockResolvedValue({ id: "stored" });
  }
});
afterEach(cleanup);
function openEditor(editorContext = context) {
  const refresh = jest.fn().mockResolvedValue(undefined);
  render(
    <Editor
      subjectId="owner"
      storeId="store"
      context={editorContext}
      onRefresh={refresh}
    />,
  );
  fireEvent.click(screen.getByText("Edit existing offers, rates and services"));
  return refresh;
}

test.each([
  [false, "after-acceptance", true],
  [true, "in-cart", false],
] as const)(
  "updates a service offer's payment timing (initial acceptance setting %s)",
  async (initial, timing, expected) => {
    const offer = {
      ...context.offers[0],
      productId: "delivery-product",
      settings: { requiresResultAcceptance: initial },
    };
    openEditor({ ...context, offers: [offer] });
    const input = screen.getByRole("combobox", {
      name: /When the customer pays/,
    }) as HTMLSelectElement;
    expect(input.value).toBe(initial ? "after-acceptance" : "in-cart");
    fireEvent.change(input, { target: { value: timing } });
    fireEvent.submit(input.form!);
    await waitFor(() =>
      expect(updateOffer).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recordId: offer.id,
            data: expect.objectContaining({
              settings: expect.objectContaining({
                requiresResultAcceptance: expected,
              }),
            }),
          }),
        }),
      ),
    );
  },
);

test("editing an offer sends its actual price, stock and packaging through the owning SDKs", async () => {
  openEditor();
  expect(
    screen.queryByRole("checkbox", { name: "Limit to one unit per order" }),
  ).toBeNull();
  expect(
    screen.queryByRole("combobox", { name: /When the customer pays/ }),
  ).toBeNull();
  expect(screen.queryByLabelText(/Pickup point IDs/)).toBeNull();
  fireEvent.change(screen.getByLabelText("RUB"), {
    target: { value: "6200.25" },
  });
  fireEvent.change(screen.getByLabelText(/Warehouse stock/), {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByLabelText("Box count"), {
    target: { value: "2" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Save offer settings, prices and stock" })
      .closest("form")!,
  );
  await waitFor(() =>
    expect(setAttribute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "owner",
        data: expect.objectContaining({
          owner: { type: "offer", id: "offer" },
          key: "stock_quantity",
          number: "2",
        }),
      }),
    ),
  );
  expect(setAttribute).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        key: "price",
        number: "6200.25",
        currencyId: "rub",
      }),
    }),
  );
  expect(updateOffer).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "owner",
      data: expect.objectContaining({
        entity: "stores-to-products",
        method: "PATCH",
        recordId: "offer",
        data: expect.objectContaining({
          settings: expect.objectContaining({
            packages: [expect.objectContaining({ count: 2, weight_kg: "30" })],
          }),
        }),
      }),
    }),
  );
});

test("the product owner can save a product quantity limit from the seller catalogue", async () => {
  const refresh = openEditor({ ...context, ownedProductIds: ["product"] });
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Limit to one unit per order" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Save product quantity limit" }),
  );
  await screen.findByText("Product quantity limit saved.");
  expect(updateProduct).toHaveBeenCalledWith({
    id: "owner",
    data: {
      entity: "products",
      method: "PATCH",
      recordId: "product",
      data: { singleUnitPerOrder: true },
    },
  });
  expect(updateOffer).not.toHaveBeenCalled();
  expect(refresh).toHaveBeenCalled();
});

test("unlimited stock removes the stock attribute while archiving only changes availability", async () => {
  const refresh = openEditor();
  fireEvent.click(screen.getByLabelText("Unlimited stock"));
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Save offer settings, prices and stock" })
      .closest("form")!,
  );
  await waitFor(() =>
    expect(deleteAttribute).toHaveBeenCalledWith({
      id: "owner",
      data: { entity: "attributes", method: "DELETE", recordId: "stock" },
    }),
  );
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  jest.clearAllMocks();
  fireEvent.click(screen.getByRole("button", { name: "Stop new sales" }));
  await waitFor(() =>
    expect(updateOffer).toHaveBeenCalledWith({
      id: "owner",
      data: {
        entity: "stores-to-products",
        method: "PATCH",
        recordId: "offer",
        data: { variant: "hidden" },
      },
    }),
  );
  expect(setAttribute).not.toHaveBeenCalled();
  expect(deleteAttribute).not.toHaveBeenCalled();
});

test("a store selling another owner's product cannot edit its delivery and add-on links", () => {
  openEditor();
  expect(
    (
      screen.getByRole("option", {
        name: "Shared Product · owner only",
      }) as HTMLOptionElement
    ).disabled,
  ).toBe(true);
  expect(screen.queryByRole("button", { name: "Add service link" })).toBeNull();
});

test("the product owner can link a contractor's offer to the product", async () => {
  openEditor({ ...context, ownedProductIds: ["product"] });
  fireEvent.change(screen.getByLabelText("Target offer"), {
    target: { value: "delivery" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Add service link" }).closest("form")!,
  );
  await waitFor(() =>
    expect(createLink).toHaveBeenCalledWith({
      id: "owner",
      data: {
        entity: "offers-to-offers",
        method: "POST",
        data: {
          sourceOfferId: "offer",
          targetOfferId: "delivery",
          variant: "delivery",
          recurrence: "first",
        },
      },
    }),
  );
});
