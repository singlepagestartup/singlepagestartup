import {
  action as message,
  type IProps as IMessageProps,
  type IResult as IMessageResult,
} from "./message";
import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  options,
} from "@sps/broadcast/relations/channels-to-messages/sdk/model";

export type IProps = { IMessageProps: IMessageProps };

export type IResult = { IMessageResult: IMessageResult };

export const api = {
  message,
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
  }),
};
