import { useState } from "react";

import { CartButtonDefault } from "../../../../../ecommerce/models/cart/singlepage/button-default/Component";
import { CartDrawerDefault } from "../../../../../ecommerce/models/cart/singlepage/drawer-default/Component";
import {
  defaultCartItems,
  getCartTotals,
} from "../../../../../ecommerce/models/cart/shared";
import {
  NavbarDefault,
  type NavbarDefaultProps,
} from "../../../../../website-builder/models/widget/singlepage/navbar-default/Component";

export function HostNavbarDefault(props?: Partial<NavbarDefaultProps>) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartCount =
    props?.cartCount ?? getCartTotals(defaultCartItems).itemCount;

  function handleCartClick() {
    props?.onCartClick?.();
    setIsCartOpen(true);
  }

  return (
    <>
      <NavbarDefault
        {...props}
        cartButton={
          <CartButtonDefault count={cartCount} onClick={handleCartClick} />
        }
        cartCount={cartCount}
        onCartClick={handleCartClick}
      />
      <CartDrawerDefault
        items={defaultCartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}
