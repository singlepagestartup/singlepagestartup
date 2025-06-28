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
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  aiOpenAiGpt4oMini,
};
