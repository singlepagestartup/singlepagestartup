import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/billing/models/payment-intent/sdk/model";
import {
  action as provider,
  type IProps as IProviderProps,
  type IResult as IProviderResult,
} from "./provider";
import {
  action as check,
  type IProps as ICheckProps,
  type IResult as ICheckResult,
} from "./check";

export type IProps = {
  ICheckProps: ICheckProps;
  IProviderProps: IProviderProps;
};

export type IResult = {
  ICheckResult: ICheckResult;
  IProviderResult: IProviderResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  provider,
  check,
};
