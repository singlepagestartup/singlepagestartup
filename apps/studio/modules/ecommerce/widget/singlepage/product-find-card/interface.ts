export const variant = "product-find-card";

export interface ProductFindCategory {
  slug: string;
  label: string;
}

import type { ProductCardProps } from "../../../product";
import type { ReactNode } from "react";
export interface ProductFindProduct
  extends Omit<ProductCardProps, "variant" | "id"> {
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
  embedded?: boolean;
  title?: string;
  description?: ReactNode;
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
