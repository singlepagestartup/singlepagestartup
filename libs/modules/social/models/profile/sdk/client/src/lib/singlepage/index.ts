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
import {
  authorFind,
  authorFindCount,
  authorFindById,
  type IAuthorFindProps,
  type IAuthorFindCountProps,
  type IAuthorFindByIdProps,
  type IAuthorFindResult,
  type IAuthorFindCountResult,
  type IAuthorFindByIdResult,
} from "./authors";

export type IProps = {
  IFindByIdChatFindProps: IFindByIdChatFindProps;
  IAuthorFindProps: IAuthorFindProps;
  IAuthorFindCountProps: IAuthorFindCountProps;
  IAuthorFindByIdProps: IAuthorFindByIdProps;
};

export type IResult = {
  IFindByIdChatFindResult: IFindByIdChatFindResult;
  IAuthorFindResult: IAuthorFindResult;
  IAuthorFindCountResult: IAuthorFindCountResult;
  IAuthorFindByIdResult: IAuthorFindByIdResult;
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
  authorFind,
  authorFindCount,
  authorFindById,
};
