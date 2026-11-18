import { randomUUID } from "node:crypto";
import { Service, type IConstructorProps, type IRecord } from "./index";

const owner = randomUUID();
const other = randomUUID();
const admin = randomUUID();
const storeId = randomUUID();
const otherStoreId = randomUUID();
const productId = randomUUID();
const currencyId = randomUUID();
const offerId = randomUUID();

function setup() {
  const tables: Record<string, IRecord[]> = Object.fromEntries(
    [
      "stores",
      "products",
      "attributes",
      "attribute-keys",
      "currencies",
      "stores-to-products",
      "offers-to-offers",
      "stores-to-attributes",
      "products-to-attributes",
      "stores-to-products-to-attributes",
      "attribute-keys-to-attributes",
      "attributes-to-billing-module-currencies",
      "subjects-to-ecommerce-module-stores",
      "subjects-to-ecommerce-module-products",
      "subjects-to-ecommerce-module-orders",
      "orders-to-billing-module-payment-intents",
      "orders-to-products",
    ].map((name) => [name, []]),
  );
  const held: Record<string, number> = {};
  const locks: string[][] = [];
  const dependencies: IConstructorProps = {
    repository: {
      async withCatalogLock(_keys, operation) {
        const previous = structuredClone(tables);
        try {
          return await operation();
        } catch (error) {
          for (const name of Object.keys(tables)) {
            tables[name] = previous[name];
          }
          throw error;
        }
      },
    },
    entities: {},
    isAdmin: async (subjectId) => subjectId === admin,
    stock: {
      async withOfferLocks({ offerIds }, operation) {
        locks.push([...offerIds].sort());
        return operation();
      },
      async reservedQuantities({ offerIds }) {
        return Object.fromEntries(offerIds.map((id) => [id, held[id] ?? 0]));
      },
    },
  };
  for (const name of Object.keys(tables)) {
    dependencies.entities[name] = {
      async find(props) {
        const filters = props?.params?.filters?.and ?? [];
        return tables[name].filter((row) =>
          filters.every((filter: any) =>
            filter.method === "inArray"
              ? filter.value.includes(row[filter.column])
              : JSON.stringify(row[filter.column]) ===
                JSON.stringify(filter.value),
          ),
        );
      },
      async findById({ id }) {
        return tables[name].find((row) => row.id === id);
      },
      async create({ data }) {
        const row = { id: randomUUID(), ...data } as IRecord;
        tables[name].push(row);
        return row;
      },
      async delete({ id }) {
        const index = tables[name].findIndex((row) => row.id === id);
        return tables[name].splice(index, 1)[0];
      },
      async update({ id, data }) {
        const row = tables[name].find((item) => item.id === id)!;
        Object.assign(row, data);
        return row;
      },
    };
  }
  tables.stores.push({ id: storeId }, { id: otherStoreId });
  tables.products.push({ id: productId, title: { en: "Wardrobe" } });
  tables.currencies.push({ id: currencyId });
  tables["subjects-to-ecommerce-module-stores"].push(
    {
      id: randomUUID(),
      subjectId: owner,
      ecommerceModuleStoreId: storeId,
      variant: "owner",
    },
    {
      id: randomUUID(),
      subjectId: other,
      ecommerceModuleStoreId: otherStoreId,
      variant: "owner",
    },
  );
  tables["subjects-to-ecommerce-module-products"].push({
    id: randomUUID(),
    subjectId: other,
    ecommerceModuleProductId: productId,
    variant: "owner",
  });
  tables["stores-to-products"].push({ id: offerId, storeId, productId });
  return {
    service: new Service(dependencies),
    tables,
    held,
    locks,
    dependencies,
  };
}

function stock(tables: Record<string, IRecord[]>, number = "3") {
  const attributeId = randomUUID();
  const keyId = randomUUID();
  const linkId = randomUUID();
  tables.attributes.push({ id: attributeId, number });
  tables["attribute-keys"].push({
    id: keyId,
    slug: "stock_quantity",
    field: "number",
    type: "feature",
  });
  tables["attribute-keys-to-attributes"].push({
    id: randomUUID(),
    attributeId,
    attributeKeyId: keyId,
  });
  tables["stores-to-products-to-attributes"].push({
    id: linkId,
    storesToProductsId: offerId,
    attributeId,
  });
  return { attributeId, keyId, linkId };
}

