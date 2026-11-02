import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/action/sdk/model";

import {
  action as consume,
  type IProps as IConsumeProps,
  type IResult as IConsumeResult,
} from "./consume";

export type IProps = {
  IConsumeProps: IConsumeProps;
};

export type IResult = {
  IConsumeResult: IConsumeResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    params: query,
    options,
  }),
  consume,
};
