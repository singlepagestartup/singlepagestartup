import { randomUUID } from "node:crypto";
import { Service } from ".";

function fixture() {
  const actorId = randomUUID();
  const storeId = randomUUID();
  const otherStoreId = randomUUID();
  const productId = randomUUID();
  const offerId = randomUUID();
  const otherOfferId = randomUUID();
  const currencyId = randomUUID();
  const attributeId = randomUUID();
  const copyId = randomUUID();
  const linkId = randomUUID();
  const orderId = randomUUID();
  const taskId = randomUUID();
  const keyId = randomUUID();
  const date = new Date("2026-11-01T00:00:00Z");
  const product = {
    id: productId,
    slug: "product",
    title: { ru: "Товар", en: "Product" },
    shortDescription: { ru: "Локальное описание", en: "Description" },
    description: { en: "Full description" },
    updatedAt: date,
  };
  const offer = {
    id: offerId,
    productId,
    storeId,
    variant: "default",
    settings: {},
    sku: "SKU-1",
  };
  const otherOffer = {
    ...offer,
    id: otherOfferId,
    storeId: otherStoreId,
    sku: "SKU-2",
  };
  const price = {
    id: attributeId,
    currencyIds: [currencyId],
    field: "number",
    type: "price",
    number: "10.00",
    key: "price",
  };
  const storeGrant = {
    id: storeId,
    canManageCatalog: true,
    canReadCosts: true,
    canManageTasks: true,
  };
  const stores = jest.fn().mockResolvedValue([storeGrant]);
  const findOffers = jest.fn().mockResolvedValue([offer]);
  const findOwners = jest.fn().mockResolvedValue([]);
  const assertOwner = jest.fn().mockResolvedValue(undefined);
  const createScopedPrice = jest.fn().mockResolvedValue(undefined);
  const storePublicImage = jest.fn();
  const createImageLink = jest.fn();
  const patchProduct = jest.fn().mockResolvedValue(product);
  const patchOffer = jest.fn().mockResolvedValue(offer);
  const patchAttribute = jest.fn().mockResolvedValue(price);
  const createAttribute = jest.fn().mockResolvedValue({ id: copyId });
  const patchLink = jest.fn().mockResolvedValue({ id: linkId });
  const createKeyLink = jest.fn();
  const createCurrencyLink = jest.fn();
  const findOrders = jest.fn().mockResolvedValue([
    {
      id: orderId,
      createdAt: date,
      status: "delivered",
      type: "history",
      quantity: 2,
    },
  ]);
  const findTasks = jest
    .fn()
    .mockResolvedValue([{ id: taskId, orderId, openingKey: "checkout" }]);
  const withCatalogLock = jest.fn((_: unknown, read: () => unknown) => read());
  const withOfferLocks = jest.fn((_: unknown, read: () => unknown) => read());
  const subject = {
    repository: { storeCatalogProductOrders: findOrders, withCatalogLock },
    crmWorkspace: { stores, productFunnels: jest.fn().mockResolvedValue([]) },
    ecommerceCatalog: {
      assertOwner,
      createScopedPrice,
      dependencies: { stock: { withOfferLocks } },
    },
    module: { subjectsToEcommerceModuleProducts: { find: findOwners } },
    modules: {
      crm: { task: { find: findTasks } },
      fileStorage: { file: { storePublicImage } },
      ecommerce: {
        productsToFileStorageModuleFiles: {
          find: jest.fn().mockResolvedValue([]),
          create: createImageLink,
        },
        store: {
          findById: jest.fn().mockResolvedValue({ id: storeId, slug: "store" }),
        },
        product: {
          findById: jest.fn().mockResolvedValue(product),
          update: patchProduct,
        },
        storesToProducts: {
          find: findOffers,
          update: patchOffer,
          catalog: {
            catalog: jest.fn().mockResolvedValue({
              currencies: [{ id: currencyId, title: "USD", symbol: "$" }],
              offerAttributes: new Map([
                [offerId, [price]],
                [otherOfferId, [{ ...price, number: "90.00" }]],
              ]),
              productAttributes: new Map(),
            }),
          },
        },
        storesToProductsToAttributes: {
          find: jest.fn().mockResolvedValue([
            { id: linkId, storesToProductsId: offerId, attributeId },
            { id: randomUUID(), storesToProductsId: otherOfferId, attributeId },
          ]),
          update: patchLink,
        },
        productsToAttributes: { find: jest.fn().mockResolvedValue([]) },
        storesToAttributes: { find: jest.fn().mockResolvedValue([]) },
        attribute: {
          findById: jest.fn().mockResolvedValue({
            id: attributeId,
            createdAt: date,
            updatedAt: date,
            number: price.number,
          }),
          update: patchAttribute,
          create: createAttribute,
        },
        attributeKeysToAttributes: {
          find: jest.fn().mockResolvedValue([{ attributeKeyId: keyId }]),
          create: createKeyLink,
        },
        attributesToBillingModuleCurrencies: {
          find: jest
            .fn()
            .mockResolvedValue([{ billingModuleCurrencyId: currencyId }]),
          create: createCurrencyLink,
        },
      },
    },
  };
  const service = new Service(
    subject as unknown as ConstructorParameters<typeof Service>[0],
  );
  const scope = { storeId, productId };
  const localizedEdit = {
    expectedUpdatedAt: date.toISOString(),
    language: "ru",
    title: "Новый товар",
    shortDescription: "Краткое описание",
    description: "Полное описание",
  };
  return {
    service,
    subject,
    price,
    scope,
    actorId,
    storeId,
    productId,
    offerId,
    attributeId,
    currencyId,
    offer,
    otherOffer,
    orderId,
    taskId,
    keyId,
    copyId,
    linkId,
    stores,
    storeGrant,
    findOffers,
    findOwners,
    assertOwner,
    findOrders,
    findTasks,
    patchProduct,
    patchOffer,
    patchAttribute,
    createAttribute,
    createScopedPrice,
    storePublicImage,
    createImageLink,
    patchLink,
    createKeyLink,
    createCurrencyLink,
    withCatalogLock,
    withOfferLocks,
    localizedEdit,
  };
}

