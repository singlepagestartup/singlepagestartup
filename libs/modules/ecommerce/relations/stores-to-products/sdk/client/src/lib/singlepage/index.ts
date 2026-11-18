"use client";

import {
  IModel,
  route,
  clientHost,
  options,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

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
    queryClient,
    route,
    host: clientHost,
    options,
  }),
};
