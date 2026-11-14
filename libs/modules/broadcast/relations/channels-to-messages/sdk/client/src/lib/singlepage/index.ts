"use client";

import {
  action as message,
  type IProps as IMessageProps,
  type IResult as IMessageResult,
} from "./message";
import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/broadcast/relations/channels-to-messages/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export type IProps = { IMessageProps: IMessageProps };

export type IResult = { IMessageResult: IMessageResult };

export const api = {
  message,
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
};
