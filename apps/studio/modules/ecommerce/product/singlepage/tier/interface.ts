export const variant = "tier";

export type ProductTierVariant = "default" | "featured";

export interface ProductTierProps {
  variant?: "tier";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  appearance?: ProductTierVariant;
  badge?: string;
  featured?: boolean;
  className?: string;
}

type IVariantInputs = NonNullable<Partial<ProductTierProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "tier";
}

export interface IComponentPropsExtended extends IComponentProps {}
