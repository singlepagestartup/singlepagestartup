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
  action as providerWebhook,
  type IProps as IProviderWebhookProps,
  type IResult as IProviderWebhookResult,
} from "./provider-webhook";
import {
  action as check,
  type IProps as ICheckProps,
  type IResult as ICheckResult,
} from "./check";

export type IProps = {
  ICheckProps: ICheckProps;
  IProviderProps: IProviderProps;
  IProviderWebhookProps: IProviderWebhookProps;
};

export type IResult = {
  ICheckResult: ICheckResult;
  IProviderResult: IProviderResult;
  IProviderWebhookResult: IProviderWebhookResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  provider,
  providerWebhook,
  check,
};
