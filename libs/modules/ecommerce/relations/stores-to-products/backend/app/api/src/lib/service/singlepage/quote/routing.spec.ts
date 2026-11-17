import {
  deliveryRouting,
  GeoapifyRouting,
  QuoteRoutes,
  type IDeliveryRouting,
} from "./routing";

const origin = { latitude: 59, longitude: 30 };
const destination = { latitude: 60, longitude: 31, regions: ["SPB"] };

it("selects the configured project adapter and reuses verified distances under lock", async () => {
  const previous = process.env.DELIVERY_ROUTING_PROVIDER;
  try {
    process.env.DELIVERY_ROUTING_PROVIDER = "project";
    const adapter: jest.Mocked<IDeliveryRouting> = {
      geocode: jest.fn().mockResolvedValue(destination),
      distance: jest.fn().mockResolvedValue(24000),
    };
    const routes = new QuoteRoutes(() => deliveryRouting({ project: adapter }));
    const point = await routes.geocode("address");
    expect(await routes.distance(origin, point, "drive")).toBe(24000);
    routes.freeze();
    expect(await routes.geocode("address")).toEqual(point);
    expect(await routes.distance(origin, point, "drive")).toBe(24000);
    await expect(routes.geocode("changed address")).rejects.toThrow(
      "new quote",
    );
    await expect(routes.distance(origin, point, "truck")).rejects.toThrow(
      "new quote",
    );
    expect(adapter.geocode).toHaveBeenCalledTimes(1);
    expect(adapter.distance).toHaveBeenCalledTimes(1);
    expect(() => deliveryRouting({})).toThrow(
      "Unknown delivery routing provider",
    );
  } finally {
    if (previous === undefined) {
      delete process.env.DELIVERY_ROUTING_PROVIDER;
    } else {
      process.env.DELIVERY_ROUTING_PROVIDER = previous;
    }
  }
});

describe("Geoapify address suggestions", () => {
  let provider: GeoapifyRouting;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  beforeEach(() => {
    provider = new GeoapifyRouting(() => "server-key");
    fetchMock = jest.spyOn(global, "fetch");
  });
  afterEach(() => fetchMock.mockRestore());

  it("uses autocomplete, filters formatted regional matches and avoids caching private searches", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              formatted: " Main Street 1 ",
              city: "City",
              datasource: { sourcename: "openaddresses" },
            },
            { formatted: "main street 1", city: "City" },
            { formatted: "Elsewhere 2", city: "Other" },
            { formatted: "Main Street 3", city: "City" },
            { formatted: "X", city: "City" },
          ],
        }),
      ),
    );
    const signal = new AbortController().signal;
    const result = await provider.suggestAddresses(
      "Main",
      "EN",
      ["City"],
      signal,
    );
    expect(result.suggestions).toEqual(["Main Street 1", "Main Street 3"]);
    expect(result.attribution).toEqual(
      expect.arrayContaining([
        { label: "Powered by Geoapify", url: "https://www.geoapify.com/" },
        {
          label: "© OpenStreetMap contributors",
          url: "https://www.openstreetmap.org/copyright",
        },
        {
          label: "© OpenAddresses contributors",
          url: "https://openaddresses.io/",
        },
      ]),
    );
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/v1/geocode/autocomplete");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      text: "Main",
      lang: "en",
      limit: "5",
      format: "json",
      apiKey: "server-key",
    });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      cache: "no-store",
      redirect: "error",
      signal: expect.any(AbortSignal),
    });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ results: [] })));
    await provider.suggestAddresses("Main", "en", ["City"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("limits results and suppresses provider failures containing request credentials", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: Array.from({ length: 8 }, (_, index) => ({
            formatted: `Street ${index}`,
          })),
        }),
      ),
    );
    expect(
      (await provider.suggestAddresses("Street", "en")).suggestions,
    ).toHaveLength(5);
    fetchMock.mockRejectedValue(
      new Error("https://provider/?apiKey=secret&text=address"),
    );
    await expect(provider.suggestAddresses("Street", "en")).rejects.toThrow(
      "Delivery address suggestions are unavailable",
    );
  });
  it("uses the same region fields and exact values as delivery geocoding and pricing", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            { formatted: "Wrong case", city: "city" },
            { formatted: "County only", county: "City", county_code: "City" },
            { formatted: "Extra whitespace", state: "City " },
            { formatted: "Allowed address", city: "City" },
          ],
        }),
      ),
    );
    const result = await provider.suggestAddresses("Street", "en", ["City"]);
    expect(result.suggestions).toEqual(["Allowed address"]);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              lat: 60,
              lon: 30,
              city: "City",
              county: "County",
              country_code: "ru",
            },
          ],
        }),
      ),
    );
    const location = await provider.geocode("Allowed address");
    expect(location.regions).toEqual(["City", "ru"]);
    expect(location.regions.includes("City")).toBe(true);
  });
  it("propagates cancellation to the provider request", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      async (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
    );
    const promise = provider.suggestAddresses(
      "Street",
      "en",
      [],
      controller.signal,
    );
    controller.abort();
    await expect(promise).rejects.toThrow(
      "Delivery address suggestions are unavailable",
    );
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
});
