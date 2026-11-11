import {
  action as publicResourceIds,
  type IProps as IPublicResourceIdsProps,
  type IResult as IPublicResourceIdsResult,
} from "./public-resource-ids";
import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/role/sdk/model";

export type IProps = { IPublicResourceIdsProps: IPublicResourceIdsProps };

export type IResult = { IPublicResourceIdsResult: IPublicResourceIdsResult };

export const api = {
  publicResourceIds,
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
};
