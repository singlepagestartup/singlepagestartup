import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/ecommerce/models/attribute/sdk/model";
import {
  action as billingModuleCurrencyFind,
  type IProps as IBillingModuleCurrencyFindProps,
  type IResult as IBillingModuleCurrencyFindResult,
} from "./billing-module-currency-find";

export type IProps = {
  IBillingModuleCurrencyFindProps: IBillingModuleCurrencyFindProps;
};

export type IResult = {
  IBillingModuleCurrencyFindResult: IBillingModuleCurrencyFindResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  billingModuleCurrencyFind,
};
