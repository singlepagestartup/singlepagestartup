import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { CRUDService } from "@sps/shared-backend-api";
import { verifyJwt } from "@sps/backend-utils";
import {
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
} from "@sps/shared-utils";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as SubjectRepository } from "../../../../repository";
import { Configuration as SubjectConfiguration } from "../../../../configuration";
import { Service as Reservations } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";
import { Handler as CatalogHandler } from "../../../../controller/singlepage/ecommerce-module/catalog";
import type { Service as SubjectService } from "../../../../service";
import { Service, type IConstructorProps } from "./index";

const paths: Record<string, string> = {
  stores: "@sps/ecommerce/models/store",
  products: "@sps/ecommerce/models/product",
  attributes: "@sps/ecommerce/models/attribute",
  "attribute-keys": "@sps/ecommerce/models/attribute-key",
  currencies: "@sps/billing/models/currency",
  "stores-to-products": "@sps/ecommerce/relations/stores-to-products",
  "offers-to-offers": "@sps/ecommerce/relations/offers-to-offers",
  "stores-to-attributes": "@sps/ecommerce/relations/stores-to-attributes",
  "products-to-attributes": "@sps/ecommerce/relations/products-to-attributes",
  "stores-to-products-to-attributes":
    "@sps/ecommerce/relations/stores-to-products-to-attributes",
  "attribute-keys-to-attributes":
    "@sps/ecommerce/relations/attribute-keys-to-attributes",
  "attributes-to-billing-module-currencies":
    "@sps/ecommerce/relations/attributes-to-billing-module-currencies",
  "subjects-to-ecommerce-module-stores":
    "@sps/rbac/relations/subjects-to-ecommerce-module-stores",
  "subjects-to-ecommerce-module-products":
    "@sps/rbac/relations/subjects-to-ecommerce-module-products",
  identities: "@sps/rbac/models/identity",
  "subjects-to-identities": "@sps/rbac/relations/subjects-to-identities",
  roles: "@sps/rbac/models/role",
  "subjects-to-roles": "@sps/rbac/relations/subjects-to-roles",
  orders: "@sps/ecommerce/models/order",
  intents: "@sps/billing/models/payment-intent",
  holds: "@sps/ecommerce/relations/orders-to-billing-module-payment-intents",
};
const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  jest.restoreAllMocks();
  for (const remove of cleanup.splice(0).reverse()) {
    await remove();
  }
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture() {
  const suffix = randomUUID();
  const repository = new SubjectRepository(new SubjectConfiguration());
  const people: Record<string, any> = {};
  for (const name of ["alice", "bob", "buyer", "admin"]) {
    const person = await repository.insert({
      slug: `issue414-${name}-${suffix}`,
    });
    people[name] = person;
    cleanup.push(() => repository.deleteFirstByField("id", person.id));
  }
  const entities: Record<string, any> = {};
  const repositories: Record<string, any> = {};
  for (const [name, path] of Object.entries(paths)) {
    const { Repository } = await import(
      `${path}/backend/app/api/src/lib/repository`
    );
    const { Configuration } = await import(
      `${path}/backend/app/api/src/lib/configuration`
    );
    const repo = new Repository(new Configuration());
    repositories[name] = repo;
    const service = new CRUDService(repo);
    const create = service.create.bind(service);
    service.create = async (props: any) => {
      const record = await create(props);
      cleanup.push(async () => {
        if (await repo.findFirstByField("id", record.id)) {
          await repo.deleteFirstByField("id", record.id);
        }
      });
      return record;
    };
    entities[name] = service;
  }
  for (const [name, person] of Object.entries(people)) {
    const identity = await entities.identities.create({
      data: { email: `${name}-${suffix}@example.test` },
    });
    await entities["subjects-to-identities"].create({
      data: { subjectId: person.id, identityId: identity.id },
    });
  }
  const existingAdmin = await entities.roles.find({
    params: {
      filters: { and: [{ column: "slug", method: "eq", value: "admin" }] },
    },
  });
  const role =
    existingAdmin[0] ??
    (await entities.roles.create({
      data: { slug: "admin", title: "Administrator" },
    }));
  await entities["subjects-to-roles"].create({
    data: { subjectId: people.admin.id, roleId: role.id },
  });
  const reservations = new Reservations(
    repositories.holds,
    entities.attributes,
  );
  const service = new Service({
    repository,
    validateWorkTariff: async () => undefined,
    entities: entities as IConstructorProps["entities"],
    isAdmin: async (subjectId) => {
      const links = await entities["subjects-to-roles"].find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: subjectId },
              { column: "roleId", method: "eq", value: role.id },
            ],
          },
        },
      });
      return links.length > 0;
    },
    stock: reservations,
  });
  const store = await entities.stores.create({
    data: { slug: `issue414-store-${suffix}` },
  });
  await entities["subjects-to-ecommerce-module-stores"].create({
    data: {
      subjectId: people.alice.id,
      ecommerceModuleStoreId: store.id,
      variant: "owner",
    },
  });
  const product = await entities.products.create({
    data: { slug: `issue414-product-${suffix}` },
  });
  await entities["subjects-to-ecommerce-module-products"].create({
    data: {
      subjectId: people.bob.id,
      ecommerceModuleProductId: product.id,
      variant: "owner",
    },
  });
  const currency = await entities.currencies.create({
    data: {
      slug: `issue414-currency-${suffix}`,
      title: "Test currency",
      symbol: "test",
    },
  });
  const app = new Hono();
  const subjectService = {
    ecommerceCatalog: service,
    isAuthorizedService: {
      async getSubjectId(token: string) {
        const claims = await verifyJwt(token, RBAC_JWT_SECRET!, {
          type: "access",
        });
        return (claims.subject as { id: string }).id;
      },
    },
    async authenticationMe({ subjectId }: { subjectId: string }) {
      const identities = await entities["subjects-to-identities"].find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: subjectId }],
          },
        },
      });
      return { id: subjectId, authenticated: identities.length > 0 };
    },
  } as unknown as SubjectService;
  app.post("/api/rbac/subjects/:id/ecommerce-module/catalogue-mutations", (c) =>
    new CatalogHandler(subjectService, "mutation").execute(c),
  );
  const tokens: Record<string, string> = {};
  const now = Math.floor(Date.now() / 1000);
  for (const [name, person] of Object.entries(people)) {
    tokens[name] = await sign(
      {
        subject: { id: person.id },
        iat: now,
        exp: now + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
      },
      RBAC_JWT_SECRET!,
      "HS256",
    );
  }
  const request = (
    url: string,
    actor: string,
    method: string,
    data?: unknown,
  ) =>
    app.request(
      `/api/rbac/subjects/${people[actor].id}/ecommerce-module/catalogue-mutations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens[actor]}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            entity: url.split("/")[3],
            recordId: url.split("/")[4],
            method,
            data: data ?? {},
          },
        }),
      },
    );
  return {
    suffix,
    repository,
    entities,
    repositories,
    people,
    service,
    store,
    product,
    currency,
    request,
  };
}

it("rolls back a real new Product/owner/offer/price graph and preserves separate seller ownership", async () => {
  const f = await fixture();
  const slug = `issue414-rollback-${f.suffix}`;
  const fail = jest
    .spyOn(f.entities["stores-to-products-to-attributes"], "create")
    .mockRejectedValueOnce(new Error("fixture relation failure"));
  await expect(
    f.service.createOffer({
      subjectId: f.people.alice.id,
      data: {
        storeId: f.store.id,
        product: {
          slug,
          title: { en: "Wardrobe" },
          kind: "physical",
          formula: "unit_price * quantity",
        },
        prices: [{ currencyId: f.currency.id, amount: "5000" }],
      },
    }),
  ).rejects.toThrow("fixture relation failure");
  expect(
    await f.entities.products.find({
      params: {
        filters: { and: [{ column: "slug", method: "eq", value: slug }] },
      },
    }),
  ).toHaveLength(0);
  fail.mockRestore();
  const result = await f.service.createOffer({
    subjectId: f.people.alice.id,
    data: {
      storeId: f.store.id,
      productId: f.product.id,
      prices: [{ currencyId: f.currency.id, amount: "5000" }],
      stockQuantity: 3,
    },
  });
  expect(result.offer.productId).toBe(f.product.id);
  await expect(
    f.service.assertOwner(f.people.alice.id, "offer", result.offer.id),
  ).resolves.toBeUndefined();
  await expect(
    f.service.assertOwner(f.people.alice.id, "product", f.product.id),
  ).rejects.toThrow("another owner");
  await expect(
    f.service.assertOwner(f.people.bob.id, "product", f.product.id),
  ).resolves.toBeUndefined();
});

it("authenticates Subject Store creation and assigns only the caller’s owner grant", async () => {
  const f = await fixture();
  const response = await f.request("/api/ecommerce/stores", "alice", "POST", {
    slug: `issue414-raw-store-${f.suffix}`,
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { data: { id: string } };
  const grants = await f.entities["subjects-to-ecommerce-module-stores"].find({
    params: {
      filters: {
        and: [
          {
            column: "ecommerceModuleStoreId",
            method: "eq",
            value: body.data.id,
          },
        ],
      },
    },
  });
  expect(grants.map((grant: any) => grant.subjectId)).toEqual([
    f.people.alice.id,
  ]);
});

it("locks real stock rows and rejects cross-owner updates, lowering, deletion and unlinking while held", async () => {
  const f = await fixture();
  const result = await f.service.createOffer({
    subjectId: f.people.alice.id,
    data: {
      productId: f.product.id,
      prices: [{ currencyId: f.currency.id, amount: "5000" }],
      stockQuantity: "3",
    },
  });
  const links = await f.entities["stores-to-products-to-attributes"].find({
    params: {
      filters: {
        and: [
          {
            column: "storesToProductsId",
            method: "eq",
            value: result.offer.id,
          },
        ],
      },
    },
  });
  let stock: any;
  let stockLink: any;
  for (const link of links) {
    const attr = await f.entities.attributes.findById({ id: link.attributeId });
    if (attr.number === "3") {
      stock = attr;
      stockLink = link;
    }
  }
  const order = await f.entities.orders.create({ data: {} });
  const intent = await f.entities.intents.create({ data: { amount: 1 } });
  await f.entities.holds.create({
    data: {
      orderId: order.id,
      billingModulePaymentIntentId: intent.id,
      offerId: result.offer.id,
      reservationQuantity: 2,
      reservationStatus: "held",
    },
  });
  expect(
    (
      await f.request(`/api/ecommerce/attributes/${stock.id}`, "bob", "PATCH", {
        number: "3",
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await f.request(
        `/api/ecommerce/attributes/${stock.id}`,
        "buyer",
        "PATCH",
        { number: "3" },
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await f.request(
        `/api/ecommerce/attributes/${stock.id}`,
        "alice",
        "PATCH",
        { number: "1" },
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await f.request(
        `/api/ecommerce/stores-to-products-to-attributes/${stockLink.id}`,
        "alice",
        "DELETE",
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await f.request(
        `/api/ecommerce/attributes/${stock.id}`,
        "admin",
        "PATCH",
        { number: "2" },
      )
    ).status,
  ).toBe(200);
  expect((await f.entities.attributes.findById({ id: stock.id })).number).toBe(
    "2",
  );
});

it("preserves the normal Product admin metadata conflict check through Subject mutations", async () => {
  const f = await fixture();
  await f.service.mutation({
    subjectId: f.people.admin.id,
    data: {
      entity: "products",
      method: "PATCH",
      recordId: f.product.id,
      data: {
        metadata: { summary: "Current metadata" },
        _expectedMetadata: {},
      },
    },
  });
  await expect(
    f.service.mutation({
      subjectId: f.people.admin.id,
      data: {
        entity: "products",
        method: "PATCH",
        recordId: f.product.id,
        data: { metadata: { summary: "Stale editor" }, _expectedMetadata: {} },
      },
    }),
  ).rejects.toThrow("Metadata changed");
  expect(
    (await f.entities.products.findById({ id: f.product.id })).metadata,
  ).toEqual({ summary: "Current metadata" });
});
