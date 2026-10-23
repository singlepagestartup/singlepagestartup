import type { ProductCardProps } from "../../../../ecommerce/product";
export const variant =
  "subject-me-ecommerce-module-product-list-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  products?: ProductCardProps[];
  state?: "configured" | "empty" | "unavailable";
  language?: "en" | "ru";
}
export interface IComponentPropsExtended extends IComponentProps {}
