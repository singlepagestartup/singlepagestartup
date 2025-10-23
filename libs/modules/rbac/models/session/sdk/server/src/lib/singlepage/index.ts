import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/session/sdk/model";
import {
  action as init,
  type IProps as IInitProps,
  type IResult as IInitResult,
} from "./init";

export type IProps = {
  IInitProps: IInitProps;
};

export type IResult = {
  IInitResult: IInitResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    params: query,
    options,
  }),
  init,
};
