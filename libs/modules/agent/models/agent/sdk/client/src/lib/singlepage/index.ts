"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/agent/models/agent/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as telegramBot,
  type IProps as ITelegramBotProps,
  type IResult as ITelegramBotResult,
} from "./telegram-bot";

export type IProps = {
  ITelegramBotProps: ITelegramBotProps;
};

export type IResult = {
  ITelegramBotResult: ITelegramBotResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  telegramBot,
};
