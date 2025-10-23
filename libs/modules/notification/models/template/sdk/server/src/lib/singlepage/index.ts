import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/notification/models/template/sdk/model";

import {
  action as render,
  type IProps as IRenderProps,
  type IResult as IRenderResult,
} from "./actions/render";

export type IProps = {
  IRenderProps: IRenderProps;
};

export type IResult = {
  IRenderResult: IRenderResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  render,
};
