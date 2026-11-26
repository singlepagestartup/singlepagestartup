import { Relations } from "./relations";

function fixture() {
  const date = new Date("2026-11-01T10:00:00Z");
  const visibleLink = { id: "visible-link", attributeId: "visible" };
  const secretLink = { id: "secret-link", attributeId: "secret" };
  const scopedMedia = [
    { id: "image-first", fileStorageModuleFileId: "cover-file", orderIndex: 0 },
    {
      id: "image-second",
      fileStorageModuleFileId: "receipt-id",
      orderIndex: 1,
    },
  ];
  const visible = {
    id: "visible",
    string: { ru: "Синий", en: "Blue" },
    updatedAt: date,
  };
  const secret = {
    id: "secret",
    string: { en: "private value" },
    updatedAt: date,
  };
  const featureKey = {
    id: "visible-key",
    slug: "color",
    title: { en: "Color" },
    variant: "default",
    type: "feature",
    field: "string",
  };
  const secretKey = { ...featureKey, id: "secret-key", slug: "legacy-api-key" };
  const publicMetadata = jest.fn().mockResolvedValue([
    {
      id: "cover-file",
      file: "/file-storage/static/cover.png",
      adminTitle: "Cover",
      mimeType: "image/png",
    },
  ]);
  const findMedia = jest.fn().mockResolvedValue(scopedMedia);
  const updateMedia = jest.fn().mockResolvedValue(undefined);
  const deleteMedia = jest.fn().mockResolvedValue(undefined);
  const deleteFile = jest.fn();
  const deleteAttribute = jest.fn();
  const noRows = jest.fn().mockResolvedValue([]);
  const dependencies = {
    modules: {
      ecommerce: {
        productsToFileStorageModuleFiles: {
          find: findMedia,
          update: updateMedia,
          delete: deleteMedia,
        },
        categoriesToProducts: { find: noRows },
        category: { find: noRows },
        productsToAttributes: {
          find: jest.fn().mockResolvedValue([visibleLink, secretLink]),
          delete: deleteAttribute,
        },
        storesToProductsToAttributes: {
          find: jest.fn().mockResolvedValue([
            {
              ...visibleLink,
              id: "offer-visible",
              storesToProductsId: "offer-a",
            },
          ]),
        },
        attribute: { find: jest.fn().mockResolvedValue([visible, secret]) },
        attributeKeysToAttributes: {
          find: jest.fn().mockResolvedValue([
            { attributeId: visible.id, attributeKeyId: featureKey.id },
            { attributeId: secret.id, attributeKeyId: secretKey.id },
          ]),
        },
        attributesToBillingModuleCurrencies: { find: noRows },
        attributeKey: {
          find: jest.fn().mockResolvedValue([featureKey, secretKey]),
        },
        productsToWebsiteBuilderModuleWidgets: { find: noRows },
        widgetsToProducts: { find: noRows },
        offersToOffers: { find: noRows },
        widget: { find: noRows },
      },
      websiteBuilder: { widget: { find: noRows } },
      billing: { currency: { find: noRows } },
      fileStorage: { file: { publicMetadata, delete: deleteFile } },
    },
  };
  return {
    relations: new Relations(
      dependencies as unknown as ConstructorParameters<typeof Relations>[0],
    ),
    publicMetadata,
    findMedia,
    updateMedia,
    deleteMedia,
    deleteFile,
    deleteAttribute,
    date,
  };
}

it("projects only the linked file metadata allowed by File Storage and omits secret attribute values", async () => {
  const f = fixture();
  const data = await f.relations.read("product-a", [], true);
  expect(data.images).toEqual([
    expect.objectContaining({ id: "image-first", fileId: "cover-file" }),
  ]);
  expect(f.publicMetadata).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [
          {
            column: "id",
            method: "inArray",
            value: ["cover-file", "receipt-id"],
          },
        ],
      },
    },
  });
  expect(data.attributes.map(({ key }) => key)).toEqual(["color"]);
  expect(data.attributeOptions).toEqual([]);
  expect(data.attributes[0].editable).toBe(false);
  expect(JSON.stringify(data)).not.toContain("private value");
});

it("moves a photo to a non-adjacent product photo in a single update and rejects foreign targets", async () => {
  const f = fixture();
  const links = ["a", "b", "c"].map((id, orderIndex) => ({ id, orderIndex }));
  f.findMedia.mockResolvedValue(links);
  await expect(
    f.relations.update(
      "product",
      { kind: "move-image", id: "c", targetId: "foreign" },
      jest.fn(),
    ),
  ).rejects.toThrow("Target image is unavailable");
  expect(f.updateMedia).not.toHaveBeenCalled();
  await f.relations.update(
    "product",
    { kind: "move-image", id: "c", targetId: "a" },
    jest.fn(),
  );
  expect(f.updateMedia.mock.calls).toEqual([
    [{ id: "c", data: { orderIndex: 0 } }],
    [{ id: "a", data: { orderIndex: 1 } }],
    [{ id: "b", data: { orderIndex: 2 } }],
  ]);
});

it("changes image order and unlinks only a selected Product association without deleting bytes", async () => {
  const f = fixture();
  const updateAttribute = jest.fn();
  await f.relations.update(
    "product-a",
    { kind: "move-image", id: "image-second", direction: "up" },
    updateAttribute,
  );
  expect(f.updateMedia.mock.calls).toEqual([
    [{ id: "image-second", data: { orderIndex: 0 } }],
    [{ id: "image-first", data: { orderIndex: 1 } }],
  ]);
  await expect(
    f.relations.update(
      "product-a",
      { kind: "remove-image", id: "foreign-link" },
      updateAttribute,
    ),
  ).rejects.toThrow("Image is unavailable");
  await f.relations.update(
    "product-a",
    { kind: "remove-image", id: "image-first" },
    updateAttribute,
  );
  expect(f.findMedia).toHaveBeenLastCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({
        filters: {
          and: [{ column: "productId", method: "eq", value: "product-a" }],
        },
      }),
    }),
  );
  expect(f.deleteMedia).toHaveBeenCalledTimes(1);
  expect(f.deleteMedia).toHaveBeenCalledWith({ id: "image-first" });
  expect(f.deleteFile).not.toHaveBeenCalled();
});

it("merges one translated characteristic and prevents secret attribute edits", async () => {
  const f = fixture();
  const update = jest.fn().mockResolvedValue(undefined);
  await f.relations.update(
    "product-a",
    {
      kind: "update-attribute",
      offerId: "offer-a",
      id: "offer-visible",
      value: { ru: "Красный" },
      expectedUpdatedAt: f.date.toISOString(),
    },
    update,
  );
  expect(update).toHaveBeenCalledWith("visible", {
    string: { ru: "Красный", en: "Blue" },
  });
  await expect(
    f.relations.update(
      "product-a",
      { kind: "remove-attribute", offerId: "offer-a", id: "secret-link" },
      update,
    ),
  ).rejects.toThrow("This characteristic cannot be edited here");
  expect(f.deleteAttribute).not.toHaveBeenCalled();
});
