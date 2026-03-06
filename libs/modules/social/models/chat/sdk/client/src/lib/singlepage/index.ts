"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/social/models/chat/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as messageFind,
  type IProps as IMessageFindProps,
  type IResult as IMessageFindResult,
} from "./message-find";

export type IProps = {
  IMessageFindProps: IMessageFindProps;
};

export type IResult = {
  IMessageFindResult: IMessageFindResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  messageFind,
};
