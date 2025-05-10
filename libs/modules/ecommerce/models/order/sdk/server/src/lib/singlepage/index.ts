import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/ecommerce/models/order/sdk/model";
import {
  action as checkout,
  type IProps as ICheckoutProps,
  type IResult as ICheckoutResult,
} from "./checkout";
import {
  action as checkoutAttributes,
  type IProps as ICheckoutAttributesProps,
  type IResult as ICheckoutAttributesResult,
} from "./checkout-attributes";
import {
  action as clearOldOrders,
  type IProps as IChearOldOrdersProps,
  type IResult as IChearOldOrdersResult,
} from "./clear-old-orders";
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
  ICheckoutProps: ICheckoutProps;
  ICheckoutAttributesProps: ICheckoutAttributesProps;
  IChearOldOrdersProps: IChearOldOrdersProps;
  ITotalProps: ITotalProps;
  IQuantityProps: IQuantityProps;
};

export type IResult = {
  ICheckoutResult: ICheckoutResult;
  ICheckoutAttributesResult: ICheckoutAttributesResult;
  IChearOldOrdersResult: IChearOldOrdersResult;
  ITotalResult: ITotalResult;
  IQuantityResult: IQuantityResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  checkout,
  checkoutAttributes,
  clearOldOrders,
  total,
  quantity,
};
