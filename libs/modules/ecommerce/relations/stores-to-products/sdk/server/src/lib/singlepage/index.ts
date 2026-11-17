import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";

import { action as quote, type IProps as IQuoteProps } from "./quote";
export type IProps = { IQuoteProps: IQuoteProps };

export type IResult = {};

export const api = {
  quote,
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
  }),
};
