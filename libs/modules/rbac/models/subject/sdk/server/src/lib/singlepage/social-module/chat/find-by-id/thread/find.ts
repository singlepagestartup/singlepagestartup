import {
  serverHost,
  route,
  type ISocialModuleChatThread,
} from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  id: string;
  socialModuleChatId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    threadId?: string;
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = (ISocialModuleChatThread & {
  lastMessageAt?: Date | string | null;
  lastMessagePreview?: string | null;
  lastMessageAuthorId?: string | null;
  lastMessageHasFiles?: boolean;
  unreadCount?: number;
})[];

export async function action(props: IProps): Promise<IResult> {
  const { id, socialModuleChatId, params, options, host = serverHost } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/chats/${socialModuleChatId}/threads?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
