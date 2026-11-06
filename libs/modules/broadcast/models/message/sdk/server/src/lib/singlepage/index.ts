import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/broadcast/models/message/sdk/model";

import { action as delivery, type IProps as IDeliveryProps } from "./delivery";
import type {
  IDeliveryCommand,
  IDeliveryResult,
} from "@sps/broadcast/models/message/sdk/model";

export type IProps = { IDeliveryProps: IDeliveryProps<IDeliveryCommand> };

export type IResult = { IDeliveryResult: IDeliveryResult<IDeliveryCommand> };

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  delivery,
};
