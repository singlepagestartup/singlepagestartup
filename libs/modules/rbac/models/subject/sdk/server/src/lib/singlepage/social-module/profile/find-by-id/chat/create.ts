import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  data: Partial<ISocialModuleChat>;
  options?: Partial<NextRequestOptions>;
}

export type IResult = ISocialModuleChat;

export async function action(props: IProps): Promise<IResult> {
  const { id, socialModuleProfileId, options, host = serverHost, data } = props;

  const formData = prepareFormDataToSend({ data });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
