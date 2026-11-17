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
  },
}));
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: { update: () => ({ mutateAsync: updateOffer, isPending: false }) },
}));
jest.mock("@sps/ecommerce/models/attribute/sdk/client", () => ({
  api: { delete: () => ({ mutateAsync: deleteAttribute, isPending: false }) },
}));
jest.mock("@sps/ecommerce/relations/offers-to-offers/sdk/client", () => ({
  api: {
    create: () => ({ mutateAsync: createLink, isPending: false }),
    delete: () => ({ mutateAsync: deleteLink, isPending: false }),
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
    { id: "product", title: { en: "Wardrobe" }, kind: "physical" },
    { id: "delivery-product", title: { en: "Delivery" }, kind: "service" },
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
      storeId: "store",
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
    setAttribute,
    deleteAttribute,
    createLink,
    deleteLink,
  ]) {
    action.mockResolvedValue({ id: "stored" });
  }
});
afterEach(cleanup);
function openEditor() {
  const refresh = jest.fn().mockResolvedValue(undefined);
  render(
    <Editor
      subjectId="owner"
      storeId="store"
      context={context}
      onRefresh={refresh}
    />,
  );
  fireEvent.click(screen.getByText("Edit existing offers, rates and services"));
  return refresh;
}

test("editing an offer sends its actual price, stock and packaging through the owning SDKs", async () => {
  openEditor();
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
      id: "offer",
      data: expect.objectContaining({
        settings: expect.objectContaining({
          packages: [expect.objectContaining({ count: 2, weight_kg: "30" })],
        }),
      }),
    }),
  );
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
    expect(deleteAttribute).toHaveBeenCalledWith({ id: "stock" }),
  );
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  jest.clearAllMocks();
  fireEvent.click(screen.getByRole("button", { name: "Stop new sales" }));
  await waitFor(() =>
    expect(updateOffer).toHaveBeenCalledWith({
      id: "offer",
      data: { variant: "hidden" },
    }),
  );
  expect(setAttribute).not.toHaveBeenCalled();
  expect(deleteAttribute).not.toHaveBeenCalled();
});

test("service editor uses the selected source and excludes shared Product editing for another owner", async () => {
  openEditor();
  expect(
    (
      screen.getByRole("option", {
        name: "Shared Product · owner only",
      }) as HTMLOptionElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Target offer"), {
    target: { value: "delivery" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Add service link" }).closest("form")!,
  );
  await waitFor(() =>
    expect(createLink).toHaveBeenCalledWith({
      data: {
        sourceOfferId: "offer",
        targetOfferId: "delivery",
        variant: "delivery",
        recurrence: "first",
      },
    }),
  );
});