describe("seller catalogue ownership and atomic writes", () => {
  test("only the product owner or admin can change shared delivery and add-on links", async () => {
    const { service, tables } = setup();
    const targetOfferId = randomUUID();
    const data = { sourceOfferId: offerId, targetOfferId, variant: "delivery" };
    const create = { entity: "offers-to-offers", method: "POST", data };
    const save = jest.fn(async () => undefined);
    await expect(
      service.mutate({ ...create, subjectId: owner }, save),
    ).rejects.toThrow("another owner");
    expect(save).not.toHaveBeenCalled();
    await service.mutate({ ...create, subjectId: other }, save);
    await service.mutate({ ...create, subjectId: admin }, save);
    expect(save).toHaveBeenCalledTimes(2);

    const id = randomUUID();
    tables["offers-to-offers"].push({ id, ...data });
    await expect(
      service.mutate(
        {
          ...create,
          id,
          subjectId: owner,
          method: "PATCH",
          data: { variant: "fulfilled-by" },
        },
        save,
      ),
    ).rejects.toThrow("another owner");
    await expect(
      service.mutate(
        {
          entity: "stores-to-products",
          method: "DELETE",
          subjectId: owner,
          id: offerId,
          data: {},
        },
        save,
      ),
    ).rejects.toThrow("product services");
    expect(save).toHaveBeenCalledTimes(2);
  });
  test("an owner can stop sales with held stock while used offers refuse physical deletion", async () => {
    const { service, tables, held, dependencies } = setup();
    stock(tables, "invalid");
    held[offerId] = 2;
    tables["orders-to-billing-module-payment-intents"].push({
      id: randomUUID(),
      offerId,
      reservationStatus: "held",
    });
    await service.mutate(
      {
        subjectId: owner,
        entity: "stores-to-products",
        id: offerId,
        method: "PATCH",
        data: { variant: "hidden" },
      },
      () =>
        dependencies.entities["stores-to-products"].update({
          id: offerId,
          data: { variant: "hidden" },
        }),
    );
    expect(tables["stores-to-products"][0].variant).toBe("hidden");
    await expect(
      service.mutate(
        {
          subjectId: owner,
          entity: "stores-to-products",
          id: offerId,
          method: "DELETE",
          data: {},
        },
        async () => undefined,
      ),
    ).rejects.toThrow("archived");
  });
  test("store owner creates an offer for another seller’s shared Product without acquiring Product ownership", async () => {
    const { service, tables } = setup();
    const oldSettings = {
      receiptMethod: "pickup" as const,
      pickupPointIds: ["former-collection-point"],
    };
    const result = await service.createOffer({
      subjectId: owner,
      data: {
        productId,
        prices: [{ currencyId, amount: "5000" }],
        stockQuantity: "3",
        settings: oldSettings,
      },
    });
    expect(result.offer.storeId).toBe(storeId);
    expect(result.offer.productId).toBe(productId);
    expect(result.offer.settings).toEqual({ receiptMethod: "pickup" });
    expect(
      tables["subjects-to-ecommerce-module-products"].map(
        (row) => row.subjectId,
      ),
    ).toEqual([other]);
    expect(tables.attributes.map((row) => row.number)).toEqual(["5000", "3"]);
    await expect(
      service.assertOwner(owner, "product", productId),
    ).rejects.toThrow("another owner");
  });

  test("new Product, owner grant, offer and prices roll back when a currency is missing", async () => {
    const { service, tables } = setup();
    const before = structuredClone(tables);
    await expect(
      service.createOffer({
        subjectId: owner,
        data: {
          product: {
            title: { en: "New wardrobe" },
            kind: "physical",
            formula: "unit_price * quantity",
          },
          prices: [{ currencyId: randomUUID(), amount: "5000" }],
        },
      }),
    ).rejects.toThrow("unavailable");
    expect(tables).toEqual(before);
  });

  test("new Product creation assigns ownership to the caller and validates its formula", async () => {
    const { service, tables } = setup();
    const result = await service.createOffer({
      subjectId: owner,
      data: {
        product: {
          title: { en: "New wardrobe" },
          kind: "physical",
          formula: "unit_price * quantity",
        },
        prices: [{ currencyId, amount: "5000" }],
      },
    });
    expect(
      tables["subjects-to-ecommerce-module-products"].find(
        (row) => row.ecommerceModuleProductId === result.product.id,
      )?.subjectId,
    ).toBe(owner);
    await expect(
      service.createOffer({
        subjectId: owner,
        data: {
          product: {
            title: { en: "Invalid" },
            kind: "physical",
            formula: "process.exit()",
          },
          prices: [{ currencyId, amount: "5000" }],
        },
      }),
    ).rejects.toThrow();
  });

  test("another seller and a buyer cannot modify the offer; admins can", async () => {
    const { service } = setup();
    for (const subjectId of [other, randomUUID()]) {
      await expect(
        service.mutate(
          {
            subjectId,
            entity: "stores-to-products",
            id: offerId,
            method: "PATCH",
            data: { variant: "hidden" },
          },
          async () => undefined,
        ),
      ).rejects.toThrow("another owner");
    }
    await expect(
      service.mutate(
        {
          subjectId: admin,
          entity: "stores-to-products",
          id: offerId,
          method: "PATCH",
          data: { variant: "hidden" },
        },
        async () => "saved",
      ),
    ).resolves.toBe("saved");
  });

  test("default links retain no new owner privilege and caller payload cannot assign ownership", async () => {
    const { service, tables } = setup();
    tables["subjects-to-ecommerce-module-stores"].push({
      id: randomUUID(),
      subjectId: other,
      ecommerceModuleStoreId: storeId,
      variant: "default",
    });
    await expect(service.assertOwner(other, "store", storeId)).rejects.toThrow(
      "another owner",
    );
    await expect(
      service.mutate(
        {
          subjectId: owner,
          entity: "subjects-to-ecommerce-module-stores",
          method: "POST",
          data: {
            subjectId: owner,
            ecommerceModuleStoreId: otherStoreId,
            variant: "owner",
            admin: true,
          },
        },
        async () => undefined,
      ),
    ).rejects.toThrow("another owner");
  });

  test("raw stock update, unlink, retarget and key deletion refuse outstanding holds", async () => {
    const { service, tables, held, locks } = setup();
    const { attributeId, keyId, linkId } = stock(tables);
    held[offerId] = 2;
    for (const mutation of [
      {
        entity: "attributes",
        id: attributeId,
        method: "PATCH",
        data: { number: "1" },
      },
      { entity: "attributes", id: attributeId, method: "DELETE", data: {} },
      {
        entity: "stores-to-products-to-attributes",
        id: linkId,
        method: "DELETE",
        data: {},
      },
      {
        entity: "stores-to-products-to-attributes",
        id: linkId,
        method: "PATCH",
        data: { attributeId: randomUUID() },
      },
      { entity: "attribute-keys", id: keyId, method: "DELETE", data: {} },
    ]) {
      await expect(
        service.mutate({ subjectId: admin, ...mutation }, async () => "saved"),
      ).rejects.toThrow(/reservations/);
    }
    expect(locks.some((ids) => ids.includes(offerId))).toBe(true);
  });

  test("scoped stock update rejects malformed integers and values below holds", async () => {
    const { service, tables, held } = setup();
    stock(tables);
    held[offerId] = 2;
    await expect(
      service.setAttribute({
        subjectId: owner,
        data: {
          owner: { type: "offer", id: offerId },
          key: "stock_quantity",
          field: "number",
          number: "1",
        },
      }),
    ).rejects.toThrow("outstanding reservations");
    for (const value of ["", "1.5", "-1", "1e3"]) {
      await expect(
        service.createOffer({
          subjectId: owner,
          data: {
            productId,
            prices: [{ currencyId, amount: "1" }],
            stockQuantity: value,
          },
        }),
      ).rejects.toThrow();
    }
  });

  test("direct attribute and relation endpoints cannot bypass the shared Product owner", async () => {
    const { service, tables } = setup();
    const attributeId = randomUUID();
    tables.attributes.push({
      id: attributeId,
      string: { en: "unit_price * quantity" },
    });
    tables["products-to-attributes"].push({
      id: randomUUID(),
      productId,
      attributeId,
    });
    await expect(
      service.mutate(
        {
          subjectId: owner,
          entity: "attributes",
          id: attributeId,
          method: "PATCH",
          data: { string: { en: "0" } },
        },
        async () => undefined,
      ),
    ).rejects.toThrow("another owner");
    await expect(
      service.mutate(
        {
          subjectId: owner,
          entity: "stores-to-attributes",
          method: "POST",
          data: { storeId, attributeId },
        },
        async () => undefined,
      ),
    ).rejects.toThrow("another owner");
  });

  test("batch authorization rejects a foreign record before any write", async () => {
    const { service, tables } = setup();
    let writes = 0;
    await expect(
      service.mutateBatch(
        [
          {
            subjectId: owner,
            entity: "stores",
            id: storeId,
            method: "PATCH",
            data: {},
          },
          {
            subjectId: owner,
            entity: "stores",
            id: otherStoreId,
            method: "PATCH",
            data: {},
          },
        ],
        async () => ++writes,
      ),
    ).rejects.toThrow("another owner");
    expect(writes).toBe(0);
    expect(tables.stores).toHaveLength(2);
  });

  test("find-or-create authorizes an existing match without granting its ownership", async () => {
    const { service, tables } = setup();
    await expect(
      service.findOrCreate(
        {
          subjectId: owner,
          entity: "products",
          method: "POST",
          data: { title: { en: "Wardrobe" } },
        },
        async () => "existing",
        async () => tables.products[0],
      ),
    ).rejects.toThrow("another owner");
    await expect(
      service.findOrCreate(
        {
          subjectId: admin,
          entity: "products",
          method: "POST",
          data: { title: { en: "Wardrobe" } },
        },
        async () => "existing",
        async () => tables.products[0],
      ),
    ).resolves.toBe("existing");
    expect(tables["subjects-to-ecommerce-module-products"]).toHaveLength(1);
  });
});

