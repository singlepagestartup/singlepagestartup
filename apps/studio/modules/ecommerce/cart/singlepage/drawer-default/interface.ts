import type { CartItem } from "../../shared";

export const variant = "drawer-default";

export interface CartDrawerDefaultProps {
  variant?: "drawer-default";
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

type IVariantInputs = NonNullable<Partial<CartDrawerDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "drawer-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
