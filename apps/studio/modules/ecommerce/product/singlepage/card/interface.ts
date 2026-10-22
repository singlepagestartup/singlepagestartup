export const variant = "card";

export interface IProductCardAttribute {
  id: string;
  label: string;
  value: string;
}

export interface IProductCardPrice {
  id: string;
  code: string;
  symbol: string;
  amount: number;
  compareAtAmount?: number;
  interval?: string;
}

export interface IProductCardOptionValue {
  id: string;
  label: string;
  priceAdjustments?: Record<string, number>;
  disabled?: boolean;
}

export interface IProductCardOption {
  id: string;
  label: string;
  values: IProductCardOptionValue[];
}

export interface IProductCardPaymentMethod {
  id: string;
  label: string;
  description: string;
  icon?: "credit-card" | "wallet" | "bank" | "currency-circle-dollar";
  currencyIds?: string[];
}

export interface IProductCardSelection {
  productId: string;
  quantity: number;
  currencyId: string;
  optionValues: Record<string, string>;
}

export interface IProductCardCheckout extends IProductCardSelection {
  providerId: string;
  email: string;
  comment: string;
}

export interface ProductCardMedia {
  id: string;
  src: string;
  alt: string;
}
export interface ProductCardCategory {
  id: string;
  label: string;
  href: string;
}
export interface ProductCardProps {
  variant?: "card";
  id?: string;
  slug: string;
  href?: string;
  target?: "_self" | "_top" | "_blank" | "_parent";
  image: string;
  media?: ProductCardMedia[];
  categories?: ProductCardCategory[];
  showMedia?: boolean;
  badge?: string;
  category: string;
  priceLabel: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  techStack: string[];
  attributes?: IProductCardAttribute[];
  visibleAttributeCount?: number;
  options?: IProductCardOption[];
  prices?: IProductCardPrice[];
  priceNote?: string;
  paymentMethods?: IProductCardPaymentMethod[];
  initialCurrencyId?: string;
  initialQuantity?: number;
  initialOptionValues?: Record<string, string>;
  initialCheckoutOpen?: boolean;
  quantityLabel?: string;
  maxQuantity?: number;
  available?: boolean;
  className?: string;
  onAddToCart?: (selection: IProductCardSelection) => void | Promise<void>;
  onCheckout?: (checkout: IProductCardCheckout) => void | Promise<void>;
}

type IVariantInputs = NonNullable<Partial<ProductCardProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "card";
}

export interface IComponentPropsExtended extends ProductCardProps {
  attributes: IProductCardAttribute[];
  options: IProductCardOption[];
  prices: IProductCardPrice[];
  paymentMethods: IProductCardPaymentMethod[];
}
