import type { ReactNode } from "react";
import type { GalleryImage } from "../gallery/interface";
import type { ProductCardCategory } from "../card/interface";
import type { ProductOverviewCtaProps } from "../overview-cta/interface";

import type { ProductOverviewPurchaseProps } from "../overview-purchase/interface";

export const variant = "overview-default";

export interface ProductOverviewBreadcrumbItem {
  label: string;
  href: string;
}

export interface ProductOverviewHero {
  image: string;
  title: string;
  subtitle: string;
  category: string;
  badge?: string;
  description: string;
  breadcrumb: ProductOverviewBreadcrumbItem[];
}

export interface ProductOverviewStat {
  value: string;
  label: string;
}

export interface ProductOverviewRelatedProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  priceLabel: string;
  image: string;
  href?: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
}

export interface ProductOverviewDefaultProps {
  variant?: "overview-default";
  hero: ProductOverviewHero;
  descriptionContent?: ReactNode;
  gallery?: GalleryImage[];
  categories?: ProductCardCategory[];
  stats: ProductOverviewStat[];
  related: ProductOverviewRelatedProduct[];
  purchase: Partial<ProductOverviewPurchaseProps>;
  cta: Partial<ProductOverviewCtaProps>;
}

type IVariantInputs = NonNullable<Partial<ProductOverviewDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "overview-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
