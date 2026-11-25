import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  prepareFormDataToSend,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as IKnowledgeModuleSource } from "@sps/knowledge/models/source/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
  data: {
    files?: File[];
    title: string;
    content: string;
    orderIndex?: number;
    operationKey?: string;
  };
}

export type IResult = IKnowledgeModuleSource;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    targetSocialModuleProfileId,
    options,
    host = serverHost,
    data,
  } = props;

  const multipart = Boolean(data.files?.length);
  const headers = new Headers(options?.headers);
  if (multipart) {
    headers.delete("content-type");
  } else {
    headers.set("content-type", "application/json");
  }
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    ...options,
    headers,
    body: multipart
      ? prepareFormDataToSend({ data })
      : JSON.stringify({ data }),
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/profiles/${targetSocialModuleProfileId}/knowledge/sources`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
