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
export type IProps = { IQuoteProps: IQuoteProps };

export type IResult = {};

export const api = {
  quote,
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    options,
  }),
};
