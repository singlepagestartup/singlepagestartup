export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import type {
  IModel,
  IEcommerceCartSelection,
} from "@sps/rbac/models/subject/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import type { ReactNode } from "react";
import type { IOfferQuote } from "@sps/ecommerce/relations/stores-to-products/sdk/model";

export const variant = "ecommerce-module-order-create-default" as const;

export interface IConfiguredPurchase {
  selection: IEcommerceCartSelection;
  storeId: string;
  expectedQuoteVersion: string;
  quote: IOfferQuote;
  currencySymbol: string;
}

export interface IConfiguratorActions {
  refreshQuote: () => Promise<unknown>;
  /** Only idle payment UI hides while the fresh configurator is absent. */
  hideWhenIdle: boolean;
}

export interface IOfferPriceProviderProps {
  children: ReactNode;
}

export interface IOfferPriceProps extends IOfferPriceProviderProps {
  product: IEcommerceModuleProduct;
  storeId?: string;
  language: string;
}

export interface IOfferPriceSelection {
  productId: string;
  storeId?: string;
  offerId: string;
  billingModuleCurrencyId: string;
}

export interface IComponentProps extends IParentComponentProps<
  IModel,
  typeof variant
> {
  language: string;
  ecommerceModuleProduct: IEcommerceModuleProduct;
  ecommerceModuleStore?: IEcommerceModuleStore;
  ecommerceModuleOfferId?: string;
  openServiceDiscussionOnSubmit?: boolean;
  excludedOfferIds?: string[];
  /** Hide the new-item form while preserving an active payment slot. */
  hideConfiguration?: boolean;
  /** Client composition slot; shares the exact quoted selection with payment. */
  checkoutSlot?: (
    configuration: IConfiguredPurchase | undefined,
    actions: IConfiguratorActions,
  ) => ReactNode;
  billingModule?: {
    currency?: IBillingModuleCurrency;
  };
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

export interface IProductWithOfferPriceProps extends IOfferPriceProps {
  variant: "default" | "overview-default";
  isServer: boolean;
  topSlot?: ReactNode;
  middleSlot?: ReactNode;
}
