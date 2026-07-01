import { Lock, ShieldCheck } from "lucide-react";

import {
  formatCartMoney,
  getCartTotals,
  type CartItem,
} from "../../../cart/shared";
import { ProductCartDefault } from "../../../product/singlepage/cart-default/Component";
import { defaultCheckoutItems } from "../../shared";

const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-cart-flow-default--default";

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
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      data-ds-block="ecommerce.order.summary-default"
      data-ds-layer="singlepage"
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-xl font-medium text-slate-900">Order Summary</h3>
        <p className="mt-1 text-base text-slate-500">
          {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <ul className="divide-y divide-slate-100 px-6">
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

      <div className="space-y-3 border-t border-slate-100 px-6 py-5">
        <div className="flex justify-between text-base text-slate-500">
          <span>Subtotal</span>
          <span>{formatCartMoney(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-base text-slate-500">
          <span>Consultation discount</span>
          <span className="text-emerald-600">
            -{formatCartMoney(totals.discount)}
          </span>
        </div>
        <div className="flex justify-between text-base text-slate-500">
          <span>Tax</span>
          <span>$0</span>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg text-slate-900">Total</span>
            <span className="text-3xl text-slate-900">
              {formatCartMoney(totals.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-center gap-5 text-base text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4" />
            SSL Secured
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Money-Back Guarantee
          </span>
        </div>
      </div>
    </aside>
  );
}
