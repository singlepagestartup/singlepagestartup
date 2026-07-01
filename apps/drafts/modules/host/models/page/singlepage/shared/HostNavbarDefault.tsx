import { useEffect, useState } from "react";

import { CartButtonDefault } from "../../../../../ecommerce/models/cart/singlepage/button-default/Component";
import { CartDrawerDefault } from "../../../../../ecommerce/models/cart/singlepage/drawer-default/Component";
import {
  defaultCartItems,
  getCartTotals,
} from "../../../../../ecommerce/models/cart/shared";
import {
  clearRbacDraftAuthUser,
  RBAC_DRAFT_AUTH_CHANGE_EVENT,
  readRbacDraftAuthUser,
} from "../../../../../rbac/shared";
import {
  NavbarDefault,
  type NavbarDefaultProps,
} from "../../../../../website-builder/models/widget/singlepage/navbar-default/Component";

const authorProfileStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-social-profile-find-by-id-overview-author--default";

export function HostNavbarDefault(props?: Partial<NavbarDefaultProps>) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authUser, setAuthUser] = useState(() => readRbacDraftAuthUser());
  const cartCount =
    props?.cartCount ?? getCartTotals(defaultCartItems).itemCount;
  const isAuthenticated = props?.isAuthenticated ?? Boolean(authUser);

  useEffect(() => {
    function syncAuthUser() {
      setAuthUser(readRbacDraftAuthUser());
    }

    syncAuthUser();
    window.addEventListener("storage", syncAuthUser);
    window.addEventListener(RBAC_DRAFT_AUTH_CHANGE_EVENT, syncAuthUser);

    return () => {
      window.removeEventListener("storage", syncAuthUser);
      window.removeEventListener(RBAC_DRAFT_AUTH_CHANGE_EVENT, syncAuthUser);
    };
  }, []);

  function handleCartClick() {
    props?.onCartClick?.();
    setIsCartOpen(true);
  }

  function handleLogout() {
    props?.onLogout?.();
    clearRbacDraftAuthUser();
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
        items={defaultCartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}
