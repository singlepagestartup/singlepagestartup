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
import {
  action as telegramCommands,
  type IProps as ITelegramCommandsProps,
  type IResult as ITelegramCommandsResult,
} from "./telegram-commands";

export type IProps = {
  ITelegramBotProps: ITelegramBotProps;
  ITelegramCommandsProps: ITelegramCommandsProps;
};

export type IResult = {
  ITelegramBotResult: ITelegramBotResult;
  ITelegramCommandsResult: ITelegramCommandsResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  telegramBot,
  telegramCommands,
};
