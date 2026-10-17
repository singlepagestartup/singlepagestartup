export const variant = "card";

export interface ProductCardProps {
  variant?: "card";
  slug: string;
  href?: string;
  target?: "_self" | "_top" | "_blank" | "_parent";
  image: string;
  badge?: string;
  category: string;
  priceLabel: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  techStack: string[];
}

type IVariantInputs = NonNullable<Partial<ProductCardProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "card";
}

export interface IComponentPropsExtended extends IComponentProps {}
