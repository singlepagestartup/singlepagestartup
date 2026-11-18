import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import type {
  IModel as IOffer,
  IOfferQuote,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IProps as IOfferApiProps } from "@sps/ecommerce/relations/stores-to-products/sdk/server";

export const variant = "product-price-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  product: IProduct;
  storeId?: IOffer["storeId"];
  offerId?: IOffer["id"];
  /** Catalog display quotes one unit and omits checkout validation messages. */
  readOnly?: boolean;
  quantity?: IOfferQuote["quantity"];
  billingModuleCurrencyId?: IOfferQuote["currencyId"];
  language: string;
  /** Local readers use stores-to-products.find and quote, then currency.findById. */
  apiProps?: Pick<IOfferApiProps["IQuoteProps"], "options">;
}

export interface IComponentPropsExtended extends IComponentProps {
  quote?: IOfferQuote;
  selectedOffer?: IOffer;
  storeTitle?: string;
  currencySymbol?: string;
  pending: boolean;
}
