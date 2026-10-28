import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/social/models/profile/sdk/model";
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
    route,
    host: serverHost,
    options,
    params: query,
  }),
  findByIdChatFind,
  authorFind,
  authorFindCount,
  authorFindById,
};
