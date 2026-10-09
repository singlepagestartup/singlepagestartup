import { Component as EcommerceModuleCart } from "../../../../ecommerce/cart";
import { defaultProductOverviewDefaultProps } from "../../../../ecommerce/product";
import { Component as HostModuleWidget } from "../../../widget";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
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
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-products-ecommerce-products-slug--default";

const productOverviewRelatedProducts =
  defaultProductOverviewDefaultProps.related.map((product) => ({
    ...product,
    href: productOverviewStoryHref,
    target: "_top" as const,
  }));

export function EcommerceCartFlowDefault() {
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
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.ecommerce-products-ecommerce-products-slug"
    >
      <WebsiteBuilderModuleWidget
        variant="navbar-default"
        activeHref="/ecommerce/products"
        cartButton={
          <EcommerceModuleCart
            variant="button-default"
            count={cartCount}
            onClick={() => setIsCartOpen(true)}
          />
        }
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />
      <HostModuleWidget
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
      <WebsiteBuilderModuleWidget variant="footer-compact" />
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
    </main>
  );
}
