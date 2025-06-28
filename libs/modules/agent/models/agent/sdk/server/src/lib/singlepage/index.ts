import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/agent/models/agent/sdk/model";
import {
  action as aiOpenAiGpt4oMini,
  type IProps as IAiOpenAiGpt4oMiniProps,
  type IResult as IAiOpenAiGpt4oMiniResult,
} from "./ai/open-ai/gpt-4o-mini";

export type IProps = {
  IAiOpenAiGpt4oMiniProps: IAiOpenAiGpt4oMiniProps;
};

export type IResult = {
  IAiOpenAiGpt4oMiniResult: IAiOpenAiGpt4oMiniResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  aiOpenAiGpt4oMini,
};
