import { useState } from "react";

import { CartButtonDefault } from "../../../../../ecommerce/models/cart/singlepage/button-default/Component";
import { CartDrawerDefault } from "../../../../../ecommerce/models/cart/singlepage/drawer-default/Component";
import {
  type CartItem,
  websiteDevelopmentCartItem,
} from "../../../../../ecommerce/models/cart/shared";
import { ProductOverviewDefault } from "../../../../../ecommerce/models/product/singlepage/overview-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { NavbarDefault } from "../../../../../website-builder/models/widget/singlepage/navbar-default/Component";

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

export function EcommerceCartFlowDefault() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartCount = getItemCount(items);

  function handleAddToCart(item: Omit<CartItem, "quantity">, quantity: number) {
    setItems((currentItems) => upsertCartItem(currentItems, item, quantity));
    setIsCartOpen(true);
  }

  function handleIncrease(item: CartItem) {
    setItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem,
      ),
    );
  }

  function handleDecrease(item: CartItem) {
    setItems((currentItems) => decreaseCartItem(currentItems, item));
  }

  function handleRemove(item: CartItem) {
    setItems((currentItems) =>
      currentItems.filter((cartItem) => cartItem.id !== item.id),
    );
  }

  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.ecommerce-cart-flow-default"
    >
      <NavbarDefault
        activeHref="/ecommerce/products"
        cartButton={
          <CartButtonDefault
            count={cartCount}
            onClick={() => setIsCartOpen(true)}
          />
        }
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />
      <ProductOverviewDefault
        purchase={{
          id: websiteDevelopmentCartItem.id,
          slug: websiteDevelopmentCartItem.slug,
          image: websiteDevelopmentCartItem.image,
          title: websiteDevelopmentCartItem.title,
          priceLabel: websiteDevelopmentCartItem.priceLabel,
          price: websiteDevelopmentCartItem.price,
          onAddToCart: handleAddToCart,
        }}
      />
      <FooterCompact />
      <CartDrawerDefault
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
