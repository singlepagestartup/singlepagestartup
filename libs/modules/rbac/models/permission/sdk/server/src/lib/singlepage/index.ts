import { factory } from "@sps/shared-frontend-server-api";
import {
  action as publicResourceIds,
  type IProps as IPublicResourceIdsProps,
  type IResult as IPublicResourceIdsResult,
} from "./public-resource-ids";
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
import {
  action as resolveByRoute,
  type IProps as IResolveByRouteProps,
  type IResult as IResolveByRouteResult,
} from "./resolve-by-route";

export type IProps = {
  IPublicResourceIdsProps: IPublicResourceIdsProps;
  IFoundByRouteProps: IFoundByRouteProps;
  IResolveByRouteProps: IResolveByRouteProps;
};

export type IResult = {
  IPublicResourceIdsResult: IPublicResourceIdsResult;
  IFoundByRouteResult: IFoundByRouteResult;
  IResolveByRouteResult: IResolveByRouteResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  findByRoute,
  resolveByRoute,
  publicResourceIds,
};
