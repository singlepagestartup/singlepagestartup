import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as IKnowledgeModuleDocument } from "@sps/knowledge/models/document/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
  knowledgeModuleDocumentId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
  data: {
    title: string;
    description: string;
  };
}

export type IResult = IKnowledgeModuleDocument;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    targetSocialModuleProfileId,
    knowledgeModuleDocumentId,
    options,
    host = serverHost,
    data,
  } = props;

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...options?.headers,
    },
    body: JSON.stringify({ data }),
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/profiles/${targetSocialModuleProfileId}/knowledge/documents/${knowledgeModuleDocumentId}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
