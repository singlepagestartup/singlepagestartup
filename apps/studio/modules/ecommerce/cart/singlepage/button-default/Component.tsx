import { ShoppingCart } from "../../../../../workspace/utils/components/ModuleIcons";

export interface CartButtonDefaultProps {
  count: number;
  label: string;
  onClick?: () => void;
}

export const defaultCartButtonDefaultProps: CartButtonDefaultProps = {
  count: 1,
  label: "Open cart",
};

export function CartButtonDefault(props?: Partial<CartButtonDefaultProps>) {
  const { count, label, onClick } = {
    ...defaultCartButtonDefaultProps,
    ...props,
  };

  return (
    <button
      aria-label={label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)] transition hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
      data-ds-block="ecommerce.cart.button-default"
      data-ds-layer="singlepage"
      onClick={onClick}
      type="button"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--workspace-brand-accent)] px-1 text-xs font-semibold text-[var(--workspace-brand-on-accent)]">
          {count}
        </span>
      ) : null}
    </button>
  );
}