it("requires access before it reads store catalog details or order links", async () => {
  const f = fixture();
  f.stores.mockResolvedValue([]);
  await expect(f.service.detail(f.actorId, f.scope, 0)).rejects.toThrow(
    "Store catalog access is required",
  );
  expect(f.findOffers).not.toHaveBeenCalled();
  expect(f.findOrders).not.toHaveBeenCalled();
  expect(f.subject.crmWorkspace.productFunnels).not.toHaveBeenCalled();
});

it("returns orders for the exact scoped product and keeps another store's prices out", async () => {
  const f = fixture();
  f.findOffers.mockResolvedValue([f.offer, f.otherOffer]);
  const detail = await f.service.detail(f.actorId, f.scope, 0);
  expect(detail.sharedProduct).toBe(true);
  expect(detail.canEditProduct).toBe(false);
  expect(detail.offers).toEqual([
    expect.objectContaining({
      id: f.offerId,
      prices: [expect.objectContaining({ amount: "10.00" })],
    }),
  ]);
  expect(detail.orders?.items).toEqual([
    expect.objectContaining({ id: f.orderId }),
  ]);
  expect(f.findOrders).toHaveBeenCalledWith({
    ...f.scope,
    offset: 0,
    limit: 21,
  });
  expect(f.subject.crmWorkspace.productFunnels).toHaveBeenCalledWith(
    f.actorId,
    { ...f.scope, offerIds: [f.offerId] },
  );
  expect(f.findTasks).not.toHaveBeenCalled();
});

it("merges localized fields for a legacy single-store product and refuses a stale revision", async () => {
  const f = fixture();
  f.assertOwner.mockImplementation(async (_actorId, kind) => {
    if (kind === "product") {
      throw new Error("Permission error. Product owner grant is absent");
    }
  });
  await expect(
    f.service.update(f.actorId, f.scope, {
      product: {
        ...f.localizedEdit,
        expectedUpdatedAt: "2026-10-01T00:00:00Z",
      },
    }),
  ).rejects.toThrow("product changed");
  expect(f.patchProduct).not.toHaveBeenCalled();
  await f.service.update(f.actorId, f.scope, { product: f.localizedEdit });
  expect(f.patchProduct).toHaveBeenCalledWith({
    id: f.productId,
    data: {
      title: { ru: f.localizedEdit.title, en: "Product" },
      shortDescription: {
        ru: f.localizedEdit.shortDescription,
        en: "Description",
      },
      description: { ru: f.localizedEdit.description, en: "Full description" },
    },
  });
  expect(f.withCatalogLock).toHaveBeenCalledWith(
    ["ecommerce-catalog"],
    expect.any(Function),
  );
});