test("a signed-in buyer cannot create a standalone Product through the seller mutation", async () => {
  const { service, tables } = setup();
  const count = tables.products.length;
  await expect(
    service.mutation({
      subjectId: randomUUID(),
      data: {
        entity: "products",
        method: "POST",
        data: { slug: "standalone" },
      },
    }),
  ).rejects.toThrow("Create a seller product through a store offer");
  expect(tables.products).toHaveLength(count);
});

test("Subject mutations create caller ownership and reject foreign edits and ownership grants", async () => {
  const { service, tables } = setup();
  const store = await service.mutation({
    subjectId: owner,
    data: {
      entity: "stores",
      method: "POST",
      data: { title: { en: "New store" } },
    },
  });
  expect(
    tables["subjects-to-ecommerce-module-stores"].find(
      (grant) => grant.ecommerceModuleStoreId === store.id,
    )?.subjectId,
  ).toBe(owner);
  await expect(
    service.mutation({
      subjectId: other,
      data: {
        entity: "stores",
        method: "PATCH",
        recordId: store.id,
        data: { title: { en: "Other store" } },
      },
    }),
  ).rejects.toThrow("another owner");
  await expect(
    service.mutation({
      subjectId: owner,
      data: {
        entity: "subjects-to-ecommerce-module-stores",
        method: "POST",
        data: {
          subjectId: owner,
          ecommerceModuleStoreId: otherStoreId,
          variant: "owner",
        },
      },
    }),
  ).rejects.toThrow("another owner");
  await service.mutation({
    subjectId: admin,
    data: {
      entity: "stores",
      method: "PATCH",
      recordId: store.id,
      data: { title: { en: "Admin store" } },
    },
  });
  expect(tables.stores.find((row) => row.id === store.id)?.title).toEqual({
    en: "Admin store",
  });
});

