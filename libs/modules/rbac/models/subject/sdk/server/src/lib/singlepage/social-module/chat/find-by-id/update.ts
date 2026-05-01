import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";

type ILocalizedChatText = Record<string, string | undefined>;

export interface IProps {
  id: string;
  socialModuleChatId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: Partial<Omit<ISocialModuleChat, "title" | "description">> & {
    title: ILocalizedChatText;
    description?: ILocalizedChatText;
  };
}

export type IResult = ISocialModuleChat;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleChatId,
    params,
    options,
    host = serverHost,
    data,
  } = props;

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "PATCH",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/chats/${socialModuleChatId}?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
