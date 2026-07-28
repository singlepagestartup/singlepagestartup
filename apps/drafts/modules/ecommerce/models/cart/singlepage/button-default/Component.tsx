import { ShoppingCart } from "lucide-react";

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
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      data-ds-block="ecommerce.cart.button-default"
      data-ds-layer="singlepage"
      onClick={onClick}
      type="button"
    >
      <ShoppingCart className="h-4 w-4" />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}
