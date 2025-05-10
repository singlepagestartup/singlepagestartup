"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/ecommerce/models/order/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as total,
  type IProps as ITotalProps,
  type IResult as ITotalResult,
} from "./total";
import {
  action as quantity,
  type IProps as IQuantityProps,
  type IResult as IQuantityResult,
} from "./quantity";

export type IProps = {
  ITotalProps: ITotalProps;
  IQuantityProps: IQuantityProps;
};

export type IResult = {
  ITotalResult: ITotalResult;
  IQuantityResult: IQuantityResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  total,
  quantity,
};
