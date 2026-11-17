import { deliveryRouting, QuoteRoutes, type IDeliveryRouting } from "./routing";

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
