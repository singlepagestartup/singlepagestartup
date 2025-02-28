"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/crm/models/form/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as requestCreate,
  type IProps as IRequestCreteProps,
  type IResult as IRequestCreteResult,
} from "./actions/request/create";

export type IProps = {
  IRequestCreteProps: IRequestCreteProps;
};

export type IResult = {
  IRequestCreteResult: IRequestCreteResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  requestCreate,
};
