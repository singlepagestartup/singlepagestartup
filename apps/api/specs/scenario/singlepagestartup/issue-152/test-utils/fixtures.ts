import type { IModel as ICurrency } from "@sps/billing/models/currency/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import { expectOk, requestApi } from "./http";

type TSubjectOrder = {
  id: string;
  type: string;
  status: string;
};

type TOrderListPayload = {
  data?: TSubjectOrder[];
};

async function deleteEntity(path: string, id: string): Promise<void> {
  await requestApi({
    method: "DELETE",
    path: `${path}/${id}`,
    includeSecret: true,
  });
}

export type TCartScenarioFixtures = {
  currency: ICurrency;
  store: IStore;
  product: IProduct;
  currencyId: string;
  storeId: string;
  productId: string;
  attributeId: string;
  attributeKeyId: string;
  productsToAttributesId: string;
  attributeKeysToAttributesId: string;
  attributesToBillingModuleCurrenciesId: string;
  cleanup: () => Promise<void>;
};

export async function createCartScenarioFixtures(): Promise<TCartScenarioFixtures> {
  const cleanupTasks: Array<() => Promise<void>> = [];

  async function createRecord<T extends { id: string }>(
    path: string,
    data: Record<string, unknown>,
    shared = false,
  ): Promise<T> {
    const result = await expectOk<{ data?: T }>({
      method: "POST",
      path,
      includeSecret: true,
      data,
    });
    const record = result.payload?.data;

    if (!record?.id) {
      throw new Error(
        `Create response does not contain entity id for ${path}: ${JSON.stringify(result.payload)}`,
      );
    }
    if (!shared) {
      cleanupTasks.unshift(() => deleteEntity(path, record.id));
    }

    return record;
  }

  async function cleanup() {
    for (const task of cleanupTasks) {
      try {
        await task();
      } catch {
        // Cleanup is best effort to keep test reruns resilient.
      }
    }
  }

  const randomSuffix = Date.now().toString(36);

  try {
    const currency = await createRecord<ICurrency>("/api/billing/currencies", {
      slug: `scenario-currency-${randomSuffix}`,
      symbol: "$",
      title: `scenario-currency-${randomSuffix}`,
      isDefault: false,
    });
    const store = await createRecord<IStore>("/api/ecommerce/stores", {});
    const product = await createRecord<IProduct>("/api/ecommerce/products", {});
    const offer = await createRecord("/api/ecommerce/stores-to-products", {
      storeId: store.id,
      productId: product.id,
      sku: `scenario-offer-${randomSuffix}`,
      variant: "default",
    });

    const price = await createRecord("/api/ecommerce/attributes", {
      number: "200",
    });
    const priceKey = await createRecord("/api/ecommerce/attribute-keys", {
      type: "price",
      field: "number",
    });

    const productPrice = await createRecord(
      "/api/ecommerce/products-to-attributes",
      { productId: product.id, attributeId: price.id },
    );
    await createRecord("/api/ecommerce/stores-to-products-to-attributes", {
      storesToProductsId: offer.id,
      attributeId: price.id,
    });
    const priceKeyLink = await createRecord(
      "/api/ecommerce/attribute-keys-to-attributes",
      { attributeKeyId: priceKey.id, attributeId: price.id },
    );
    const priceCurrency = await createRecord(
      "/api/ecommerce/attributes-to-billing-module-currencies",
      { attributeId: price.id, billingModuleCurrencyId: currency.id },
    );

    for (const [slug, text] of [
      ["price_formula", "unit_price * quantity"],
      ["formula_version", "1"],
    ]) {
      // Canonical attribute keys are shared across products and offers.
      const key = await createRecord(
        "/api/ecommerce/attribute-keys/find-or-create",
        { slug, type: "feature", field: "string" },
        true,
      );
      const value = await createRecord("/api/ecommerce/attributes", {
        string: { en: text },
      });
      await createRecord("/api/ecommerce/attribute-keys-to-attributes", {
        attributeKeyId: key.id,
        attributeId: value.id,
      });
      await createRecord("/api/ecommerce/products-to-attributes", {
        productId: product.id,
        attributeId: value.id,
      });
    }

    return {
      currency,
      store,
      product,
      currencyId: currency.id,
      storeId: store.id,
      productId: product.id,
      attributeId: price.id,
      attributeKeyId: priceKey.id,
      productsToAttributesId: productPrice.id,
      attributeKeysToAttributesId: priceKeyLink.id,
      attributesToBillingModuleCurrenciesId: priceCurrency.id,
      cleanup,
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

export async function createCartOrder({
  subjectId,
  jwt,
  productId,
  storeId,
  currencyId,
  quantity,
}: {
  subjectId: string;
  jwt: string;
  productId: string;
  storeId: string;
  currencyId: string;
  quantity: number;
}) {
  return expectOk({
    method: "POST",
    path: `/api/rbac/subjects/${subjectId}/ecommerce-module/orders`,
    token: jwt,
    data: {
      productId,
      quantity,
      storeId,
      billingModule: {
        currency: {
          id: currencyId,
        },
      },
    },
  });
}

export async function getCartOrders({
  subjectId,
  jwt,
}: {
  subjectId: string;
  jwt: string;
}): Promise<TSubjectOrder[]> {
  const cacheBust = Date.now();

  return getCartOrdersRaw({
    subjectId,
    jwt,
    querySuffix: `?cb=${cacheBust}`,
  });
}

export async function getCartOrdersRaw({
  subjectId,
  jwt,
  querySuffix = "",
}: {
  subjectId: string;
  jwt: string;
  querySuffix?: string;
}): Promise<TSubjectOrder[]> {
  const result = await expectOk<TOrderListPayload>({
    method: "GET",
    path: `/api/rbac/subjects/${subjectId}/ecommerce-module/orders${querySuffix}`,
    token: jwt,
  });

  return result.payload?.data || [];
}

export async function getCartQuantity({
  subjectId,
  jwt,
}: {
  subjectId: string;
  jwt: string;
}): Promise<number> {
  const cacheBust = Date.now();

  return getCartQuantityRaw({
    subjectId,
    jwt,
    querySuffix: `?cb=${cacheBust}`,
  });
}

export async function getCartQuantityRaw({
  subjectId,
  jwt,
  querySuffix = "",
}: {
  subjectId: string;
  jwt: string;
  querySuffix?: string;
}): Promise<number> {
  const result = await expectOk<{ data?: number }>({
    method: "GET",
    path: `/api/rbac/subjects/${subjectId}/ecommerce-module/orders/quantity${querySuffix}`,
    token: jwt,
  });

  return result.payload?.data || 0;
}

export async function clearSubjectCartOrders({
  subjectId,
  jwt,
}: {
  subjectId: string;
  jwt: string;
}) {
  const orders = await getCartOrders({
    subjectId,
    jwt,
  });

  for (const order of orders) {
    await requestApi({
      method: "DELETE",
      path: `/api/rbac/subjects/${subjectId}/ecommerce-module/orders/${order.id}`,
      token: jwt,
    });
  }
}
