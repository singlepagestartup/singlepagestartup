/**
 * BDD Suite: subject controller route guards.
 *
 * Given: the subject controller's route table mounted the way the module app mounts it.
 * When: a caller requests a chat model catalog or starts an ecommerce checkout.
 * Then: each route checks ownership before invoking the requested service.
 */

import { OPEN_ROUTER_ASSISTANT_MODEL } from "@sps/shared-utils";

const mockOpenRouterGetModels = jest.fn();
const mockSubjectsToSocialModuleProfilesFind = jest.fn();
const mockSocialModuleProfileFindById = jest.fn();

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_JWT_SECRET: "test-jwt-secret",
    RBAC_SECRET_KEY: "test-rbac-secret-key",
  };
});

jest.mock("@sps/shared-third-parties", () => {
  const actual = jest.requireActual("@sps/shared-third-parties");

  return {
    ...actual,
    OpenRouter: jest.fn(() => {
      return {
        getModels: mockOpenRouterGetModels,
      };
    }),
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

async function requestCatalog(subjectId?: string) {
  const headers: Record<string, string> = {};

  if (subjectId) {
    const token = await signJwt(
      { subjectId, type: "access", lifetimeInSeconds: 60 },
      "test-jwt-secret",
    );

    headers["Authorization"] = `Bearer ${token}`;
  }

  return createApp().request(catalogPath, { headers });
}

describe("Given: the OpenRouter model catalog route of a chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenRouterGetModels.mockResolvedValue([
      {
        id: OPEN_ROUTER_ASSISTANT_MODEL.id,
        name: "GPT Basic",
        description: "",
        architecture: {
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
      },
    ]);
    mockSubjectsToSocialModuleProfilesFind.mockResolvedValue([
      { id: "subject-owner-profile", subjectId: "subject-owner" },
    ]);
    mockSocialModuleProfileFindById.mockResolvedValue({ id: "profile-owned" });
  });

  /**
   * BDD Scenario
   * Given: a request without a token.
   * When: the catalog is requested.
   * Then: it is refused and OpenRouter is not asked.
   */
  it("When: no token is sent Then: refuses the request before OpenRouter", async () => {
    const response = await requestCatalog();

    expect(response.status).toBe(400);
    expect(mockOpenRouterGetModels).not.toHaveBeenCalled();
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
    expect(mockOpenRouterGetModels).not.toHaveBeenCalled();
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
    expect(mockOpenRouterGetModels).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the owner's token and a profile linked to the owner.
   * When: the catalog is requested.
   * Then: it answers the grouped OpenRouter catalog.
   */
  it("When: the owner asks through an owned profile Then: returns the catalog", async () => {
    const response = await requestCatalog("subject-owner");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockOpenRouterGetModels).toHaveBeenCalledTimes(1);
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
