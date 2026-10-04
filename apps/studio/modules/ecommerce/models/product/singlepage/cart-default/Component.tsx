import { memo } from "react";
import { Button } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Minus,
  Plus,
  Trash2,
} from "../../../../../../workspace/utils/components/ModuleIcons";

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
  image: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
    import.meta.url,
  ).href,
  priceLabel: "$250/hr",
  price: 250,
  quantity: 1,
};

export const defaultProductCartDefaultProps: ProductCartDefaultProps = {
  item: defaultProductCartDefaultItem,
  compact: false,
  showRemove: true,
};

export const ProductCartDefault = memo(function ProductCartDefault(
  props: Partial<ProductCartDefaultProps>,
) {
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
      className="flex min-w-0 gap-3 sm:gap-4"
      data-ds-block="ecommerce.product.cart-default"
      data-ds-layer="singlepage"
    >
      <a
        className="block h-20 w-20 shrink-0 self-start overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
        href={productHref}
        target={target}
      >
        <img
          alt={item.title}
          className="block h-full w-full object-cover"
          src={item.image}
        />
      </a>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <a
              className="block break-words text-sm font-semibold text-[var(--workspace-brand-foreground)] no-underline transition hover:text-[var(--workspace-brand-muted)]"
              href={productHref}
              target={target}
            >
              {item.title}
            </a>
            <span className="mt-0.5 block text-xs text-[var(--workspace-brand-muted)]">
              {item.priceLabel}
            </span>
          </div>
          {showRemove ? (
            <Button
              variant="plain"
              aria-label={`Remove ${item.title}`}
              className="h-11 w-11 shrink-0 px-0 hover:bg-[var(--workspace-brand-danger-surface)] hover:text-[var(--workspace-brand-danger)]"
              onClick={() => onRemove?.(item)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          {compact ? (
            <span className="text-xs text-[var(--workspace-brand-muted)]">
              Qty: {item.quantity}
            </span>
          ) : (
            <div
              role="group"
              aria-label={`${item.title} quantity`}
              className="flex items-center gap-1 rounded-xl bg-[var(--workspace-brand-background)] p-1"
            >
              <Button
                variant="plain"
                aria-label={`Decrease ${item.title} quantity`}
                className="h-11 w-11 px-0"
                onClick={() => onDecrease?.(item)}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <output
                className="min-w-6 text-center text-sm font-semibold"
                aria-live="polite"
              >
                {item.quantity}
              </output>
              <Button
                variant="plain"
                aria-label={`Increase ${item.title} quantity`}
                className="h-11 w-11 px-0"
                onClick={() => onIncrease?.(item)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          )}
          <span className="text-sm font-semibold text-[var(--workspace-brand-foreground)]">
            {formatCartMoney(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
});
