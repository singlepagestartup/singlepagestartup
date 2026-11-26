/**
 * BDD Suite: subject controller route guards.
 *
 * Given: the subject controller's route table mounted the way the module app mounts it.
 * When: a caller requests a chat model catalog, order lines or an ecommerce checkout.
 * Then: each route checks ownership before invoking the requested service.
 */

import { OPEN_ROUTER_ASSISTANT_MODEL } from "@sps/shared-utils";

const mockChatModels = jest.fn();
const mockSubjectsToSocialModuleProfilesFind = jest.fn();
const mockSocialModuleProfileFindById = jest.fn();

jest.mock("@sps/shared-backend-api", () => ({
  ...jest.requireActual("@sps/shared-backend-api"),
  withConsistencySnapshot: (read: () => Promise<unknown>) => read(),
}));

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_JWT_SECRET: "test-jwt-secret",
    RBAC_SECRET_KEY: "test-rbac-secret-key",
  };
});

jest.mock(
  "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server",
  () => ({
    api: {
      find: (...args: unknown[]) =>
        mockSubjectsToSocialModuleProfilesFind(...args),
    },
  }),
);

jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) => mockSocialModuleProfileFindById(...args),
  },
}));

import { signJwt } from "@sps/backend-utils";
import { DefaultApp } from "@sps/shared-backend-api";
import { Controller } from ".";
import { Handler as ModelFavorites } from "./social-module/profile/find-by-id/chat/find-by-id/openrouter/model-favorites";

const catalogPath =
  "/subject-owner/social-module/profiles/profile-owned/chats/chat-1/openrouter/models";

function createApp(service = {}) {
  const app = new DefaultApp(
    {} as any,
    new Controller(service as any) as any,
    {} as any,
  );

  app.useRoutes();

  return app.hono;
}

