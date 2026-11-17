import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";

import { action as quote, type IProps as IQuoteProps } from "./quote";
import {
  action as addressSuggestions,
  type IProps as IAddressSuggestionsProps,
} from "./address-suggestions";
export type IProps = {
  IQuoteProps: IQuoteProps;
  IAddressSuggestionsProps: IAddressSuggestionsProps;
};

export type IResult = {};

export const api = {
  quote,
  addressSuggestions,
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
  }),
};
