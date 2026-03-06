import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/social/models/chat/sdk/model";
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
    route,
    host: serverHost,
    options,
    params: query,
  }),
  messageFind,
};