describe("registration configuration", () => {
  test.each(["initialGrant", "initialGrantLegacyHistory"])(
    "a seller cannot enable %s in either catalogue entry point",
    async (flag) => {
      const { service, tables } = setup();
      const save = jest.fn();
      await expect(
        service.mutate(
          {
            entity: "stores-to-products",
            method: "PATCH",
            id: offerId,
            subjectId: owner,
            data: { settings: { [flag]: true } },
          },
          save,
        ),
      ).rejects.toThrow("require an administrator");
      await expect(
        service.createOffer({
          subjectId: owner,
          data: {
            productId,
            storeId,
            prices: [{ currencyId, amount: "0" }],
            settings: { [flag]: true },
          },
        }),
      ).rejects.toThrow("require an administrator");
      expect(save).not.toHaveBeenCalled();
      expect(tables["stores-to-products"]).toHaveLength(1);
    },
  );

  test("only an administrator can change an assigned Product, its credits or its associations", async () => {
    const { service, tables } = setup();
    tables["stores-to-products"][0].settings = { initialGrant: true };
    const attributeId = randomUUID();
    tables.attributes.push({ id: attributeId, number: "3000" });
    tables["products-to-attributes"].push({
      id: randomUUID(),
      productId,
      attributeId,
    });
    const save = jest.fn(async () => ({}));
    for (const mutation of [
      {
        entity: "products",
        method: "PATCH",
        id: productId,
        data: { title: { en: "Changed" } },
        subjectId: other,
      },
      {
        entity: "attributes",
        method: "PATCH",
        id: attributeId,
        data: { number: "9000" },
        subjectId: other,
      },
      {
        entity: "products-to-attributes",
        method: "POST",
        data: { productId, attributeId },
        subjectId: other,
      },
      {
        entity: "stores-to-products",
        method: "PATCH",
        id: offerId,
        data: { settings: { initialGrant: false } },
        subjectId: owner,
      },
    ]) {
      await expect(service.mutate(mutation, save)).rejects.toThrow(
        "require an administrator",
      );
    }
    await expect(
      service.setAttribute({
        subjectId: other,
        data: {
          owner: { type: "product", id: productId },
          key: "topup",
          field: "number",
          type: "topup",
          number: "9000",
          currencyId,
        },
      }),
    ).rejects.toThrow("require an administrator");
    expect(save).not.toHaveBeenCalled();
    await service.mutate(
      {
        entity: "stores-to-products",
        method: "PATCH",
        id: offerId,
        data: { settings: { initialGrant: false } },
        subjectId: admin,
      },
      save,
    );
    expect(save).toHaveBeenCalledTimes(1);
  });
});
