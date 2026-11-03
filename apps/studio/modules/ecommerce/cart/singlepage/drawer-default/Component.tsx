import type { IComponentProps, CartDrawerDefaultProps } from "./interface";
export type { CartDrawerDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  useState as useStatePresentation,
  useRef,
  forwardRef,
  type SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useEffect,
  useState,
} from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as Product } from "../../../product/index";
import * as Dialog from "@radix-ui/react-dialog";
import {
  defaultCartItems,
  formatCartMoney,
  getCartTotals,
  type CartItem,
} from "../../shared";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
interface IConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  portalContainer?: HTMLElement | null;
}
function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  portalContainer,
}: IConfirmationDialogProps) {
  const [portal, setPortal] = useStatePresentation<HTMLElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <div ref={setPortal}>
      <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialog.Portal container={portalContainer ?? portal}>
          <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
          <AlertDialog.Content
            className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 font-default text-foreground shadow-xl"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current = document.activeElement as HTMLElement;
              cancel.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocus.current?.isConnected) returnFocus.current.focus();
              else portalContainer?.focus();
            }}
          >
            <AlertDialog.Title className="text-xl font-semibold">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description
              className={`mt-3 text-sm leading-6 ${kit.muted}`}
            >
              {description}
            </AlertDialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button ref={cancel} variant="secondary">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="danger" onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function CartDrawerDefault(props?: IComponentProps) {
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
        data-module="ecommerce"
        data-model="cart"
        data-variant={props?.variant ?? "drawer-default"}
      >
        <Dialog.Overlay className="absolute inset-0 bg-default/55" />
        <Dialog.Content asChild>
          <aside className="relative flex h-full w-full max-w-lg flex-col rounded-l-3xl bg-card shadow-2xl">
            <Dialog.Description className="sr-only">
              Review items, adjust quantities and continue to checkout.
            </Dialog.Description>
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-card px-6">
              <div className="flex items-center gap-3">
                <Dialog.Title className="text-2xl font-semibold text-foreground">
                  Cart
                </Dialog.Title>
                {totals.itemCount > 0 ? (
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary text-primary-foreground px-2 text-sm font-semibold">
                    {totals.itemCount}
                  </span>
                ) : null}
              </div>
              <button
                aria-label="Close cart"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    Your cart is empty
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Browse products and add something you like.
                  </p>
                </div>
                <a
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground no-underline transition hover:bg-muted"
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
                  <ul className="divide-y divide-border">
                    {items.map((item) => (
                      <li key={item.id} className="py-5 first:pt-0 last:pb-0">
                        <Product
                          variant="cart-default"
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

                <div className="shrink-0 border-t border-border bg-card px-6 py-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Subtotal ({totals.itemCount}{" "}
                        {totals.itemCount === 1 ? "item" : "items"})
                      </span>
                      <span>{formatCartMoney(totals.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Consultation discount</span>
                      <span className="text-foreground">-10%</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base text-foreground">Total</span>
                        <span className="text-3xl font-semibold text-foreground">
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
const X = createIcon("x");
const Package = createIcon("package");
const ArrowRight = createIcon("arrow-right");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-primary text-primary-foreground enabled:hover:brightness-95 ${focus}`,
  danger: `${buttonBase} border border-destructive-border bg-destructive-surface text-destructive enabled:hover:brightness-95 ${focus}`,
  muted: "text-muted-foreground",
};
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-product-slug--default";
export const defaultCartDrawerDefaultProps: CartDrawerDefaultProps = {
  items: defaultCartItems,
  isOpen: true,
  checkoutHref:
    "/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-ecommerce-module-order-checkout--default",
  productsHref:
    "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-product-find--default",
};
