import { ArrowRight, Package, ShoppingCart, X } from "lucide-react";

import { ProductCartDefault } from "../../../product/singlepage/cart-default/Component";
import {
  defaultCartItems,
  formatCartMoney,
  getCartTotals,
  type CartItem,
} from "../../shared";

const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-products-ecommerce-products-slug--default";

export interface CartDrawerDefaultProps {
  items: CartItem[];
  isOpen: boolean;
  checkoutHref: string;
  productsHref: string;
  onClose?: () => void;
  onClear?: () => void;
  onDecrease?: (item: CartItem) => void;
  onIncrease?: (item: CartItem) => void;
  onRemove?: (item: CartItem) => void;
}

export const defaultCartDrawerDefaultProps: CartDrawerDefaultProps = {
  items: defaultCartItems,
  isOpen: true,
  checkoutHref:
    "/?path=/story/modules-host-models-page-singlepage-rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout--default",
  productsHref:
    "/?path=/story/modules-host-models-page-singlepage-ecommerce-products--default",
};

export function CartDrawerDefault(props?: Partial<CartDrawerDefaultProps>) {
  const {
    items,
    isOpen,
    checkoutHref,
    productsHref,
    onClose,
    onClear,
    onDecrease,
    onIncrease,
    onRemove,
  } = {
    ...defaultCartDrawerDefaultProps,
    ...props,
  };
  const totals = getCartTotals(items);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-slate-900/55"
      data-ds-block="ecommerce.cart.drawer-default"
      data-ds-layer="singlepage"
    >
      <aside className="flex h-full w-full max-w-md flex-col bg-[#eaf0f7] shadow-2xl">
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-[#eaf0f7] px-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-slate-600" />
            <span className="text-xl text-slate-900">Cart</span>
            {totals.itemCount > 0 ? (
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-sm text-white">
                {totals.itemCount}
              </span>
            ) : null}
          </div>
          <button
            aria-label="Close cart"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-400 shadow-sm transition hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Package className="h-7 w-7 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-900">Your cart is empty</p>
              <p className="mt-1 text-xs text-slate-500">
                Browse products and add something you like.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
              href={productsHref}
              target="_top"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <ul className="space-y-6">
                {items.map((item) => (
                  <li key={item.id}>
                    <ProductCartDefault
                      href={productOverviewStoryHref}
                      item={item}
                      onDecrease={onDecrease}
                      onIncrease={onIncrease}
                      onRemove={onRemove}
                      target="_top"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-[#eaf0f7] px-6 py-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>
                    Subtotal ({totals.itemCount}{" "}
                    {totals.itemCount === 1 ? "item" : "items"})
                  </span>
                  <span>{formatCartMoney(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Consultation discount</span>
                  <span className="text-emerald-600">-10%</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-slate-900">Total</span>
                    <span className="text-3xl text-slate-900">
                      {formatCartMoney(totals.total)}
                    </span>
                  </div>
                </div>
              </div>

              <a
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-400 bg-slate-900 px-4 py-4 text-base text-white no-underline transition hover:bg-slate-800"
                href={checkoutHref}
                target="_top"
              >
                <ShoppingCart className="h-5 w-5" />
                Proceed to Checkout
              </a>
              <button
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                onClick={onClear}
                type="button"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
