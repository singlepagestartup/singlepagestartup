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

export type IProps = {
  IFindByIdChatFindProps: IFindByIdChatFindProps;
};

export type IResult = {
  IFindByIdChatFindResult: IFindByIdChatFindResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  findByIdChatFind,
};
