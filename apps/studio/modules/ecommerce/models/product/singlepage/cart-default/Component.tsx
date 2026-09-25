import { Minus, Plus, Trash2 } from "lucide-react";

import { formatCartMoney } from "../../../cart/shared";

export interface ProductCartDefaultItem {
  id: string;
  slug: string;
  title: string;
  image: string;
  priceLabel: string;
  price: number;
  quantity: number;
}

export interface ProductCartDefaultProps {
  item: ProductCartDefaultItem;
  compact?: boolean;
  href?: string;
  showRemove?: boolean;
  target?: "_blank" | "_parent" | "_self" | "_top";
  onDecrease?: (item: ProductCartDefaultItem) => void;
  onIncrease?: (item: ProductCartDefaultItem) => void;
  onRemove?: (item: ProductCartDefaultItem) => void;
}

export const defaultProductCartDefaultItem: ProductCartDefaultItem = {
  id: "srv-consulting",
  slug: "technical-consulting",
  title: "Technical Consulting",
  image:
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbnN1bHRpbmclMjBtZWV0aW5nfGVufDF8fHx8MTc3MTcxNjY1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  priceLabel: "$250/hr",
  price: 250,
  quantity: 1,
};

export const defaultProductCartDefaultProps: ProductCartDefaultProps = {
  item: defaultProductCartDefaultItem,
  compact: false,
  showRemove: true,
};

export function ProductCartDefault(props?: Partial<ProductCartDefaultProps>) {
  const {
    item,
    compact,
    href,
    showRemove,
    target,
    onDecrease,
    onIncrease,
    onRemove,
  } = {
    ...defaultProductCartDefaultProps,
    ...props,
  };
  const productHref = href ?? `/ecommerce/products/${item.slug}`;

  return (
    <div
      className="flex gap-4"
      data-ds-block="ecommerce.product.cart-default"
      data-ds-layer="singlepage"
    >
      <a
        className="shrink-0 overflow-hidden rounded-lg border border-slate-200"
        href={productHref}
        target={target}
      >
        <img
          alt={item.title}
          className={
            compact ? "h-14 w-14 object-cover" : "h-20 w-20 object-cover"
          }
          src={item.image}
        />
      </a>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <a
              className="block truncate text-sm text-slate-900 no-underline transition hover:text-slate-600"
              href={productHref}
              target={target}
            >
              {item.title}
            </a>
            <span className="mt-0.5 block text-xs text-slate-500">
              {item.priceLabel}
            </span>
          </div>
          {showRemove ? (
            <button
              aria-label={`Remove ${item.title}`}
              className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              onClick={() => onRemove?.(item)}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          {compact ? (
            <span className="text-xs text-slate-500">Qty: {item.quantity}</span>
          ) : (
            <div className="flex items-center">
              <button
                aria-label={`Decrease ${item.title} quantity`}
                className="flex h-7 w-7 items-center justify-center rounded-l-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                onClick={() => onDecrease?.(item)}
                type="button"
              >
                <Minus className="h-3 w-3" />
              </button>
              <div className="flex h-7 w-8 items-center justify-center border-y border-slate-300 bg-white text-xs text-slate-900">
                {item.quantity}
              </div>
              <button
                aria-label={`Increase ${item.title} quantity`}
                className="flex h-7 w-7 items-center justify-center rounded-r-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                onClick={() => onIncrease?.(item)}
                type="button"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
          <span className="text-sm text-slate-900">
            {formatCartMoney(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
