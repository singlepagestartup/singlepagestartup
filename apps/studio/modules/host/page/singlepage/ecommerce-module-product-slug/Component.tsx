import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as EcommerceModuleCart } from "../../../../ecommerce/cart/index";
import { defaultProductOverviewDefaultProps } from "../../../../ecommerce/product/index";
import { Component as Widget } from "../../../widget/index";
import { Component as Layout } from "../../../layout/index";
import { useCallback, useState } from "react";

import {
  type CartItem,
  websiteDevelopmentCartItem,
} from "../../../../ecommerce/cart/shared";

function getItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function upsertCartItem(
  items: CartItem[],
  item: Omit<CartItem, "quantity">,
  quantity: number,
) {
  const existingItem = items.find((cartItem) => cartItem.id === item.id);

  if (!existingItem) {
    return [...items, { ...item, quantity }];
  }

  return items.map((cartItem) =>
    cartItem.id === item.id
      ? { ...cartItem, quantity: cartItem.quantity + quantity }
      : cartItem,
  );
}

function decreaseCartItem(items: CartItem[], item: CartItem) {
  return items
    .map((cartItem) =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: cartItem.quantity - 1 }
        : cartItem,
    )
    .filter((cartItem) => cartItem.quantity > 0);
}

const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-product-slug--default";

const productOverviewRelatedProducts =
  defaultProductOverviewDefaultProps.related.map((product) => ({
    ...product,
    href: productOverviewStoryHref,
    target: "_top" as const,
  }));

export function EcommerceCartFlowDefault({
  variant = "ecommerce-module-product-slug",
}: IComponentProps = {}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartCount = getItemCount(items);

  const handleAddToCart = useCallback(
    (item: Omit<CartItem, "quantity">, quantity: number) => {
      setItems((currentItems) => upsertCartItem(currentItems, item, quantity));
      setIsCartOpen(true);
    },
    [],
  );

  const handleIncrease = useCallback((item: CartItem) => {
    setItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem,
      ),
    );
  }, []);

  const handleDecrease = useCallback((item: CartItem) => {
    setItems((currentItems) => decreaseCartItem(currentItems, item));
  }, []);

  const handleRemove = useCallback((item: CartItem) => {
    setItems((currentItems) =>
      currentItems.filter((cartItem) => cartItem.id !== item.id),
    );
  }, []);

  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="website"
        activeHref="/ecommerce/products"
        cartButton={
          <EcommerceModuleCart
            variant="button-default"
            count={cartCount}
            onClick={() => setIsCartOpen(true)}
          />
        }
        cartDrawer={
          <EcommerceModuleCart
            variant="drawer-default"
            items={items}
            isOpen={isCartOpen}
            onClear={() => setItems([])}
            onClose={() => setIsCartOpen(false)}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
            onRemove={handleRemove}
          />
        }
      >
        <main
          className="min-w-0"
          data-ds-page="host.page.ecommerce-module-product-slug"
        >
          <Widget
            variant="default"
            externalModule="ecommerce"
            productProps={{
              related: productOverviewRelatedProducts,
              purchase: {
                id: websiteDevelopmentCartItem.id,
                slug: websiteDevelopmentCartItem.slug,
                image: websiteDevelopmentCartItem.image,
                title: websiteDevelopmentCartItem.title,
                priceLabel: websiteDevelopmentCartItem.priceLabel,
                price: websiteDevelopmentCartItem.price,
                onAddToCart: handleAddToCart,
              },
            }}
          />
        </main>
      </Layout>
    </div>
  );
}
