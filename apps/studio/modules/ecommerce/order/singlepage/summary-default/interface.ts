import type { CartItem } from "../../../cart/shared";

export const variant = "summary-default";

export interface OrderSummaryDefaultProps {
  variant?: "summary-default";
  items: CartItem[];
  compact?: boolean;
  editable?: boolean;
  onDecrease?: (item: CartItem) => void;
  onIncrease?: (item: CartItem) => void;
  onRemove?: (item: CartItem) => void;
}

type IVariantInputs = NonNullable<Partial<OrderSummaryDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "summary-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
