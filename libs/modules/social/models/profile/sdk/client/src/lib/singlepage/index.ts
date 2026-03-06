"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/social/models/profile/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as findByIdChatFind,
  type IFindByIdChatFindProps,
  type IFindByIdChatFindResult,
} from "./chat-find";

export type IProps = {
  IFindByIdChatFindProps: IFindByIdChatFindProps;
};

export type IResult = {
  IFindByIdChatFindResult: IFindByIdChatFindResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  findByIdChatFind,
};
