import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/ecommerce/models/order/sdk/model";
import {
  action as checkoutAttributes,
  type IProps as ICheckoutAttributesProps,
  type IResult as ICheckoutAttributesResult,
} from "./checkout-attributes";
import {
  action as checkoutAttributesByCurrency,
  type IProps as ICheckoutAttributesByCurrencyProps,
  type IResult as ICheckoutAttributesByCurrencyResult,
} from "./checkout-attributes-by-currency";
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
import {
  action as ordersToProductsUpdate,
  type IProps as IOrdersToProductsUpdateProps,
  type IResult as IOrdersToProductsUpdateResult,
} from "./orders-to-products/update";
import {
  action as check,
  type IProps as ICheckProps,
  type IResult as ICheckResult,
} from "./check";

export type IProps = {
  ICheckoutAttributesProps: ICheckoutAttributesProps;
  ICheckoutAttributesByCurrencyProps: ICheckoutAttributesByCurrencyProps;
  IChearOldOrdersProps: IChearOldOrdersProps;
  ITotalProps: ITotalProps;
  IQuantityProps: IQuantityProps;
  IOrdersToProductsUpdateProps: IOrdersToProductsUpdateProps;
  ICheckProps: ICheckProps;
};

export type IResult = {
  ICheckoutAttributesResult: ICheckoutAttributesResult;
  ICheckoutAttributesByCurrencyResult: ICheckoutAttributesByCurrencyResult;
  IChearOldOrdersResult: IChearOldOrdersResult;
  ITotalResult: ITotalResult;
  IQuantityResult: IQuantityResult;
  IOrdersToProductsUpdateResult: IOrdersToProductsUpdateResult;
  ICheckResult: ICheckResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  checkoutAttributes,
  clearOldOrders,
  total,
  quantity,
  ordersToProductsUpdate,
  check,
  checkoutAttributesByCurrency,
};
