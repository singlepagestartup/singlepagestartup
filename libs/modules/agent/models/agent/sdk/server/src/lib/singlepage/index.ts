import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/agent/models/agent/sdk/model";
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
    route,
    host: serverHost,
    options,
    params: query,
  }),
  telegramBot,
};
