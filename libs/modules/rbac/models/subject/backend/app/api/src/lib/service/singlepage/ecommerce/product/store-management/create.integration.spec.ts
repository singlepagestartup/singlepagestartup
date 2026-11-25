import { randomUUID } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { signJwt } from "@sps/backend-utils";
import { Provider as KvProvider } from "@sps/providers-kv";
import {
  createAppAssembly,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { KV_PROVIDER, RBAC_JWT_SECRET } from "@sps/shared-utils";
import { bootstrap } from "../../../../../bootstrap";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  FILE_STORAGE_PROVIDER: "local",
}));

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) {
    kv.client.disconnect();
  }
});

it("creates a multipart store product, isolates its feature edit and removes its public photo when PostgreSQL rejects the commit", async () => {
  const { app, service: subject } = await bootstrap(createAppAssembly());
  const ecommerce = subject.modules.ecommerce;
  const http = new Hono();
  http.route("/api/rbac/subjects", app.hono);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=",
    "base64",
  );
  let productId = "";
  let fileId = "";
  let path = "";
  const db = getDrizzle({});
  const result = withConsistencyTransaction(db, async () => {
    const store = await ecommerce.store.create({ data: {} });
    const owner = await subject.create({ data: {} });
    const identity = await subject.module.identity.create({
      data: { email: randomUUID() + "@example.test" },
    });
    await subject.module.subjectsToIdentities.create({
      data: { subjectId: owner.id, identityId: identity.id },
    });
    await subject.module.subjectsToEcommerceModuleStores.create({
      data: {
        subjectId: owner.id,
        ecommerceModuleStoreId: store.id,
        variant: "owner",
      },
    });
    const category = await ecommerce.category.create({ data: {} });
    const attribute = await subject.storeCatalogDirectories.create(
      owner.id,
      store.id,
      {
        kind: "attributes",
        language: "en",
        newKey: { title: "Integration color", field: "string" },
        value: "blue",
      },
    );
    const currencies = subject.modules.billing.currency;
    const first = await currencies.create({
      data: { slug: randomUUID(), title: "First test currency", symbol: "X" },
    });
    const second = await currencies.create({
      data: { slug: randomUUID(), title: "Second test currency", symbol: "Y" },
    });
    const prices = [
      { currencyId: first.id, amount: "2.25" },
      { currencyId: second.id, amount: "3.5" },
    ];
    const form = new FormData();
    form.set(
      "data",
      JSON.stringify({
        storeId: store.id,
        product: {
          title: { en: "Integration desk" },
          kind: "physical",
          formula: "unit_price * quantity",
        },
        prices,
        categoryIds: [category.id],
        attributeIds: [attribute.id],
      }),
    );
    form.append(
      "images",
      new File([Uint8Array.from(png)], "desk.png", { type: "image/png" }),
    );
    const token = await signJwt(
      { subjectId: owner.id, type: "access", lifetimeInSeconds: 300 },
      RBAC_JWT_SECRET!,
    );
    const response = await http.request(
      `/api/rbac/subjects/${owner.id}/ecommerce-module/offers`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );
    const body = (await response.json()) as {
      data?: { product: { id: string } };
    };
    expect({ status: response.status, body }).toMatchObject({
      status: 201,
      body: { data: { product: { id: expect.any(String) } } },
    });
    productId = body.data!.product.id;
    const scope = { storeId: store.id, productId };
    const detail = await subject.storeProducts.detail(
      owner.id,
      scope,
      undefined,
      true,
    );
    expect(
      detail.offers[0].prices.map(({ currencyId, amount }) => [
        currencyId,
        Number(amount),
      ]),
    ).toEqual(
      expect.arrayContaining([
        [first.id, 2.25],
        [second.id, 3.5],
      ]),
    );
    expect(detail.relations?.categories.map((row) => row.categoryId)).toEqual([
      category.id,
    ]);
    const feature = detail.relations!.attributes.find(
      (row) => row.attributeId === attribute.id,
    )!;
    const offerId = detail.offers[0].id;
    expect(feature).toMatchObject({
      offerId,
      editable: true,
      value: { en: "blue" },
    });
    const secondOffer = await subject.ecommerceCatalog.createOffer({
      subjectId: owner.id,
      data: {
        storeId: store.id,
        productId,
        prices,
        configurationKey: "second",
      },
    });
    const otherStore = await ecommerce.store.create({ data: {} });
    await subject.module.subjectsToEcommerceModuleStores.create({
      data: {
        subjectId: owner.id,
        ecommerceModuleStoreId: otherStore.id,
        variant: "owner",
      },
    });
    const foreign = await subject.ecommerceCatalog.createOffer({
      subjectId: owner.id,
      data: {
        storeId: otherStore.id,
        productId,
        prices,
      },
    });
    const legacy = await ecommerce.productsToAttributes.create({
      data: { productId, attributeId: attribute.id },
    });
    const attach = {
      kind: "attach-attribute" as const,
      offerId: secondOffer.offer.id,
      attributeId: attribute.id,
    };
    await subject.storeProducts.update(owner.id, scope, { relation: attach });
    await subject.storeProducts.update(owner.id, scope, { relation: attach });
    await expect(
      subject.storeProducts.update(owner.id, scope, {
        relation: { ...attach, offerId: foreign.offer.id },
      }),
    ).rejects.toThrow("Permission error");
    await expect(
      subject.storeProducts.update(owner.id, scope, {
        relation: {
          kind: "remove-attribute",
          offerId: secondOffer.offer.id,
          id: feature.id,
        },
      }),
    ).rejects.toThrow("Permission error");
    await expect(
      subject.storeProducts.update(owner.id, scope, {
        relation: { kind: "remove-attribute", offerId, id: legacy.id },
      }),
    ).rejects.toThrow("Permission error");
    fileId = detail.relations!.images[0].fileId;
    const file = await subject.modules.fileStorage.file.findById({
      id: fileId,
    });
    path = join(process.cwd(), "public", file!.file);
    expect(await readFile(path)).toEqual(png);
    await subject.storeProducts.update(owner.id, scope, {
      relation: {
        kind: "update-attribute",
        offerId,
        id: feature.id,
        expectedUpdatedAt: feature.updatedAt,
        value: { en: "green" },
      },
    });
    const original = await ecommerce.attribute.findById({ id: attribute.id });
    expect(original?.string).toMatchObject({ en: "blue" });
    const edited = await subject.storeProducts.detail(
      owner.id,
      scope,
      undefined,
      true,
    );
    expect(edited.relations?.attributes).toContainEqual(
      expect.objectContaining({
        id: feature.id,
        value: expect.objectContaining({ en: "green" }),
      }),
    );
    const secondFeatures = edited.relations!.attributes.filter(
      (row) =>
        row.offerId === secondOffer.offer.id &&
        row.attributeId === attribute.id,
    );
    expect(secondFeatures).toHaveLength(1);
    expect(secondFeatures[0].value).toEqual({ en: "blue" });
    expect(edited.relations!.attributes).toContainEqual(
      expect.objectContaining({
        id: legacy.id,
        editable: false,
        value: { en: "blue" },
      }),
    );
    await subject.storeProducts.update(owner.id, scope, {
      relation: {
        kind: "remove-attribute",
        offerId: secondOffer.offer.id,
        id: secondFeatures[0].id,
      },
    });
    const updated = await subject.storeProducts.update(
      owner.id,
      scope,
      {
        relation: {
          kind: "add-attribute",
          offerId: secondOffer.offer.id,
          keyId: attribute.keyId!,
          value: { en: "white" },
        },
      },
      true,
    );
    expect(updated.relations?.attributes).toContainEqual(
      expect.objectContaining({
        offerId: secondOffer.offer.id,
        value: { en: "white" },
      }),
    );
    const otherDetail = await subject.storeProducts.detail(
      owner.id,
      { storeId: otherStore.id, productId },
      undefined,
      true,
    );
    expect(
      otherDetail.relations!.attributes.filter((row) => row.offerId),
    ).toEqual([]);
    // Let all file and database writes succeed before failing at COMMIT.
    await subject.repository.db.execute(
      sql`CREATE TEMP TABLE product_commit_check (value integer UNIQUE DEFERRABLE INITIALLY DEFERRED) ON COMMIT DROP`,
    );
    await subject.repository.db.execute(
      sql`INSERT INTO product_commit_check VALUES (1), (1)`,
    );
  });
  await expect(result).rejects.toMatchObject({ code: "23505" });
  expect(await ecommerce.product.findById({ id: productId })).toBeFalsy();
  expect(
    await subject.modules.fileStorage.file.findById({ id: fileId }),
  ).toBeFalsy();
  await expect(access(path)).rejects.toMatchObject({ code: "ENOENT" });
});
