import type { ProductCardProps, IProductCardSelection } from "../../../product";

export const variant = "token-find";

export interface ITokenCatalogOffer {
  product: Omit<ProductCardProps, "variant" | "onAddToCart" | "onCheckout">;
  tokens: number;
}

export interface IComponentProps {
  variant?: "token-find";
  pro?: ITokenCatalogOffer;
  topups?: ITokenCatalogOffer[];
  registrationAllowance?: number;
  tokenRate?: number;
  registrationHref?: string;
  chatHref?: string;
  frameworkHref?: string;
  linkTarget?: "_self" | "_top";
}

export interface IComponentPropsExtended {
  variant: "token-find";
  pro: ITokenCatalogOffer;
  topups: ITokenCatalogOffer[];
  registrationAllowance: number;
  tokenRate: number;
  registrationHref: string;
  chatHref: string;
  frameworkHref: string;
  linkTarget: "_self" | "_top";
}

export interface ITokenPackChoiceProps {
  offer: ITokenCatalogOffer;
  selected: boolean;
  name: string;
  onSelect: (productId: string) => void;
}

export interface ITokenCatalogSelection {
  action: "cart" | "checkout";
  selection: IProductCardSelection;
}
