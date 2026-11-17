import { Service } from "./address-suggestions";
import type { IDeliveryRouting } from "./quote/routing";

const suggestAddresses = jest.fn();
const addressSuggestionsOffer = jest.fn();
const routing = jest.fn();
const offer = {
  id: "shipping",
  productId: "delivery",
  variant: "default",
  settings: { receiptMethod: "shipping", regionIds: ["city"] },
};
const product = { id: "delivery", kind: "service", variant: "default" };
const input = { offerId: "shipping", query: "  Main Street  ", language: "EN" };
const service = new Service({
  catalog: { addressSuggestionsOffer },
  routing,
});
beforeEach(() => {
  jest.clearAllMocks();
  addressSuggestionsOffer.mockResolvedValue({
    offer,
    product,
    hasDeliveryLink: false,
  });
  routing.mockReturnValue({ suggestAddresses });
  suggestAddresses.mockResolvedValue({
    suggestions: [" Main Street 1 ", "main street 1", "", "X"],
    attribution: [{ label: "Project provider", url: "https://example.com/" }],
  });
});
it("uses the selected shipping service's regions, filters duplicates and carries adapter attribution", async () => {
  const signal = new AbortController().signal;
  expect(await service.execute(input, signal)).toEqual({
    suggestions: ["Main Street 1"],
    attribution: [{ label: "Project provider", url: "https://example.com/" }],
  });
  expect(suggestAddresses).toHaveBeenCalledWith(
    "Main Street",
    "en",
    ["city"],
    signal,
  );
  expect(addressSuggestionsOffer).toHaveBeenCalledWith("shipping");
});
it("bounds results even when a custom adapter returns more than five", async () => {
  suggestAddresses.mockResolvedValue({
    suggestions: Array.from(
      { length: 9 },
      (_, index) => `Main Street ${index}`,
    ),
  });
  expect((await service.execute(input)).suggestions).toHaveLength(5);
});
it("supports existing adapters without autocomplete", async () => {
  routing.mockReturnValue({
    geocode: jest.fn(),
    distance: jest.fn(),
  } satisfies IDeliveryRouting);
  expect(await service.execute(input)).toEqual({ suggestions: [] });
});
it("recognizes an unset receipt method only through an actual delivery link", async () => {
  addressSuggestionsOffer.mockResolvedValue({
    offer: { ...offer, settings: {} },
    product,
    hasDeliveryLink: false,
  });
  await expect(service.execute(input)).rejects.toThrow(
    "Shipping offer is unavailable",
  );
  addressSuggestionsOffer.mockResolvedValue({
    offer: { ...offer, settings: {} },
    product,
    hasDeliveryLink: true,
  });
  await expect(service.execute(input)).resolves.toMatchObject({
    suggestions: ["Main Street 1"],
  });
});
it.each([
  { offer: { ...offer, variant: "hidden" }, product },
  { offer, product: { ...product, variant: "hidden" } },
  { offer, product: { ...product, kind: "physical" } },
  { offer: { ...offer, settings: { receiptMethod: "pickup" } }, product },
])(
  "refuses unavailable or non-shipping offers before contacting the adapter",
  async (entry) => {
    addressSuggestionsOffer.mockResolvedValue({
      ...entry,
      hasDeliveryLink: false,
    });
    await expect(service.execute(input)).rejects.toThrow(
      "Shipping offer is unavailable",
    );
    expect(routing).not.toHaveBeenCalled();
  },
);
it.each([{ query: "ab" }, { query: "x".repeat(501) }, { language: "en_US" }])(
  "validates before reading an offer",
  async (override) => {
    await expect(service.execute({ ...input, ...override })).rejects.toThrow(
      "Invalid address suggestions request",
    );
    expect(addressSuggestionsOffer).not.toHaveBeenCalled();
  },
);
it("does not return provider error URLs containing credentials or the search text", async () => {
  suggestAddresses.mockRejectedValue(
    new Error("https://provider.example/?apiKey=secret&text=private-address"),
  );
  await expect(service.execute(input)).rejects.toThrow(
    "Delivery address suggestions are unavailable",
  );
});
