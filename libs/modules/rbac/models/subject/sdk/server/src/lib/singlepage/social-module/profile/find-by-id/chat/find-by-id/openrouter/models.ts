import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import type {
  IProviderChatModelGroup,
  IProviderChatModelOption,
  IProviderChatModelsResult,
} from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
  type IProviderModelReasoning,
  type TProviderReasoningEffort,
} from "@sps/shared-utils";

export type TOpenRouterReasoningEffort = TProviderReasoningEffort;
export type IOpenRouterChatModelReasoning = IProviderModelReasoning;
export type IOpenRouterChatModelOption = IProviderChatModelOption;
export type IOpenRouterChatModelGroup = IProviderChatModelGroup;
export type IOpenRouterChatModelsResult = IProviderChatModelsResult;

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleThreadId?: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
}

export type IResult = IOpenRouterChatModelsResult;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    socialModuleThreadId,
    options,
    host = serverHost,
  } = props;
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };
  const url = new URL(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/openrouter/models`,
  );
  if (socialModuleThreadId) {
    url.searchParams.set("threadId", socialModuleThreadId);
  }
  const res = await fetch(url.toString(), requestOptions);
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
