export const variant = "product-find-card";

export interface ProductFindCategory {
  slug: string;
  label: string;
}

export interface ProductFindProduct {
  id: string;
  slug: string;
  href?: string;
  title: string;
  subtitle: string;
  category: string;
  priceLabel: string;
  badge?: string;
  image: string;
  shortDescription: string;
  techStack: string[];
}

export type ProductFindCardProps = {
  categories: ProductFindCategory[];
  products: ProductFindProduct[];
};

type IVariantInputs = NonNullable<
  Partial<ProductFindCardProps> & { variant?: "product-find-card" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "product-find-card";
}

export interface IComponentPropsExtended extends IComponentProps {}