async function createHeaders(subjectId?: string) {
  const headers: Record<string, string> = {};

  if (subjectId) {
    const token = await signJwt(
      { subjectId, type: "access", lifetimeInSeconds: 60 },
      "test-jwt-secret",
    );

    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function requestCatalog(subjectId?: string) {
  return createApp({
    providerConnections: { chatModels: mockChatModels },
    customerWork: { assertChatAccess: jest.fn().mockResolvedValue(undefined) },
  }).request(catalogPath, {
    headers: await createHeaders(subjectId),
  });
}

describe("Given: the OpenRouter model catalog route of a chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatModels.mockResolvedValue({
      groups: [
        { id: "text", models: [{ id: OPEN_ROUTER_ASSISTANT_MODEL.id }] },
      ],
    });
    mockSubjectsToSocialModuleProfilesFind.mockResolvedValue([
      { id: "subject-owner-profile", subjectId: "subject-owner" },
    ]);
    mockSocialModuleProfileFindById.mockResolvedValue({ id: "profile-owned" });
  });

  it("publishes typing only for the signed-in profile in an accessible thread", async () => {
    const thread = {
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
    };
    const checkThread = jest.fn();
    const assertChatAccess = jest.fn();
    const profilesToChats = {
      find: jest.fn().mockResolvedValue([{ id: "membership" }]),
    };
    const threadsToActions = {
      withTypingAction: jest.fn((_thread, _profile, callback) =>
        callback(null),
      ),
    };
    const app = createApp({
      customerWork: { assertChatAccess },
      isAuthorizedService: {
        getSubjectId: jest.fn().mockResolvedValue("subject-owner"),
      },
      socialModuleChatLifecycleAssertThreadBelongsToChat: checkThread,
      modules: { social: { profilesToChats, threadsToActions } },
    });
    const path = catalogPath.replace(
      "/openrouter/models",
      "/threads/thread-1/typing",
    );
    const body = new FormData();
    body.set(
      "data",
      JSON.stringify({
        active: false,
        sessionId: "123e4567-e89b-42d3-a456-426614174000",
      }),
    );
    const other = await app.request(path, {
      method: "POST",
      headers: await createHeaders("other-subject"),
      body,
    });
    expect(other.status).toBe(401);
    expect(checkThread).not.toHaveBeenCalled();
    const response = await app.request(path, {
      method: "POST",
      headers: await createHeaders("subject-owner"),
      body,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { active: false } });
    expect(checkThread).toHaveBeenCalledWith(thread);
    expect(assertChatAccess).toHaveBeenCalledWith({
      subjectId: "subject-owner",
      chatId: "chat-1",
      threadId: "thread-1",
      edit: false,
    });
  });

  it("persists a customer's favorites with read access to the order chat", async () => {
    const assertChatAccess = jest.fn().mockResolvedValue(undefined);
    let savedValue: string | undefined;
    const kv = {
      get: jest.fn(async () => savedValue),
      set: jest.fn(async ({ value }: { value: string }) => {
        savedValue = value;
        return "OK";
      }),
    };
    const execute = ModelFavorites.prototype.execute;
    const run = jest
      .spyOn(ModelFavorites.prototype, "execute")
      .mockImplementation((context, next) =>
        execute.call(
          new ModelFavorites(
            {} as ConstructorParameters<typeof ModelFavorites>[0],
            async () => kv,
          ),
          context,
          next,
        ),
      );

    try {
      const app = createApp({
        customerWork: { assertChatAccess },
        isAuthorizedService: {
          getSubjectId: jest.fn().mockResolvedValue("subject-owner"),
        },
      });
      const path = catalogPath.replace("/models", "/model-favorites");
      const headers = await createHeaders("subject-owner");
      const data = { favoriteModelIds: ["openai/gpt-5.2"] };
      const saved = await app.request(path, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      expect(saved.status).toBe(200);
      expect(kv.set).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "subject-owner",
          value: JSON.stringify(data),
        }),
      );
      const restored = await app.request(path, { headers });
      expect(restored.status).toBe(200);
      expect(restored.headers.get("Cache-Control")).toBe("private, no-store");
      await expect(restored.json()).resolves.toEqual({ data });
      expect(kv.get).toHaveBeenCalledWith(
        expect.objectContaining({ key: "subject-owner" }),
      );
      expect(assertChatAccess).toHaveBeenCalledWith({
        subjectId: "subject-owner",
        chatId: "chat-1",
        edit: false,
      });
      expect(assertChatAccess).not.toHaveBeenCalledWith(
        expect.objectContaining({ edit: true }),
      );
    } finally {
      run.mockRestore();
    }
  });

  it.each(["GET", "PATCH"])(
    "refuses cross-subject model favorites via %s",
    async (method) => {
      const assertChatAccess = jest.fn();
      const response = await createApp({
        customerWork: { assertChatAccess },
      }).request(catalogPath.replace("/models", "/model-favorites"), {
        method,
        headers: await createHeaders("other-subject"),
      });
      expect(response.status).toBe(401);
      expect(assertChatAccess).not.toHaveBeenCalled();
    },
  );

  /**
   * BDD Scenario
   * Given: a request without a token.
   * When: the catalog is requested.
   * Then: it is refused and OpenRouter is not asked.
   */
  it("When: no token is sent Then: refuses the request before OpenRouter", async () => {
    const response = await requestCatalog();

    expect(response.status).toBe(400);
    expect(mockChatModels).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a token issued to another subject.
   * When: that subject requests the owner's catalog route.
   * Then: it is refused and OpenRouter is not asked.
   */
  it("When: another subject asks Then: refuses the request before OpenRouter", async () => {
    const response = await requestCatalog("subject-other");

    expect(response.status).toBe(401);
    expect(mockChatModels).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the owner's token and a profile the owner is not linked to.
   * When: the catalog is requested through that profile.
   * Then: it is refused and OpenRouter is not asked.
   */
  it("When: the profile belongs to someone else Then: refuses the request before OpenRouter", async () => {
    mockSubjectsToSocialModuleProfilesFind.mockResolvedValue([]);

    const response = await requestCatalog("subject-owner");

    expect(response.status).toBe(404);
    expect(mockChatModels).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the owner's token and a profile linked to the owner.
   * When: the catalog is requested.
   * Then: it answers the grouped OpenRouter catalog.
   */
  it("When: the owner asks through an owned profile Then: returns the catalog", async () => {
    const response = await requestCatalog("subject-owner");
    if (!response.ok)
      throw new Error(
        `Catalog returned ${response.status} ${await response.text()}`,
      );
    const body = await response.json();
    expect(mockChatModels).toHaveBeenCalledWith(
      "subject-owner",
      "profile-owned",
      "chat-1",
    );
    expect(body.data.groups[0].models).toEqual([
      expect.objectContaining({ id: OPEN_ROUTER_ASSISTANT_MODEL.id }),
    ]);
  });
});

const checkoutSubjectId = "subject-owner";

describe.each([
  {
    name: "order checkout",
    route: `/${checkoutSubjectId}/ecommerce-module/orders/checkout`,
    data: {
      provider: "dummy",
      email: "owner@example.test",
      ecommerceModule: {
        orders: [{ id: "00000000-0000-4000-8000-000000000001" }],
      },
    },
    lookup: "findById" as const,
  },
  {
    name: "product checkout",
    route: `/${checkoutSubjectId}/ecommerce-module/products/product-1/checkout`,
    data: {
      provider: "dummy",
      email: "owner@example.test",
      storeId: "store-1",
    },
    lookup: "ecommerceProductCheckout" as const,
  },
])("Given: the Subject $name route", ({ route, data, lookup }) => {
  function createService() {
    return {
      findById: jest.fn().mockResolvedValue(null),
      ecommerceProductCheckout: jest
        .fn()
        .mockRejectedValue(new Error("Not Found error. No product")),
    };
  }

  function requestCheckout(
    service: ReturnType<typeof createService>,
    headers: Record<string, string>,
  ) {
    const body = new FormData();
    body.set("data", JSON.stringify(data));
    return createApp(service).request(route, { method: "POST", headers, body });
  }

  it.each([
    { name: "no credential", headers: {} },
    {
      name: "only the operator secret",
      headers: { "X-RBAC-SECRET-KEY": "test-rbac-secret-key" },
    },
  ] as const)(
    "When: the client sends $name Then: refuses checkout before the handler",
    async ({ headers }) => {
      const service = createService();
      const response = await requestCheckout(service, { ...headers });

      expect(response.status).toBe(400);
      expect(service[lookup]).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      name: "another subject's access token",
      subjectId: "subject-other",
      type: "access" as const,
    },
    {
      name: "the owner's refresh token",
      subjectId: checkoutSubjectId,
      type: "refresh" as const,
    },
  ])(
    "When: the client sends $name Then: refuses checkout before the handler",
    async ({ subjectId, type }) => {
      const service = createService();
      const token = await signJwt(
        { subjectId, type, lifetimeInSeconds: 60 },
        "test-jwt-secret",
      );
      const response = await requestCheckout(service, {
        Authorization: `Bearer ${token}`,
      });

      expect(response.status).toBe(401);
      expect(service[lookup]).not.toHaveBeenCalled();
    },
  );

  it("When: the owner sends an access token Then: the handler looks up that Subject's checkout", async () => {
    const service = createService();
    const token = await signJwt(
      { subjectId: checkoutSubjectId, type: "access", lifetimeInSeconds: 60 },
      "test-jwt-secret",
    );
    const response = await requestCheckout(service, {
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(404);
    expect(service[lookup]).toHaveBeenCalledWith(
      expect.objectContaining({ id: checkoutSubjectId }),
    );
  });
});

describe("Given: the order lines route of a subject", () => {
  const ordersToProductsPath =
    "/subject-owner/ecommerce-module/orders-to-products";
  const mockEcommerceOrdersToProductsList = jest.fn();

  async function requestOrdersToProducts(subjectId?: string) {
    return createApp({
      ecommerceOrdersToProductsList: mockEcommerceOrdersToProductsList,
    }).request(ordersToProductsPath, {
      headers: await createHeaders(subjectId),
    });
  }

  beforeEach(() => {
    mockEcommerceOrdersToProductsList.mockReset();
    mockEcommerceOrdersToProductsList.mockResolvedValue([
      {
        id: "line-1",
        orderId: "order-1",
        productId: "product-1",
        quantity: 1,
        total: [],
      },
    ]);
  });

  /**
   * BDD Scenario
   * Given: a request without a token.
   * When: the lines of the owner's orders are requested.
   * Then: it is refused and no line is read.
   */
  it("When: no token is sent Then: refuses the request before reading lines", async () => {
    const response = await requestOrdersToProducts();

    expect(response.status).toBe(400);
    expect(mockEcommerceOrdersToProductsList).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a token issued to another subject.
   * When: that subject requests the owner's order lines.
   * Then: it is refused and no line is read.
   */
  it("When: another subject asks Then: refuses the request before reading lines", async () => {
    const response = await requestOrdersToProducts("subject-other");

    expect(response.status).toBe(401);
    expect(mockEcommerceOrdersToProductsList).not.toHaveBeenCalled();
  });

  it("requires the owner's JWT even when the operator header is present", async () => {
    const response = await createApp({
      ecommerceOrdersToProductsList: mockEcommerceOrdersToProductsList,
    }).request(ordersToProductsPath, {
      headers: { "X-RBAC-SECRET-KEY": "test-rbac-secret-key" },
    });
    expect(response.status).toBe(400);
    expect(mockEcommerceOrdersToProductsList).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the owner's token.
   * When: the owner requests the lines of its orders.
   * Then: the lines of that subject are read and answered.
   */
  it("When: the owner asks Then: returns the lines of its orders", async () => {
    const response = await requestOrdersToProducts("subject-owner");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockEcommerceOrdersToProductsList).toHaveBeenCalledWith(
      expect.objectContaining({ id: "subject-owner" }),
    );
    expect(body.data).toEqual([expect.objectContaining({ id: "line-1" })]);
  });
});