it("rejects shared product edits and isolates the selected offer's shared price", async () => {
  const f = fixture();
  f.findOffers.mockResolvedValue([f.offer, f.otherOffer]);
  await expect(
    f.service.update(f.actorId, f.scope, { product: f.localizedEdit }),
  ).rejects.toThrow("description cannot be edited");
  await f.service.update(f.actorId, f.scope, {
    offer: {
      id: f.offerId,
      prices: [
        {
          attributeId: f.attributeId,
          currencyId: f.currencyId,
          expectedAmount: "10.00",
          amount: "12.50",
        },
      ],
    },
  });
  expect(f.withOfferLocks).toHaveBeenCalledWith(
    { offerIds: [f.offerId] },
    expect.any(Function),
  );
  expect(f.createAttribute).toHaveBeenCalledWith({ data: { number: "12.50" } });
  expect(f.createKeyLink).toHaveBeenCalledWith({
    data: { attributeId: f.copyId, attributeKeyId: f.keyId },
  });
  expect(f.createCurrencyLink).toHaveBeenCalledWith({
    data: { attributeId: f.copyId, billingModuleCurrencyId: f.currencyId },
  });
  expect(f.patchLink).toHaveBeenCalledWith({
    id: f.linkId,
    data: { attributeId: f.copyId },
  });
  expect(f.patchAttribute).not.toHaveBeenCalled();
  expect(f.patchProduct).not.toHaveBeenCalled();
});

it("edits a selected directory feature on one offer while preserving the directory value and other offers", async () => {
  const f = fixture();
  const ecommerce = f.subject.modules.ecommerce;
  const original = {
    id: f.attributeId,
    slug: "directory-blue",
    adminTitle: "Blue",
    string: { en: "Blue", ru: "Синий" },
    updatedAt: new Date("2026-11-01T10:00:00Z"),
  };
  const ownLink = {
    id: f.linkId,
    storesToProductsId: f.offerId,
    attributeId: f.attributeId,
  };
  const otherLink = {
    ...ownLink,
    id: randomUUID(),
    storesToProductsId: randomUUID(),
  };
  ecommerce.storesToProductsToAttributes.find
    .mockResolvedValueOnce([ownLink])
    .mockResolvedValueOnce([ownLink, otherLink]);
  const updateOfferLink = ecommerce.storesToProductsToAttributes.update;
  ecommerce.storesToAttributes.find.mockResolvedValue([
    { storeId: f.storeId, attributeId: f.attributeId },
  ]);
  ecommerce.attributeKeysToAttributes.find.mockResolvedValue([
    { attributeId: f.attributeId, attributeKeyId: f.keyId },
  ]);
  Object.assign(ecommerce.attribute, {
    find: jest.fn().mockResolvedValue([original]),
    findById: jest.fn().mockResolvedValue(original),
  });
  Object.assign(ecommerce, {
    attributeKey: {
      find: jest.fn().mockResolvedValue([
        {
          id: f.keyId,
          slug: "color",
          field: "string",
          type: "feature",
          variant: "default",
        },
      ]),
    },
  });
  ecommerce.attributesToBillingModuleCurrencies.find.mockResolvedValue([]);
  await f.service.update(f.actorId, f.scope, {
    relation: {
      kind: "update-attribute",
      offerId: f.offerId,
      id: ownLink.id,
      expectedUpdatedAt: original.updatedAt.toISOString(),
      value: { ru: "Красный" },
    },
  });
  expect(f.createAttribute).toHaveBeenCalledWith({
    data: { adminTitle: "Blue", string: { en: "Blue", ru: "Красный" } },
  });
  expect(f.createKeyLink).toHaveBeenCalledWith({
    data: { attributeId: f.copyId, attributeKeyId: f.keyId },
  });
  expect(updateOfferLink).toHaveBeenCalledTimes(1);
  expect(updateOfferLink).toHaveBeenCalledWith({
    id: ownLink.id,
    data: { attributeId: f.copyId },
  });
  expect(f.patchAttribute).not.toHaveBeenCalled();
});

it("saves independent translations without copying another language or rewriting omitted fields", async () => {
  const f = fixture();
  await f.service.update(f.actorId, f.scope, {
    translations: {
      expectedUpdatedAt: f.localizedEdit.expectedUpdatedAt,
      entries: {
        ru: { title: "Новое название" },
        de: { description: "Beschreibung" },
      },
    },
  });
  expect(f.patchProduct).toHaveBeenCalledWith({
    id: f.productId,
    data: {
      title: { en: "Product", ru: "Новое название" },
      description: { en: "Full description", de: "Beschreibung" },
    },
  });
});

