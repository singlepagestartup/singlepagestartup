import {
  Lock,
  ShieldCheck,
} from "../../../../../workspace/utils/components/ModuleIcons";

import {
  formatCartMoney,
  getCartTotals,
  type CartItem,
} from "../../../cart/shared";
import { ProductCartDefault } from "../../../product/singlepage/cart-default/Component";
import { defaultCheckoutItems } from "../../shared";

const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-products-ecommerce-products-slug--default";

export interface OrderSummaryDefaultProps {
  items: CartItem[];
  compact?: boolean;
  editable?: boolean;
  onDecrease?: (item: CartItem) => void;
  onIncrease?: (item: CartItem) => void;
  onRemove?: (item: CartItem) => void;
}

export const defaultOrderSummaryDefaultProps: OrderSummaryDefaultProps = {
  items: defaultCheckoutItems,
  compact: false,
  editable: true,
};

export function OrderSummaryDefault(props?: Partial<OrderSummaryDefaultProps>) {
  const { items, compact, editable, onDecrease, onIncrease, onRemove } = {
    ...defaultOrderSummaryDefaultProps,
    ...props,
  };
  const totals = getCartTotals(items);

  return (
    <aside
      className="min-w-0 overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]"
      data-ds-block="ecommerce.order.summary-default"
      data-ds-imports="ecommerce.product.cart-default"
      data-ds-layer="singlepage"
    >
      <div className="border-b border-[var(--workspace-brand-line)] px-6 py-5">
        <h3 className="text-xl font-semibold text-[var(--workspace-brand-foreground)]">
          Order summary
        </h3>
        <p className="mt-1 text-sm text-[var(--workspace-brand-muted)]">
          {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="px-6 py-8 text-sm text-[var(--workspace-brand-muted)]">
          Your order has no items.
        </p>
      ) : null}
      <ul className="divide-y divide-[var(--workspace-brand-line)] px-6">
        {items.map((item) => (
          <li key={item.id} className="py-5">
            <ProductCartDefault
              compact={compact}
              href={productOverviewStoryHref}
              item={item}
              onDecrease={onDecrease}
              onIncrease={onIncrease}
              onRemove={onRemove}
              showRemove={editable}
              target="_top"
            />
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-[var(--workspace-brand-line)] px-6 py-5">
        <div className="flex justify-between text-sm text-[var(--workspace-brand-muted)]">
          <span>Subtotal</span>
          <span>{formatCartMoney(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--workspace-brand-muted)]">
          <span>Consultation discount</span>
          <span className="text-[var(--workspace-brand-foreground)]">
            -{formatCartMoney(totals.discount)}
          </span>
        </div>
        <div className="flex justify-between text-sm text-[var(--workspace-brand-muted)]">
          <span>Tax</span>
          <span>$0</span>
        </div>
        <div className="rounded-2xl bg-[var(--workspace-brand-background)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg text-[var(--workspace-brand-foreground)]">
              Total
            </span>
            <span className="text-3xl font-semibold text-[var(--workspace-brand-foreground)]">
              {formatCartMoney(totals.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--workspace-brand-line)] px-6 py-5">
        <div className="flex flex-wrap items-center gap-5 text-sm text-[var(--workspace-brand-muted)]">
          <span className="inline-flex items-center gap-2">
            <Lock className="h-5 w-5" />
            SSL Secured
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Money-Back Guarantee
          </span>
        </div>
      </div>
    </aside>
  );
}
