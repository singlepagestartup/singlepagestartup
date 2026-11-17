import { Hono } from "hono";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import type * as SharedFrontendClientApi from "@sps/shared-frontend-client-api";
import { Service } from "./checkout";
import {
  createConsistencyRuntime,
  consistencyContext,
} from "@sps/shared-backend-api";
import { Middleware as RevalidationMiddleware } from "../../../../../../../../../../../../../middlewares/src/lib/revalidation";

let mockApp: Hono;
let mockSubscribers: Array<(state: unknown) => void> = [];
const mockBroadcast = jest.fn((event) => {
  for (const callback of mockSubscribers)
    callback({ getActionsFromStoreByName: () => [{ result: event }] });
});
const mockValues = new Map<string, string>();
jest.mock("@sps/providers-kv", () => ({
  Provider: class {
    async get({ prefix, key }: any) {
      return mockValues.get(prefix + key);
    }
    async set({ prefix, key, value }: any) {
      mockValues.set(prefix + key, value);
    }
  },
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));
jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  websocketManager: {
    broadcastMessage: (...args: any[]) => (mockBroadcast as any)(...args),
  },
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {
    subscribe: (callback: (state: unknown) => void) => {
      mockSubscribers.push(callback);
      return () => {
        mockSubscribers = mockSubscribers.filter((value) => value !== callback);
      };
    },
    getState: () => ({ addAction: jest.fn() }),
  },
}));
it("reconciles both legacy clients after exact-offer Product checkout through the API", async () => {
  mockValues.clear();
  const dependency = "public.fixture|collection|0";
  let generation = "0";
  const runtime = createConsistencyRuntime({
    store: {
      status: async () => ({ epoch: "test" }),
      versions: async () => ({ [dependency]: generation }),
      covered: async () => true,
      register: async () => ({
        protocol: 1,
        ref: "ref",
        epoch: "test",
        cursor: "0",
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      }),
    } as any,
    verifyAuthorization: async () => {},
  });
  const revalidation = new RevalidationMiddleware();
  revalidation.revalidateTags = jest.fn();
  mockApp = new Hono();
  mockApp.use(runtime.middleware());
  mockApp.use(revalidation.init());
  mockApp.use(runtime.cache());
  const id = "303302a0-4eb7-4cef-af04-74d7e8e72442";
  const orders: { id: string }[] = [];
  const reads = jest.fn((c: any) => {
    consistencyContext.getStore()!.dependencies.set(dependency, generation);
    return c.json({ data: [...orders] });
  });
  mockApp.get("/api/ecommerce/orders", reads);

  const route = "/api/ecommerce/orders";
  const rpc =
    "/api/rbac/subjects/303302a0-4eb7-4cef-af04-74d7e8e72442/ecommerce-module/products/303302a0-4eb7-4cef-af04-74d7e8e72442/checkout";
  mockApp.post(rpc, async (c) => {
    const result = await service.execute({
      id: "subject",
      productId: "product",
      data: {
        provider: "dummy",
        storeId: "store",
        billingModule: { currency: { id: "currency" } },
      },
    });
    return c.json({ data: result });
  });

  const clients = [new QueryClient(), new QueryClient()];
  const cleanups: Array<() => void> = [];
  for (const client of clients) {
    const options = {
      queryKey: [route],
      queryFn: async () =>
        ((await (await mockApp.request(route)).json()) as any).data,
      staleTime: Infinity,
      meta: { topics: ["ecommerce.orders"] },
    };
    await client.prefetchQuery(options);
    cleanups.push(
      new QueryObserver(client, options).subscribe(() => undefined),
    );
    // Browsers have separate module runtimes, so each client owns its subscription registry.
    jest.isolateModules(() => {
      const { subscription } = jest.requireActual<
        typeof SharedFrontendClientApi
      >("@sps/shared-frontend-client-api");
      cleanups.push(subscription(route, client));
    });
  }
  expect(reads).toHaveBeenCalledTimes(1);
  await new Promise((resolve) => setTimeout(resolve, 5));
  const find = jest.fn(async () => []);
  const service = new Service({
    findById: jest.fn(async () => ({ id: "subject" })),
    subjectsToIdentities: {
      find: jest.fn(async () => [{ identityId: "identity" }]),
    },
    billingModule: {
      paymentIntent: { isProviderAllowed: jest.fn(() => true) },
      currency: {
        findById: jest.fn(async () => ({
          id: "currency",
          slug: "usd",
          minorUnitDigits: 2,
        })),
      },
    },
    ecommerceModule: {
      product: {
        findById: jest.fn(async () => ({
          id: "product",
          slug: "fixture-product",
        })),
      },
      storesToProducts: {
        offersForProduct: jest.fn(async () => [
          { id: "offer", productId: "product", storeId: "store" },
        ]),
        quote: jest.fn(async () => ({
          amount: "100",
          currencyIds: ["currency"],
          issues: [],
        })),
      },
    },
    ecommerceModuleOrderCreate: jest.fn(async () => {
      orders.push({ id });
      generation = String(Number(generation) + 1);
      return { orderId: id, lineId: "line" };
    }),
    ecommerceOrderCheckout: jest.fn(async () => ({
      billingModule: { invoices: [] },
    })),
  } as any);
  try {
    const response = await mockApp.request(rpc, { method: "POST" });
    expect(response.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 250));
    for (const client of clients)
      expect(client.getQueryData([route])).toEqual([{ id }]);
    expect(reads).toHaveBeenCalledTimes(2);
    expect(mockBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        topics: expect.arrayContaining(["ecommerce.orders"]),
      }),
    );
    expect(await (await mockApp.request(route)).json()).toEqual({
      data: [{ id }],
    });
  } finally {
    cleanups.forEach((cleanup) => cleanup());
    clients.forEach((client) => client.clear());
  }
});