it("clears optional names while retaining at least one nonempty title", async () => {
  const f = fixture();
  const expectedUpdatedAt = f.localizedEdit.expectedUpdatedAt;
  await expect(
    f.service.update(f.actorId, f.scope, {
      translations: {
        expectedUpdatedAt,
        entries: { ru: { title: "" }, en: { title: "  " } },
      },
    }),
  ).rejects.toThrow("Keep at least one product name");
  expect(f.patchProduct).not.toHaveBeenCalled();
  await f.service.update(f.actorId, f.scope, {
    translations: { expectedUpdatedAt, entries: { ru: { title: "" } } },
  });
  expect(f.patchProduct).toHaveBeenCalledWith({
    id: f.productId,
    data: { title: { ru: "", en: "Product" } },
  });
});

it("adds a currency only to the selected offer and requires one price to remain", async () => {
  const f = fixture();
  const newPrice = { currencyId: randomUUID(), amount: "12.00" };
  await f.service.update(f.actorId, f.scope, {
    offer: { id: f.offerId, newPrices: [newPrice] },
  });
  expect(f.createScopedPrice).toHaveBeenCalledWith(
    { type: "offer", id: f.offerId },
    newPrice,
  );
  await expect(
    f.service.update(f.actorId, f.scope, {
      offer: {
        id: f.offerId,
        newPrices: [{ currencyId: f.currencyId, amount: "11" }],
      },
    }),
  ).rejects.toThrow("A price already exists in that currency");
  await expect(
    f.service.update(f.actorId, f.scope, {
      relation: {
        kind: "remove-price",
        owner: "offer",
        offerId: f.offerId,
        attributeId: f.attributeId,
        currencyId: f.currencyId,
        expectedAmount: "10.00",
      },
    }),
  ).rejects.toThrow("Retain at least one price");
});

it("rejects uploads to a shared Product before writing bytes", async () => {
  const f = fixture();
  f.findOffers.mockResolvedValue([f.offer, f.otherOffer]);
  await expect(
    f.service.uploadImage(f.actorId, f.scope, new File([], "image.png")),
  ).rejects.toThrow("Product images cannot be edited for this store");
  expect(f.storePublicImage).not.toHaveBeenCalled();
});

it("discards a newly uploaded image when its scoped association fails", async () => {
  const f = fixture();
  const fileId = randomUUID();
  const discard = jest.fn().mockResolvedValue(undefined);
  const file = new File([], "product.png");
  f.storePublicImage.mockResolvedValue({ entity: { id: fileId }, discard });
  f.createImageLink.mockRejectedValue(new Error("DB failure"));
  await expect(f.service.uploadImage(f.actorId, f.scope, file)).rejects.toThrow(
    "DB failure",
  );
  expect(f.storePublicImage).toHaveBeenCalledWith(file);
  expect(f.createImageLink).toHaveBeenCalledWith({
    data: {
      productId: f.productId,
      fileStorageModuleFileId: fileId,
      orderIndex: 0,
      variant: "default",
    },
  });
  expect(discard).toHaveBeenCalled();
});

