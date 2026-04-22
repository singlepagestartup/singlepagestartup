import {
  firstSearchParam,
  FragmentRouteHandlerInput,
  FragmentRouteRegistry,
} from "@sps/shared-fragments";
import { Component as ProductCartDefault } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/Component";
import { Component as ProductCheckoutDefault } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/checkout-default/Component";

type UnknownRecord = Record<string, unknown>;

function parseJsonParam(value: string | undefined) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as UnknownRecord;
  } catch {
    return {};
  }
}

function subjectData(input: FragmentRouteHandlerInput) {
  return {
    id: firstSearchParam(input.searchParams, "subjectId") || "",
  };
}

function productData(input: FragmentRouteHandlerInput) {
  return parseJsonParam(firstSearchParam(input.searchParams, "product"));
}

async function renderProductCart(input: FragmentRouteHandlerInput) {
  return (
    <ProductCartDefault
      isServer={true}
      variant="ecommerce-module-product-cart-default"
      data={subjectData(input) as any}
      product={productData(input) as any}
      language={input.language}
      className={firstSearchParam(input.searchParams, "className") || "w-full"}
    />
  );
}

async function renderProductCheckout(input: FragmentRouteHandlerInput) {
  return (
    <ProductCheckoutDefault
      isServer={true}
      variant="ecommerce-module-product-checkout-default"
      data={subjectData(input) as any}
      product={productData(input) as any}
      language={input.language}
      className={firstSearchParam(input.searchParams, "className") || "w-full"}
    />
  );
}

export const rbacFragmentRegistry = {
  model: {
    subject: {
      "ecommerce-module-product-cart-default": renderProductCart,
      "ecommerce-module-product-checkout-default": renderProductCheckout,
    },
  },
} satisfies FragmentRouteRegistry;
