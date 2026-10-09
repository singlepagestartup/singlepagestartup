import { ConfirmationDialog } from "../../../../../workspace/design/singlepage/interface-kit/Confirmation";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  ArrowRight,
  Package,
  X,
} from "../../../../../workspace/utils/components/ModuleIcons";

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
  const [clearOpen, setClearOpen] = useState(false);
  const totals = getCartTotals(items);
  const [demoOpen, setDemoOpen] = useState(isOpen);
  useEffect(() => setDemoOpen(isOpen), [isOpen]);
  const open = isOpen && (onClose ? true : demoOpen);

  if (!open) {
    return null;
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose?.();
          setDemoOpen(false);
        }
      }}
    >
      <div
        className="fixed inset-0 z-[100] flex justify-end"
        data-ds-block="ecommerce.cart.drawer-default"
        data-ds-imports="ecommerce.product.cart-default"
        data-ds-layer="singlepage"
      >
        <Dialog.Overlay className="absolute inset-0 bg-[var(--workspace-brand-primary)]/55" />
        <Dialog.Content asChild>
          <aside className="relative flex h-full w-full max-w-lg flex-col rounded-l-3xl bg-[var(--workspace-brand-surface)] shadow-2xl">
            <Dialog.Description className="sr-only">
              Review items, adjust quantities and continue to checkout.
            </Dialog.Description>
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-6">
              <div className="flex items-center gap-3">
                <Dialog.Title className="text-2xl font-semibold text-[var(--workspace-brand-foreground)]">
                  Cart
                </Dialog.Title>
                {totals.itemCount > 0 ? (
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--workspace-brand-accent)] px-2 text-sm font-semibold text-[var(--workspace-brand-on-accent)]">
                    {totals.itemCount}
                  </span>
                ) : null}
              </div>
              <button
                aria-label="Close cart"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)] shadow-sm transition hover:text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
                onClick={() => {
                  onClose?.();
                  setDemoOpen(false);
                }}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]">
                  <Package className="h-5 w-5 text-[var(--workspace-brand-muted)]" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-[var(--workspace-brand-foreground)]">
                    Your cart is empty
                  </p>
                  <p className="mt-2 text-sm text-[var(--workspace-brand-muted)]">
                    Browse products and add something you like.
                  </p>
                </div>
                <a
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                  href={productsHref}
                  target="_top"
                >
                  Browse products
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                  <ul className="divide-y divide-[var(--workspace-brand-line)]">
                    {items.map((item) => (
                      <li key={item.id} className="py-5 first:pt-0 last:pb-0">
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

                <div className="shrink-0 border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-6 py-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-[var(--workspace-brand-muted)]">
                      <span>
                        Subtotal ({totals.itemCount}{" "}
                        {totals.itemCount === 1 ? "item" : "items"})
                      </span>
                      <span>{formatCartMoney(totals.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-[var(--workspace-brand-muted)]">
                      <span>Consultation discount</span>
                      <span className="text-[var(--workspace-brand-foreground)]">
                        -10%
                      </span>
                    </div>
                    <div className="border-t border-[var(--workspace-brand-line)] pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base text-[var(--workspace-brand-foreground)]">
                          Total
                        </span>
                        <span className="text-3xl font-semibold text-[var(--workspace-brand-foreground)]">
                          {formatCartMoney(totals.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    className={kit.button + " mt-6 w-full"}
                    href={checkoutHref}
                    target="_top"
                  >
                    Proceed to checkout
                  </a>
                  <button
                    className={kit.danger + " mt-3 w-full"}
                    onClick={() => setClearOpen(true)}
                    type="button"
                  >
                    Clear cart
                  </button>
                </div>
              </>
            )}
            <ConfirmationDialog
              open={clearOpen}
              onOpenChange={setClearOpen}
              title="Clear cart?"
              description={`Remove all ${items.length} items from your cart? You can add products again from Services.`}
              confirmLabel="Clear cart"
              onConfirm={() => onClear?.()}
            />
          </aside>
        </Dialog.Content>
      </div>
    </Dialog.Root>
  );
}
