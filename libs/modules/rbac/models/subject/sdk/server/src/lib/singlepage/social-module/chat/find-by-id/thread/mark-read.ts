import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import {
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
  type NextRequestOptions,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
  data: { messageId: string };
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export interface IResult {
  threadId: string;
  unreadCount: number;
  chatUnreadCount: number;
}

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleChatId,
    socialModuleThreadId,
    host = serverHost,
  } = props;
  const response = await fetch(
    `${host}${route}/${id}/social-module/chats/${socialModuleChatId}/threads/${socialModuleThreadId}/read`,
    {
      credentials: "include",
      method: "POST",
      body: prepareFormDataToSend({ data: props.data }),
      ...props.options,
    },
  );
  const result = await responsePipe<{ data: IResult }>({ res: response });
  return transformResponseItem<IResult>(result);
}
