"use client";

import {
  IModel,
  route,
  clientHost,
  options,
} from "@sps/host/relations/pages-to-metadata/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export type IProps = {};

export type IResult = {};

export const api = factory<IModel>({
  queryClient,
  route,
  host: clientHost,
  options,
});
