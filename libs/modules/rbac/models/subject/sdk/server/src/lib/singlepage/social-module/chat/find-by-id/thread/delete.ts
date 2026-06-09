import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";

export interface IProps {
  id: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
}

export type IResult = ISocialModuleThread;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleChatId,
    socialModuleThreadId,
    options,
    host = serverHost,
  } = props;

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "DELETE",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/chats/${socialModuleChatId}/threads/${socialModuleThreadId}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