it("reads back a second offer currency and uploaded images with their persisted order and removal", async () => {
  const f = fixture();
  const euro = { id: randomUUID(), title: "Euro", symbol: "€" };
  const currencies = [
    { id: f.currencyId, title: "US Dollar", symbol: "$" },
    euro,
  ];
  const persistedPrices = [f.price];
  f.subject.modules.ecommerce.storesToProducts.catalog.catalog.mockImplementation(
    async () => ({
      currencies,
      offerAttributes: new Map([[f.offerId, persistedPrices]]),
      productAttributes: new Map(),
    }),
  );
  f.createScopedPrice.mockImplementation(
    async (_owner, { currencyId, amount }) => {
      persistedPrices.push({
        ...f.price,
        id: randomUUID(),
        currencyIds: [currencyId],
        number: amount,
      });
    },
  );

  interface IMediaLink {
    id: string;
    productId: string;
    fileStorageModuleFileId: string;
    orderIndex: number;
  }
  interface IFile {
    id: string;
    adminTitle: string;
    file: string;
    mimeType: string;
  }
  const images = new Map<string, IMediaLink>();
  const files = new Map<string, IFile>();
  const noRows = jest.fn().mockResolvedValue([]);
  const funnel = {
    id: randomUUID(),
    slug: "product-funnel",
    title: "Product funnel",
  };
  const productFunnels = jest.fn().mockResolvedValue([funnel]);
  const relatedOffers = jest.fn().mockResolvedValue([]);
  Object.assign(f.subject.crmWorkspace, { productFunnels });
  Object.assign(f.subject.modules.ecommerce, {
    categoriesToProducts: { find: noRows },
    category: { find: noRows },
    attributeKey: { find: noRows },
    productsToWebsiteBuilderModuleWidgets: { find: noRows },
    widgetsToProducts: { find: noRows },
    offersToOffers: { find: relatedOffers },
    widget: { find: noRows },
  });
  Object.assign(f.subject.modules, {
    billing: { currency: { find: jest.fn().mockResolvedValue(currencies) } },
    websiteBuilder: { widget: { find: noRows } },
  });
  f.subject.modules.ecommerce.storesToProductsToAttributes.find.mockResolvedValue(
    [],
  );
  Object.assign(f.subject.modules.fileStorage.file, {
    publicMetadata: jest.fn(async ({ params }) =>
      params.filters.and[0].value
        .map((id: string) => files.get(id))
        .filter(Boolean),
    ),
  });
  f.storePublicImage.mockImplementation(async (file: File) => {
    const id = randomUUID();
    const entity = {
      id,
      file: `/file-storage/static/${file.name}`,
      adminTitle: file.name,
      mimeType: file.type,
    };
    files.set(id, entity);
    return {
      entity,
      discard: async () => {
        files.delete(id);
      },
    };
  });
  Object.assign(f.subject.modules.ecommerce.productsToFileStorageModuleFiles, {
    find: jest.fn(async ({ params }) =>
      [...images.values()]
        .filter(({ productId }) => productId === params.filters.and[0].value)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    ),
    create: jest.fn(async ({ data }) => {
      const row = { ...data, id: randomUUID() };
      images.set(row.id, row);
      return row;
    }),
    update: jest.fn(async ({ id, data }) => {
      const row = images.get(id);
      if (row) {
        images.set(id, { ...row, ...data });
      }
    }),
    delete: jest.fn(async ({ id }) => images.delete(id)),
  });

  await f.service.update(f.actorId, f.scope, {
    offer: {
      id: f.offerId,
      newPrices: [{ currencyId: euro.id, amount: "15.25" }],
    },
  });
  await f.service.uploadImage(
    f.actorId,
    f.scope,
    new File([], "cover.png", { type: "image/png" }),
  );
  await f.service.uploadImage(
    f.actorId,
    f.scope,
    new File([], "side.png", { type: "image/png" }),
  );
  const initial = await f.service.detail(f.actorId, f.scope, undefined, true);
  expect(initial.offers[0].prices).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ currencyId: f.currencyId, amount: "10.00" }),
      expect.objectContaining({ currencyId: euro.id, amount: "15.25" }),
    ]),
  );
  expect(initial.funnels).toBeUndefined();
  expect(initial.orders).toBeUndefined();
  expect(productFunnels).not.toHaveBeenCalled();
  expect(relatedOffers).not.toHaveBeenCalled();
  const overview = await f.service.detail(f.actorId, f.scope, 0);
  expect(overview.funnels).toEqual([funnel]);
  expect(overview.orders?.items).toHaveLength(1);
  expect(overview.relations).toBeUndefined();
  expect(productFunnels).toHaveBeenCalledWith(f.actorId, {
    ...f.scope,
    offerIds: [f.offerId],
  });
  const [cover, side] = initial.relations!.images;
  expect(cover.src).toMatch(/\/public\/file-storage\/static\/cover\.png$/);
  expect(side.src).toMatch(/\/public\/file-storage\/static\/side\.png$/);

  await f.service.update(f.actorId, f.scope, {
    relation: { kind: "move-image", id: side.id, direction: "up" },
  });
  const reordered = await f.service.detail(f.actorId, f.scope, undefined, true);
  expect(
    reordered.relations?.images.map(({ id, orderIndex }) => [id, orderIndex]),
  ).toEqual([
    [side.id, 0],
    [cover.id, 1],
  ]);
  await f.service.update(f.actorId, f.scope, {
    relation: { kind: "remove-image", id: cover.id },
  });
  const remaining = await f.service.detail(f.actorId, f.scope, undefined, true);
  expect(remaining.relations?.images.map(({ id }) => id)).toEqual([side.id]);
  expect(files.has(cover.fileId)).toBe(true);
});
