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
} from "./actions/checkout";
import {
  action as checkoutAttributes,
  type IProps as ICheckoutAttributesProps,
  type IResult as ICheckoutAttributesResult,
} from "./actions/checkout-attributes";
import {
  action as clearOldOrders,
  type IProps as IChearOldOrdersProps,
  type IResult as IChearOldOrdersResult,
} from "./actions/clear-old-orders";

export type IProps = {
  ICheckoutProps: ICheckoutProps;
  ICheckoutAttributesProps: ICheckoutAttributesProps;
  IChearOldOrdersProps: IChearOldOrdersProps;
};

export type IResult = {
  ICheckoutResult: ICheckoutResult;
  ICheckoutAttributesResult: ICheckoutAttributesResult;
  IChearOldOrdersResult: IChearOldOrdersResult;
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
};
