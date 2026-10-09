import { useCallback, useEffect, useState } from "react";

import { CartButtonDefault } from "../../../../ecommerce/cart/singlepage/button-default/Component";
import { CartDrawerDefault } from "../../../../ecommerce/cart/singlepage/drawer-default/Component";
import {
  defaultCartItems,
  getCartTotals,
  type CartItem,
} from "../../../../ecommerce/cart/shared";
import {
  clearRbacStudioAuthUser,
  RBAC_STUDIO_AUTH_CHANGE_EVENT,
  readRbacStudioAuthUser,
} from "../../../../rbac/shared";
import {
  NavbarDefault,
  type NavbarDefaultProps,
} from "../../../../website-builder/widget/singlepage/navbar-default/Component";

const authorProfileStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-authors-social-profiles-slug--default";

export function HostNavbarDefault(props?: Partial<NavbarDefaultProps>) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>(() =>
    defaultCartItems.map((item) => ({ ...item })),
  );
  const [authUser, setAuthUser] = useState(() => readRbacStudioAuthUser());
  const cartCount = props?.cartCount ?? getCartTotals(items).itemCount;
  const isAuthenticated = props?.isAuthenticated ?? Boolean(authUser);
  const handleIncrease = useCallback((item: CartItem) => {
    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, quantity: currentItem.quantity + 1 }
          : currentItem,
      ),
    );
  }, []);
  const handleDecrease = useCallback((item: CartItem) => {
    setItems((currentItems) =>
      currentItems
        .map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, quantity: currentItem.quantity - 1 }
            : currentItem,
        )
        .filter((currentItem) => currentItem.quantity > 0),
    );
  }, []);
  const handleRemove = useCallback((item: CartItem) => {
    setItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== item.id),
    );
  }, []);
  const handleClear = useCallback(() => setItems([]), []);
  const handleClose = useCallback(() => setIsCartOpen(false), []);

  useEffect(() => {
    function syncAuthUser() {
      setAuthUser(readRbacStudioAuthUser());
    }

    syncAuthUser();
    window.addEventListener("storage", syncAuthUser);
    window.addEventListener(RBAC_STUDIO_AUTH_CHANGE_EVENT, syncAuthUser);

    return () => {
      window.removeEventListener("storage", syncAuthUser);
      window.removeEventListener(RBAC_STUDIO_AUTH_CHANGE_EVENT, syncAuthUser);
    };
  }, []);

  function handleCartClick() {
    props?.onCartClick?.();
    setIsCartOpen(true);
  }

  function handleLogout() {
    props?.onLogout?.();
    clearRbacStudioAuthUser();
    setAuthUser(null);
  }

  return (
    <>
      <NavbarDefault
        {...props}
        authUser={
          authUser
            ? {
                name: authUser.name,
                email: authUser.email,
                role: authUser.role,
                avatar: authUser.avatar,
                profileHref: "/blog/authors/[social.profiles.slug]",
                profileStoryHref: authorProfileStoryHref,
              }
            : props?.authUser
        }
        cartButton={
          <CartButtonDefault count={cartCount} onClick={handleCartClick} />
        }
        cartCount={cartCount}
        isAuthenticated={isAuthenticated}
        onCartClick={handleCartClick}
        onLogout={handleLogout}
      />
      <CartDrawerDefault
        items={items}
        isOpen={isCartOpen}
        onClose={handleClose}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        onRemove={handleRemove}
        onClear={handleClear}
      />
    </>
  );
}
