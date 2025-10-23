import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/notification/models/topic/sdk/model";
import {
  action as sendAll,
  type IProps as ISendAllProps,
  type IResult as ISendAllResult,
} from "./actions/send-all";

export type IProps = {
  ISendAllProps: ISendAllProps;
};

export type IResult = {
  ISendAllResult: ISendAllResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  sendAll,
};
