import type { ProductTierProps } from "../../../product/index";

export const variant = "product-find-tiers";

export type ProductTierItem = ProductTierProps;

export type ProductFindTiersProps = {
  eyebrow: string;
  title: string;
  description: string;
  products: ProductTierItem[];
};

type IVariantInputs = NonNullable<
  Partial<ProductFindTiersProps> & { variant?: "product-find-tiers" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "product-find-tiers";
}

export interface IComponentPropsExtended extends IComponentProps {}
