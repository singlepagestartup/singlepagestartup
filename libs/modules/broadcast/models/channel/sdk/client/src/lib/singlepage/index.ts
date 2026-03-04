"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/broadcast/models/channel/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as pushMessage,
  type IProps as IPushMessageProps,
  type IResult as IPushMessageResult,
} from "./push-message";
import {
  action as messageFind,
  type IProps as IMessageFindProps,
  type IResult as IMessageFindResult,
} from "./message-find";
import {
  action as messageCreate,
  type IProps as IMessageCreateProps,
  type IResult as IMessageCreateResult,
} from "./message-create";
import {
  action as messageDelete,
  type IProps as IMessageDeleteProps,
  type IResult as IMessageDeleteResult,
} from "./message-delete";

export type IProps = {
  IPushMessageProps: IPushMessageProps;
  IMessageFindProps: IMessageFindProps;
  IMessageCreateProps: IMessageCreateProps;
  IMessageDeleteProps: IMessageDeleteProps;
};

export type IResult = {
  IPushMessageResult: IPushMessageResult;
  IMessageFindResult: IMessageFindResult;
  IMessageCreateResult: IMessageCreateResult;
  IMessageDeleteResult: IMessageDeleteResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  pushMessage,
  messageFind,
  messageCreate,
  messageDelete,
};
