"use client";
import { useCallback, useState, type ReactNode } from "react";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as RbacModuleSubject } from "../../../../rbac/subject";
import { Component as EcommerceModuleCart } from "../../../../ecommerce/cart";
import {
  defaultCartItems,
  getCartTotals,
  type CartItem,
} from "../../../../ecommerce/cart/shared";

export interface IWebsiteLayoutProps {
  children?: ReactNode;
  activeHref?: string;
  footer?: "default" | "compact";
  signedIn?: boolean;
  subjectAccount?: ReactNode;
  cartButton?: ReactNode;
  cartDrawer?: ReactNode;
  cartCount?: number;
}
export function Component({
  children,
  activeHref = "/",
  footer = "compact",
  signedIn,
  subjectAccount,
  cartButton,
  cartDrawer,
  cartCount,
}: IWebsiteLayoutProps = {}) {
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
      className="flex min-h-screen min-w-0 flex-col bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
    >
      <WebsiteBuilderModuleWidget
        variant="navbar-default"
        activeHref={activeHref}
        subjectAccount={
          subjectAccount === undefined ? (
            <RbacModuleSubject variant="account" signedIn={signedIn} />
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
