export const variant = "card-related";

export interface ProductCardRelatedProps {
  variant?: "card-related";
  slug: string;
  image: string;
  category: string;
  priceLabel: string;
  title: string;
  subtitle: string;
  href?: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
}

type IVariantInputs = NonNullable<Partial<ProductCardRelatedProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "card-related";
}

export interface IComponentPropsExtended extends IComponentProps {}
