import type { ReactNode } from "react";
import type { CategoryOverviewProps } from "../../../category";
import type { ProductFindProduct } from "../product-find-card/interface";
export const variant = "category-overview-default";
export interface IComponentProps {
  variant?: "category-overview-default";
  category?: CategoryOverviewProps;
  products?: ProductFindProduct[];
  description?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
