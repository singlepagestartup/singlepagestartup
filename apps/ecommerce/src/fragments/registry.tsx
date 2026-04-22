import {
  extractFragmentRootHtml,
  findFragmentRouteHandler,
  firstSearchParam,
  FragmentRouteHandlerInput,
  FragmentRouteRegistry,
  SpsComponentTarget,
} from "@sps/shared-fragments";
import { Component as ProductDefault } from "@sps/ecommerce/models/product/frontend/component/src/lib/singlepage/default/Component";
import { Component as CategoryListWidgetDefault } from "@sps/ecommerce/models/widget/frontend/component/src/lib/singlepage/category/list-default/Component";
import { Component as ProductListWidgetDefault } from "@sps/ecommerce/models/widget/frontend/component/src/lib/singlepage/product/list-default/Component";
import { Component as ProductOverviewWidgetDefault } from "@sps/ecommerce/models/widget/frontend/component/src/lib/singlepage/product/overview-default/Component";
import { Component as StoreListWidgetDefault } from "@sps/ecommerce/models/widget/frontend/component/src/lib/singlepage/store/list-default/Component";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as widgetApi } from "@sps/ecommerce/models/widget/sdk/server";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function first(value: unknown[]) {
  return value[0] as UnknownRecord | undefined;
}

async function findProducts(filters?: UnknownRecord[]) {
  return ((await productApi
    .find({
      params: filters
        ? {
            filters: {
              and: filters,
            },
          }
        : undefined,
      catchErrors: true,
    } as any)
    .catch(() => undefined)) || []) as UnknownRecord[];
}

async function findProductBySlug(slug: string) {
  return first(
    await findProducts([
      {
        column: "slug",
        method: "eq",
        value: slug,
      },
    ]),
  );
}

async function findProductById(id: string) {
  return first(
    await findProducts([
      {
        column: "id",
        method: "eq",
        value: id,
      },
    ]),
  );
}

function productSlugFromUrl(url: string) {
  const segments = url.split("/").filter(Boolean);
  const productsIndex = segments.findIndex((segment) => segment === "products");

  return productsIndex === -1 ? undefined : segments[productsIndex + 1];
}

function rbacOrigin() {
  return (
    process.env.SPS_RBAC_ORIGIN ||
    process.env.RBAC_FRAGMENT_ORIGIN ||
    "http://localhost:3011"
  );
}

function rbacFragmentUrl(props: {
  className?: string;
  contextUrl: string;
  language: string;
  product: UnknownRecord;
  variant: string;
}) {
  const url = new URL(
    `/sps/fragments/model/subject/${encodeURIComponent(props.variant)}`,
    rbacOrigin(),
  );

  url.searchParams.set("className", props.className || "w-full");
  url.searchParams.set("contextUrl", props.contextUrl);
  url.searchParams.set("language", props.language);
  url.searchParams.set("product", JSON.stringify(props.product));

  return url.toString();
}

async function fetchFragmentHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return "";
  }

  return extractFragmentRootHtml(await response.text());
}

async function renderProductActions(input: FragmentRouteHandlerInput) {
  const recipe = firstSearchParam(input.searchParams, "recipe");
  const product = asRecord(input.data);

  if (recipe !== "ecommerce-product-actions" || !product.id) {
    return null;
  }

  const variants = [
    "ecommerce-module-product-cart-default",
    "ecommerce-module-product-checkout-default",
  ];

  const fragments = await Promise.all(
    variants.map((variant) =>
      fetchFragmentHtml(
        rbacFragmentUrl({
          contextUrl: input.contextUrl,
          language: input.language,
          product,
          variant,
        }),
      ),
    ),
  );

  return (
    <>
      {fragments.map((html, index) => {
        if (!html) {
          return null;
        }

        return (
          <div
            key={index}
            data-sps-slot-fragment
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </>
  );
}

async function renderProductCard(
  product: UnknownRecord,
  input: FragmentRouteHandlerInput,
) {
  const actions = await renderProductActions({
    ...input,
    data: product,
  });

  return (
    <ProductDefault
      isServer={true}
      variant="default"
      data={product as any}
      language={input.language}
    >
      {actions}
    </ProductDefault>
  );
}

async function renderProductDefault(input: FragmentRouteHandlerInput) {
  const entityId = firstSearchParam(input.searchParams, "entityId");
  const productId = firstSearchParam(input.searchParams, "productId");
  const slug =
    firstSearchParam(input.searchParams, "slug") ||
    productSlugFromUrl(input.contextUrl);

  const product =
    asRecord(input.data).id && input.data
      ? asRecord(input.data)
      : entityId || productId
        ? await findProductById(entityId || productId || "")
        : slug
          ? await findProductBySlug(slug)
          : undefined;

  if (!product) {
    return null;
  }

  return await renderProductCard(product, input);
}

async function renderProductListWidget(input: FragmentRouteHandlerInput) {
  const widget = asRecord(input.data);
  const products = await findProducts();

  return (
    <ProductListWidgetDefault
      isServer={true}
      variant="product-list-default"
      data={widget as any}
      language={input.language}
    >
      {await Promise.all(
        products.map((product) => renderProductCard(product, input)),
      )}
    </ProductListWidgetDefault>
  );
}

async function renderProductOverviewWidget(input: FragmentRouteHandlerInput) {
  const widget = asRecord(input.data);
  const slug = productSlugFromUrl(input.contextUrl);
  const product = slug ? await findProductBySlug(slug) : undefined;

  return (
    <ProductOverviewWidgetDefault
      isServer={true}
      variant="product-overview-default"
      data={widget as any}
      language={input.language}
    >
      {product ? await renderProductCard(product, input) : null}
    </ProductOverviewWidgetDefault>
  );
}

async function renderCategoryListWidget(input: FragmentRouteHandlerInput) {
  return (
    <CategoryListWidgetDefault
      isServer={true}
      variant="category-list-default"
      data={asRecord(input.data) as any}
      language={input.language}
    />
  );
}

async function renderStoreListWidget(input: FragmentRouteHandlerInput) {
  return (
    <StoreListWidgetDefault
      isServer={true}
      variant="store-list-default"
      data={asRecord(input.data) as any}
      language={input.language}
    />
  );
}

async function renderWidgetDefault(input: FragmentRouteHandlerInput) {
  const externalWidgetId = firstSearchParam(
    input.searchParams,
    "externalWidgetId",
  );

  if (!externalWidgetId) {
    return null;
  }

  const widget = await widgetApi
    .findById({
      id: externalWidgetId,
      catchErrors: true,
    } as any)
    .catch(() => undefined);

  if (!widget?.variant) {
    return null;
  }

  const target: SpsComponentTarget = {
    kind: "model",
    name: "widget",
    variant: widget.variant,
  };
  const handler = findFragmentRouteHandler(ecommerceFragmentRegistry, target);

  return handler
    ? await handler({
        ...input,
        data: widget,
      })
    : null;
}

export const ecommerceFragmentRegistry = {
  model: {
    product: {
      default: renderProductDefault,
    },
    widget: {
      default: renderWidgetDefault,
      "category-list-default": renderCategoryListWidget,
      "product-list-default": renderProductListWidget,
      "product-overview-default": renderProductOverviewWidget,
      "store-list-default": renderStoreListWidget,
    },
  },
} satisfies FragmentRouteRegistry;
