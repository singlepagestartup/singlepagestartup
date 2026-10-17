"use client";
import type { IComponentProps, IWebsiteLayoutProps } from "./interface";
export type { IWebsiteLayoutProps } from "./interface";

import { useCallback, useState, type ReactNode } from "react";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import { Component as EcommerceModuleCart } from "../../../../ecommerce/cart/index";
import {
  defaultCartItems,
  getCartTotals,
  type CartItem,
} from "../../../../ecommerce/cart/shared";

export function Component({
  variant = "website",
  children,
  activeHref = "/",
  footer = "compact",
  signedIn,
  subjectAccount,
  cartButton,
  cartDrawer,
  cartCount,
}: IComponentProps = {}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>(() =>
    defaultCartItems.map((item) => ({ ...item })),
  );
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const clearCart = useCallback(() => setItems([]), []);
  const increase = useCallback(
    (item: CartItem) =>
      setItems((current) =>
        current.map((value) =>
          value.id === item.id
            ? { ...value, quantity: value.quantity + 1 }
            : value,
        ),
      ),
    [],
  );
  const decrease = useCallback(
    (item: CartItem) =>
      setItems((current) =>
        current
          .map((value) =>
            value.id === item.id
              ? { ...value, quantity: value.quantity - 1 }
              : value,
          )
          .filter((value) => value.quantity > 0),
      ),
    [],
  );
  const remove = useCallback(
    (item: CartItem) =>
      setItems((current) => current.filter((value) => value.id !== item.id)),
    [],
  );
  return (
    <div
      data-ds-block="host.layout.website"
      className="flex min-h-screen min-w-0 flex-col bg-muted text-foreground antialiased"
      data-module="host"
      data-model="layout"
      data-variant={variant}
    >
      <WebsiteBuilderModuleWidget
        variant="navbar-default"
        activeHref={activeHref}
        subjectAccount={
          subjectAccount === undefined ? (
            <RbacModuleSubject variant="me-account" signedIn={signedIn} />
          ) : (
            subjectAccount
          )
        }
        cartButton={
          cartButton === undefined ? (
            <EcommerceModuleCart
              variant="button-default"
              count={cartCount ?? getCartTotals(items).itemCount}
              onClick={openCart}
            />
          ) : (
            cartButton
          )
        }
      />
      <div className="min-w-0 flex-1">{children}</div>
      <WebsiteBuilderModuleWidget
        variant={footer === "default" ? "footer-default" : "footer-compact"}
      />
      {cartDrawer ??
        (cartButton === undefined && (
          <EcommerceModuleCart
            variant="drawer-default"
            items={items}
            isOpen={open}
            onClose={closeCart}
            onIncrease={increase}
            onDecrease={decrease}
            onRemove={remove}
            onClear={clearCart}
          />
        ))}
    </div>
  );
}
