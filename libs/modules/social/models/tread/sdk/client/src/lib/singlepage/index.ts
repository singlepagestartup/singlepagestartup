"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/social/models/tread/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export type IProps = {};

export type IResult = {};

export const api = factory<IModel>({
  queryClient,
  route,
  host: clientHost,
  params: query,
  options,
});
