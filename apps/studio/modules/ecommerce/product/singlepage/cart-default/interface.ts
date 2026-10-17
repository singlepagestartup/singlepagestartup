export const variant = "cart-default";

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
  variant?: "cart-default";
  item: ProductCartDefaultItem;
  compact?: boolean;
  href?: string;
  showRemove?: boolean;
  target?: "_blank" | "_parent" | "_self" | "_top";
  onDecrease?: (item: ProductCartDefaultItem) => void;
  onIncrease?: (item: ProductCartDefaultItem) => void;
  onRemove?: (item: ProductCartDefaultItem) => void;
}

type IVariantInputs = NonNullable<Partial<ProductCartDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "cart-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
