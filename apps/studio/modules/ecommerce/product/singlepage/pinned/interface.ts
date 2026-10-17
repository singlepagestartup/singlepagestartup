export const variant = "pinned";

export interface ProductPinnedProps {
  variant?: "pinned";
  slug: string;
  title: string;
  shortDescription: string;
  priceLabel: string;
  category: string;
  href?: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
}

type IVariantInputs = NonNullable<Partial<ProductPinnedProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "pinned";
}

export interface IComponentPropsExtended extends IComponentProps {}
