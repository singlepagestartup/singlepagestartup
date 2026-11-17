import { createHash } from "node:crypto";
import type { IOfferDestination } from "@sps/ecommerce/relations/stores-to-products/sdk/model";

type Point = NonNullable<IOfferDestination["coordinates"]>;
export interface IGeocodedAddress extends Point {
  regions: string[];
}
export interface IDeliveryRouting {
  geocode(address: string): Promise<IGeocodedAddress>;
  distance(origin: Point, destination: Point, profile: string): Promise<number>;
}

function validPoint(point: Point) {
  return (
    Number.isFinite(point.latitude) &&
    Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.longitude) <= 180
  );
}

export class GeoapifyRouting implements IDeliveryRouting {
  private readonly cache = new Map<
    string,
    { expires: number; promise: Promise<unknown> }
  >();
  constructor(
    private readonly apiKey: () => string | undefined = () =>
      process.env.GEOAPIFY_API_KEY,
  ) {}

  private async request<T>(
    path: string,
    params: Record<string, string>,
    read: (value: unknown) => T,
  ): Promise<T> {
    const apiKey = this.apiKey();
    if (!apiKey) {
      throw new Error("Delivery routing provider is unavailable");
    }
    const key = createHash("sha256")
      .update(JSON.stringify([path, params]))
      .digest("hex");
    const previous = this.cache.get(key);
    if (previous && previous.expires > Date.now()) {
      return previous.promise as Promise<T>;
    }
    const url = new URL(path, "https://api.geoapify.com");
    url.search = new URLSearchParams({ ...params, apiKey }).toString();
    const promise = (async () => {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(6000),
          redirect: "error",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Routing unavailable");
        }
        return read(await response.json());
      } catch {
        throw new Error("Delivery route could not be verified");
      }
    })();
    if (this.cache.size >= 1000) {
      this.cache.delete(this.cache.keys().next().value!);
    }
    this.cache.set(key, { expires: Date.now() + 5 * 60_000, promise });
    try {
      return await promise;
    } catch (error) {
      if (this.cache.get(key)?.promise === promise) {
        this.cache.delete(key);
      }
      throw error;
    }
  }

  async geocode(address: string) {
    if (!address.trim() || address.length > 500) {
      throw new Error("Invalid delivery address");
    }
    return this.request(
      "/v1/geocode/search",
      { text: address, format: "json", limit: "1" },
      (value) => {
        const entry = (
          value as {
            results?: {
              lat: number;
              lon: number;
              state?: string;
              state_code?: string;
              city?: string;
              country_code?: string;
            }[];
          }
        ).results?.[0];
        if (
          !entry ||
          !validPoint({ latitude: entry.lat, longitude: entry.lon })
        ) {
          throw new Error("No address match");
        }
        return {
          latitude: entry.lat,
          longitude: entry.lon,
          regions: [
            entry.state_code,
            entry.state,
            entry.city,
            entry.country_code,
          ].filter((name): name is string => Boolean(name)),
        };
      },
    );
  }

  async distance(origin: Point, destination: Point, profile: string) {
    if (!validPoint(origin) || !validPoint(destination)) {
      throw new Error("Invalid delivery coordinates");
    }
    return this.request(
      "/v1/routing",
      {
        mode: profile,
        units: "metric",
        waypoints: [origin, destination]
          .map((point) => point.latitude + "," + point.longitude)
          .join("|"),
      },
      (value) => {
        const metres = (
          value as { features?: { properties?: { distance?: number } }[] }
        ).features?.[0]?.properties?.distance;
        if (
          typeof metres !== "number" ||
          !Number.isFinite(metres) ||
          metres < 0
        ) {
          throw new Error("Invalid route distance");
        }
        return metres;
      },
    );
  }
}

const defaultAdapter = new GeoapifyRouting();
export function deliveryRouting(
  adapters: Record<string, IDeliveryRouting> = { geoapify: defaultAdapter },
): IDeliveryRouting {
  const name = process.env.DELIVERY_ROUTING_PROVIDER || "geoapify";
  if (!Object.hasOwn(adapters, name)) {
    throw new Error("Unknown delivery routing provider");
  }
  return adapters[name];
}

export class QuoteRoutes implements IDeliveryRouting {
  private readonly addresses = new Map<string, IGeocodedAddress>();
  private readonly distances = new Map<string, number>();
  private frozen = false;
  constructor(private readonly resolve: () => IDeliveryRouting) {}
  freeze() {
    this.frozen = true;
  }
  async geocode(address: string) {
    const cached = this.addresses.get(address);
    if (cached) {
      return cached;
    }
    if (this.frozen) {
      throw new Error("Delivery conditions changed; request a new quote");
    }
    const point = await this.resolve().geocode(address);
    this.addresses.set(address, point);
    return point;
  }
  async distance(origin: Point, destination: Point, profile: string) {
    const key = JSON.stringify([
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
      profile,
    ]);
    const cached = this.distances.get(key);
    if (cached !== undefined) {
      return cached;
    }
    if (this.frozen) {
      throw new Error("Delivery conditions changed; request a new quote");
    }
    const metres = await this.resolve().distance(origin, destination, profile);
    this.distances.set(key, metres);
    return metres;
  }
}
