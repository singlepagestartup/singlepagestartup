import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/permission/sdk/model";
import {
  action as findByRoute,
  type IProps as IFoundByRouteProps,
  type IResult as IFoundByRouteResult,
} from "./find-by-route";

export type IProps = {
  IFoundByRouteProps: IFoundByRouteProps;
};

export type IResult = {
  IFoundByRouteResult: IFoundByRouteResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  findByRoute,
};
