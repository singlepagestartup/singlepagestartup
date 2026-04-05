import { expectOk, requestApi } from "./http";

type TEntityPayload = {
  data?: {
    id?: string;
  };
};

type TSubjectOrder = {
  id: string;
  type: string;
  status: string;
};

type TOrderListPayload = {
  data?: TSubjectOrder[];
};

async function createEntity(
  path: string,
  data: Record<string, unknown>,
): Promise<string> {
  const result = await expectOk<TEntityPayload>({
    method: "POST",
    path,
    includeSecret: true,
    data,
  });

  const id = result.payload?.data?.id;

  if (!id) {
    throw new Error(
      `Create response does not contain entity id for ${path}: ${JSON.stringify(result.payload)}`,
    );
  }

  return id;
}

async function deleteEntity(path: string, id: string): Promise<void> {
  await requestApi({
    method: "DELETE",
    path: `${path}/${id}`,
    includeSecret: true,
  });
}

export type TCartScenarioFixtures = {
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

  const registerCleanup = (task: () => Promise<void>) => {
    cleanupTasks.unshift(task);
  };

  const randomSuffix = Date.now().toString(36);

  const currencyId = await createEntity("/api/billing/currencies", {
    slug: `scenario-currency-${randomSuffix}`,
    symbol: "$",
    title: `scenario-currency-${randomSuffix}`,
    isDefault: false,
  });
  registerCleanup(() => deleteEntity("/api/billing/currencies", currencyId));

  const storeId = await createEntity("/api/ecommerce/stores", {});
  registerCleanup(() => deleteEntity("/api/ecommerce/stores", storeId));

  const productId = await createEntity("/api/ecommerce/products", {});
  registerCleanup(() => deleteEntity("/api/ecommerce/products", productId));

  const attributeId = await createEntity("/api/ecommerce/attributes", {
    number: "200",
  });
  registerCleanup(() => deleteEntity("/api/ecommerce/attributes", attributeId));

  const attributeKeyId = await createEntity("/api/ecommerce/attribute-keys", {
    type: "price",
    field: "number",
  });
  registerCleanup(() =>
    deleteEntity("/api/ecommerce/attribute-keys", attributeKeyId),
  );

  const productsToAttributesId = await createEntity(
    "/api/ecommerce/products-to-attributes",
    {
      productId,
      attributeId,
    },
  );
  registerCleanup(() =>
    deleteEntity(
      "/api/ecommerce/products-to-attributes",
      productsToAttributesId,
    ),
  );

  const attributeKeysToAttributesId = await createEntity(
    "/api/ecommerce/attribute-keys-to-attributes",
    {
      attributeKeyId,
      attributeId,
    },
  );
  registerCleanup(() =>
    deleteEntity(
      "/api/ecommerce/attribute-keys-to-attributes",
      attributeKeysToAttributesId,
    ),
  );

  const attributesToBillingModuleCurrenciesId = await createEntity(
    "/api/ecommerce/attributes-to-billing-module-currencies",
    {
      attributeId,
      billingModuleCurrencyId: currencyId,
    },
  );
  registerCleanup(() =>
    deleteEntity(
      "/api/ecommerce/attributes-to-billing-module-currencies",
      attributesToBillingModuleCurrenciesId,
    ),
  );

  return {
    currencyId,
    storeId,
    productId,
    attributeId,
    attributeKeyId,
    productsToAttributesId,
    attributeKeysToAttributesId,
    attributesToBillingModuleCurrenciesId,
    cleanup: async () => {
      for (const task of cleanupTasks) {
        try {
          await task();
        } catch {
          // Cleanup is best effort to keep test reruns resilient.
        }
      }
    },
  };
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
