import { Component as EcommerceModuleCart } from "../../../../ecommerce/cart";
import {
  Component as WebsiteBuilderModuleWidget,
  type NavbarDefaultProps,
} from "../../../../website-builder/widget";
import { useCallback, useEffect, useState } from "react";

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
      <WebsiteBuilderModuleWidget
        {...props}
        variant="navbar-default"
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
          <EcommerceModuleCart
            variant="button-default"
            count={cartCount}
            onClick={handleCartClick}
          />
        }
        cartCount={cartCount}
        isAuthenticated={isAuthenticated}
        onCartClick={handleCartClick}
        onLogout={handleLogout}
      />
      <EcommerceModuleCart
        variant="drawer-default"
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
