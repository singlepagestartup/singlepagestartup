"use client";

import {
  IModel,
  route,
  clientHost,
  options,
} from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as total,
  type IProps as ITotalProps,
  type IResult as ITotalResult,
} from "./total";

export type IProps = {
  ITotalProps: ITotalProps;
};

export type IResult = {
  ITotalResult: ITotalResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    options,
  }),
  total,
};
