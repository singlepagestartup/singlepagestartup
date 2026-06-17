import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IKnowledgeIndexResponse } from "@sps/knowledge/sdk/model";

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
}

export type IResult = IKnowledgeIndexResponse["data"];

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    targetSocialModuleProfileId,
    knowledgeModuleDocumentId,
    options,
    host = serverHost,
  } = props;

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/profiles/${targetSocialModuleProfileId}/knowledge/documents/${knowledgeModuleDocumentId}/reindex`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
