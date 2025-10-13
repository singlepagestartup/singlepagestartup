import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/notification/models/notification/sdk/model";
import {
  action as send,
  type IProps as ISendProps,
  type IResult as ISendResult,
} from "./actions/send";

export type IProps = {
  ISendProps: ISendProps;
};

export type IResult = {
  ISendResult: ISendResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  send,
};
