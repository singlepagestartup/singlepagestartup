import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import type {
  IChatMessage as ISocialModuleMessage,
  TChatThreadReadResult,
} from "@sps/social/models/message/sdk/model";

export interface IProps<IsIndex extends boolean = false> {
  attachmentIndex?: IsIndex;
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = ISocialModuleMessage[];

export async function action<IsIndex extends boolean = false>(
  props: IProps<IsIndex>,
): Promise<TChatThreadReadResult<IsIndex>> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    socialModuleThreadId,
    params,
    options,
    host = serverHost,
  } = props;

  const stringifiedQuery = QueryString.stringify(
    props.attachmentIndex
      ? { ...params, populate: "attachment-index" }
      : params,
    {
      encodeValuesOnly: true,
    },
  );

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/threads/${socialModuleThreadId}/messages?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: TChatThreadReadResult<IsIndex> }>({
    res,
  });

  const transformedData =
    transformResponseItem<TChatThreadReadResult<IsIndex>>(json);

  return transformedData;
}
