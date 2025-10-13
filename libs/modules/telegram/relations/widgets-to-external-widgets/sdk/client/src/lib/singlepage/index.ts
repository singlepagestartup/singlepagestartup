"use client";

import {
  IModel,
  route,
  clientHost,
  options,
} from "@sps/telegram/relations/widgets-to-external-widgets/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export const api = factory<IModel>({
  queryClient,
  route,
  host: clientHost,
  options,
});
